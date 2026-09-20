import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  commonsTitleFromUrl,
  normalizeLicense,
  authorsDifferMaterially,
  isPlaceholderAuthor,
  compareCredit,
} from './creditVerification.mjs';

const line = (over = {}) => ({
  path: 'images/new_year/01.jpg',
  credit: 'Vyacheslav Argenberg',
  license: 'CC BY 4.0',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  ...over,
});

test('commonsTitleFromUrl: Dateiseite -> API-Titel, alles andere null', () => {
  assert.equal(
    commonsTitleFromUrl('https://commons.wikimedia.org/wiki/File:Casa_Hist%C3%B3rica_de_Tucum%C3%A1n.jpg'),
    'File:Casa Histórica de Tucumán.jpg',
  );
  assert.equal(
    commonsTitleFromUrl('https://commons.wikimedia.org/wiki/File:2024_Royal_Visit_Sydney_(2).jpg'),
    'File:2024 Royal Visit Sydney (2).jpg',
  );
  assert.equal(commonsTitleFromUrl('https://commons.wikimedia.org/wiki/File:A%2C_B.jpg?uselang=de'), 'File:A, B.jpg');
  assert.equal(commonsTitleFromUrl('https://www.flickr.com/photos/x/1'), null);
  assert.equal(commonsTitleFromUrl('https://commons.wikimedia.org/wiki/Category:Foo'), null);
  assert.equal(commonsTitleFromUrl('https://commons.wikimedia.org/wiki/File:%E0%A4%A'), null); // kaputtes Percent-Encoding
  assert.equal(commonsTitleFromUrl(undefined), null);
});

test('normalizeLicense: Schreibweisen gleich, Versionen und Portierungen verschieden', () => {
  assert.equal(normalizeLicense('CC-BY-SA-4.0'), normalizeLicense('CC BY-SA 4.0'));
  assert.equal(normalizeLicense('cc by-sa 4.0'), normalizeLicense('CC BY-SA 4.0'));
  assert.equal(normalizeLicense('CC0 1.0'), normalizeLicense('CC0'));
  assert.notEqual(normalizeLicense('CC BY-SA 3.0'), normalizeLicense('CC BY-SA 4.0'));
  assert.notEqual(normalizeLicense('CC BY-SA 3.0 de'), normalizeLicense('CC BY-SA 3.0'));
  assert.notEqual(normalizeLicense('CC BY 4.0'), normalizeLicense('CC BY-SA 4.0'));
  assert.notEqual(normalizeLicense('CC0'), normalizeLicense('Public domain'));
});

test('authorsDifferMaterially: Kosmetik ist keine Abweichung, ein anderer Name schon', () => {
  // kosmetisch: Schreibweise, Wikilink-Reste, Ortszusatz, „Photo:"-Vorsatz
  assert.equal(authorsDifferMaterially('Photo: Andreas Praefcke', 'Andreas Praefcke'), false);
  assert.equal(authorsDifferMaterially('C.Stadler/Bwag (talk / email)', 'C.Stadler/Bwag'), false);
  assert.equal(authorsDifferMaterially('Tom Reynolds from Melbourne, Australia', 'Tom Reynolds'), false);
  assert.equal(authorsDifferMaterially('Šarūnas Burdulis from USA', 'Sarunas Burdulis'), false);
  assert.equal(authorsDifferMaterially('User:Ozgurmulazimoglu', 'ozgurmulazimoglu'), false);
  // wesentlich
  assert.equal(authorsDifferMaterially('Ermell', 'Reinhold Möller'), true);
  assert.equal(authorsDifferMaterially('Wikimedia Commons', 'Philip Halling'), true);
  assert.equal(isPlaceholderAuthor('Wikimedia Commons'), true);
  assert.equal(isPlaceholderAuthor('Unknown authorUnknown author'), true);
  assert.equal(isPlaceholderAuthor('Philip Halling'), false);
});

test('compareCredit: ok, wenn Lizenz und Urheber passen', () => {
  assert.deepEqual(compareCredit(line(), { license: 'CC BY 4.0', artist: '<a href="//x">Vyacheslav Argenberg</a>' }), { status: 'ok', severity: 'ok' });
  // Schreibweise der Lizenz ist kein Befund
  assert.equal(compareCredit(line({ license: 'CC BY-SA 4.0' }), { license: 'CC-BY-SA-4.0', artist: 'Vyacheslav Argenberg' }).status, 'ok');
});

test('compareCredit: keine Quelle / auf Commons geloescht', () => {
  assert.equal(compareCredit(line({ sourceUrl: undefined }), null).status, 'no-source');
  assert.equal(compareCredit(line({ sourceUrl: undefined }), null).severity, 'warn');
  const gone = compareCredit(line(), { missing: true });
  assert.equal(gone.status, 'missing-on-commons');
  assert.equal(gone.severity, 'error');
});

test('compareCredit: Lizenz ausserhalb der Allowlist -> ersetzen, nie „korrigieren"', () => {
  for (const license of ['CC BY-NC 2.0', 'CC BY-NC-ND 4.0', 'CC BY-ND 3.0', 'GFDL', 'Fair use', 'Copyrighted free use', '']) {
    const res = compareCredit(line(), { license, artist: 'Vyacheslav Argenberg' });
    assert.equal(res.status, 'license-not-allowed', license);
    assert.equal(res.severity, 'error', license);
    assert.equal(res.suggestion, undefined, license);
  }
});

test('compareCredit: andere erlaubte Lizenz -> Korrekturvorschlag (Ausgangsbefund G-10: „CC0" war CC BY 4.0)', () => {
  const res = compareCredit(line({ license: 'CC0', credit: 'Wikimedia Commons' }), { license: 'CC BY 4.0', artist: 'Vyacheslav Argenberg' });
  assert.equal(res.status, 'license-mismatch');
  assert.deepEqual(res.suggestion, { license: 'CC BY 4.0' });
  // CC0 <-> Public domain ist ebenfalls eine (unkritische, aber echte) Abweichung
  assert.equal(compareCredit(line({ license: 'CC0' }), { license: 'Public domain', artist: 'x' }).status, 'license-mismatch');
  assert.equal(compareCredit(line({ license: 'CC BY-SA 3.0' }), { license: 'CC BY-SA 4.0', artist: 'Vyacheslav Argenberg' }).status, 'license-mismatch');
});

test('compareCredit: Urheber — Attribution schlaegt Artist, Platzhalter bei CC BY ist ein Fehler', () => {
  // Commons-Nutzer „Ermell" verlangt die Nennung „Reinhold Möller" (extmetadata.Attribution)
  const ermell = compareCredit(line({ credit: 'Ermell', license: 'CC BY-SA 4.0' }), { license: 'CC BY-SA 4.0', artist: 'Ermell', attribution: 'Reinhold Möller' });
  assert.equal(ermell.status, 'author-mismatch');
  assert.deepEqual(ermell.suggestion, { credit: 'Reinhold Möller' });

  const placeholder = compareCredit(line({ credit: 'Wikimedia Commons' }), { license: 'CC BY 4.0', artist: 'Jane Doe' });
  assert.equal(placeholder.status, 'author-missing');
  assert.deepEqual(placeholder.suggestion, { credit: 'Jane Doe' });

  // Commons kennt selbst keinen Urheber: kein Vorschlag, von Hand klaeren (nie raten)
  const unknown = compareCredit(line({ credit: 'Wikimedia Commons' }), { license: 'CC BY 4.0', artist: '' });
  assert.equal(unknown.status, 'author-missing');
  assert.equal(unknown.suggestion, undefined);

  // Kosmetik bleibt ok
  assert.equal(compareCredit(line({ credit: 'Photo: Vyacheslav Argenberg' }), { license: 'CC BY 4.0', artist: 'Vyacheslav Argenberg' }).status, 'ok');
});

test('compareCredit: bei CC0/Public Domain ist ein abweichender Urheber nur ein Hinweis', () => {
  const res = compareCredit(line({ license: 'CC0', credit: 'Valerie Wiersma' }), { license: 'CC0', artist: 'Someone Else' });
  assert.equal(res.status, 'author-note');
  assert.equal(res.severity, 'ok');
  assert.equal(compareCredit(line({ license: 'Public domain', credit: 'Wikimedia Commons' }), { license: 'Public domain', artist: '' }).status, 'ok');
});
