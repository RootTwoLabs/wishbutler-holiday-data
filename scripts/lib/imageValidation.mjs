/**
 * #131 — Validierung heruntergeladener Bild-Bytes, bevor sie ins Repo geschrieben
 * werden. Ohne Pruefung koennte ein manipuliertes/kompromittiertes API-Ergebnis
 * beliebige (nicht-Bild- oder ueberdimensionierte) Inhalte einschleusen, die spaeter
 * an Clients ausgeliefert werden.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB Obergrenze pro Bild

/**
 * Erkennt den Bildtyp anhand der Magic-Bytes. Gibt 'jpeg' | 'png' | 'webp'
 * zurueck, sonst null (kein bekanntes Bildformat).
 */
export function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png';
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

/** Whether `contentType` is an image/* type. */
export function isImageContentType(contentType) {
  return typeof contentType === 'string' && contentType.toLowerCase().startsWith('image/');
}
