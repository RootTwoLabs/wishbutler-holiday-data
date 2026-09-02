import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithTimeout, fetchJsonWithTimeout, FailureBudget } from './httpClient.mjs';

test('#130 liefert die Response bei Erfolg', async () => {
  const res = await fetchWithTimeout('http://x', {
    fetchImpl: async () => new Response('ok', { status: 200 }),
  });
  assert.equal(res.status, 200);
});

test('#130 wiederholt nach transientem Fehler und gibt dann zurueck', async () => {
  let calls = 0;
  const res = await fetchWithTimeout('http://x', {
    retries: 2,
    backoffMs: 1,
    fetchImpl: async () => {
      calls += 1;
      if (calls < 2) throw new Error('transient');
      return new Response('ok', { status: 200 });
    },
  });
  assert.equal(calls, 2);
  assert.equal(res.status, 200);
});

test('#130 wirft nach Aufbrauchen der Retries', async () => {
  let calls = 0;
  await assert.rejects(
    fetchWithTimeout('http://x', {
      retries: 1,
      backoffMs: 1,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('always');
      },
    }),
  );
  assert.equal(calls, 2); // 1 Versuch + 1 Retry
});

test('#130 bricht einen haengenden Call per Timeout ab', async () => {
  await assert.rejects(
    fetchWithTimeout('http://x', {
      timeoutMs: 30,
      retries: 0,
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(init.signal.reason));
        }),
    }),
  );
});

test('#130 fetchJsonWithTimeout wirft bei !ok', async () => {
  await assert.rejects(
    fetchJsonWithTimeout('http://x', {
      retries: 0,
      fetchImpl: async () => new Response('nope', { status: 500 }),
    }),
  );
});

test('FailureBudget erzwingt Abbruch ueber der Schwelle', () => {
  const b = new FailureBudget({ maxFailureRate: 0.25, minSamples: 4 });
  b.success();
  b.success();
  b.failure();
  b.failure();
  assert.equal(b.exceeded(), true);
  assert.throws(() => b.assertWithinBudget('test'));
});

test('FailureBudget toleriert wenige Fehler', () => {
  const b = new FailureBudget({ maxFailureRate: 0.25, minSamples: 4 });
  for (let i = 0; i < 9; i++) b.success();
  b.failure();
  assert.equal(b.exceeded(), false);
});
