/**
 * #130 — Robuster HTTP-Client fuer die Build-Pipeline.
 *
 * Naive `fetch()`-Aufrufe (ohne Timeout/Retry) koennen den Build unbegrenzt
 * haengen lassen und erzeugen bei transienten Fehlern stille Datenluecken.
 * Dieser Wrapper bricht per AbortController nach `timeoutMs` ab und wiederholt
 * mit exponentiellem Backoff bis zu `retries` Mal.
 *
 * Zusaetzlich `FailureBudget`: zaehlt Fehler ueber einen Build-Schritt; wird die
 * Schwelle ueberschritten, soll der Schritt HART fehlschlagen, statt stillschweigend
 * unvollstaendige Pakete zu schreiben.
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url,
  { timeoutMs = 15000, retries = 2, backoffMs = 500, fetchImpl = fetch, ...init } = {},
) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new Error(`timeout after ${timeoutMs}ms`)),
      timeoutMs,
    );
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) await sleep(backoffMs * 2 ** attempt);
    }
  }
  throw lastErr ?? new Error(`fetch failed: ${url}`);
}

export async function fetchJsonWithTimeout(url, opts) {
  const res = await fetchWithTimeout(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/**
 * Zaehlt Erfolge/Fehler eines Build-Schritts und erzwingt einen harten Abbruch,
 * sobald die Fehlerquote `maxFailureRate` (bei mind. `minSamples` Versuchen)
 * ueberschreitet — verhindert stille, unvollstaendige Releases.
 */
export class FailureBudget {
  constructor({ maxFailureRate = 0.25, minSamples = 8 } = {}) {
    this.maxFailureRate = maxFailureRate;
    this.minSamples = minSamples;
    this.ok = 0;
    this.failed = 0;
  }
  success() {
    this.ok += 1;
  }
  failure() {
    this.failed += 1;
  }
  get total() {
    return this.ok + this.failed;
  }
  get rate() {
    return this.total === 0 ? 0 : this.failed / this.total;
  }
  exceeded() {
    return this.total >= this.minSamples && this.rate > this.maxFailureRate;
  }
  assertWithinBudget(label = 'fetch') {
    if (this.exceeded()) {
      throw new Error(
        `${label}: failure budget exceeded (${this.failed}/${this.total} = ${(this.rate * 100).toFixed(0)}% > ${(this.maxFailureRate * 100).toFixed(0)}%)`,
      );
    }
  }
}
