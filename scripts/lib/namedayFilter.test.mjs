import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNonName, normalizeName, parseNames, pruneNamedays } from './namedayFilter.mjs';

test('G-11: eindeutige Nicht-Namen aus dem Audit und der Tabellenanalyse fallen', () => {
  const nonNames = [
    // Audit-Beispiele
    'Johannes Döparens dag', 'Rodenje Ivana Krstitelja',
    // sprachunabhaengig
    'n/a', 'Support Ukraine', '40', '-', '(Weihnachten)', 'Christmas (Božić]', 'hence Božidar',
    // SE
    'Nyårsdagen', 'Juldagen', 'Allhelgonadagen', 'Kyndelsmässodagen', 'Trettondedag jul', 'Marie bebådelsedag', 'Menlösa barns dag',
    // DE
    'Neujahr', '3 Könige', 'Schalttag', 'Schutzengelfest', 'Christfest', 'Verkündigung d.',
    // CZ / SK
    'Nový rok', 'Tři králové', 'Svátek práce', 'Sviatok práce', 'Den osvobození ČSR', 'Štědrý den', 'Boží hod vánoční',
    '1. svátek vánoční', 'Památka zesnulých', 'Pamiatka zosnulých', 'Upálení mistra Jana Husa', 'Vianoce',
    // HR
    'Glavosijek Ivana Krstitelja', 'Uskrsni ponedjeljak', 'Gospa Fatimska', 'Mala Gospa', 'Žalosna Gospa', 'MAJKA BOŽJA BISTRICKA',
    'MB Kam. vrata', 'Ime Marijino', 'Presveto Srce Isusovo', 'Bezgrešno začeče BDM', 'Solinski mucenici', 'papa mucenik',
    'Posveta Bazilike sv. Petra i Pavla', 'Kraljica Svete Krunice',
    // IT
    'Natale Del Signore', 'Solennità Dell\'epifania Del Signore', 'Vescovo E Dottore Della Chiesa', 'Papa E Martire',
    'Vergine E Martire', 'Martiri', 'Primi Martiri', 'I Domenica Di Quaresima', 'Domenica Delle Palme', 'Mercoledi\' Delle Ceneri',
    'Corpus Domini', 'Ss Trinità', 'B.V. Maria Ausiliatrice', 'Beata Vergine Maria Di Lourdes', 'Ognissanti', 'Cristo Re Dell\'universo',
    'Immacolata Concezione', 'Dottore Della Chiesa', 'Frate Cappuccino', 'Sette Fondatori Dell\'ordine Dei Servi Di Maria',
    // FR
    'Jour de l\'An', 'Fête du travail', 'F. des Mères', 'Mardi gras', 'Vendredi Saint', 'L. de Pâques', 'Pâques', 'Ascension',
    'Pentecôte', 'Toussaint', 'Armistice 1918', 'N.-D. Lourdes', 'N-D Mt-Carmel', 'Conv. S. Paul', 'Christ Roi', 'Rameaux +1h',
    // LV
    'Visu neparasto un kalendāros neierakstīto vārdu diena',
  ];
  for (const n of nonNames) assert.equal(isNonName(n), true, `sollte fallen: ${n}`);
});

test('G-11: echte Vornamen bleiben — auch mit Beinamen, Titeln oder Festnamen-Homonymen', () => {
  const names = [
    'Anna', 'Dag', 'Julia', 'Silvester', 'Sylwester', 'Noël', 'Vappu', 'Aatto', 'Reyes', 'Santa', 'Alla',
    'Maria Magdalena', 'Piotr. Jagoda', 'Lénárd Nuno', 'Petr a Pavel', 'Adam a Eva', 'Gustav Adolf', 'Martin Luther',
    'Stefan—Staffan', 'Eva Hl.', 'Anna Katharina(e)', 'K(C)lemens', 'Michael(a]',
    'Santo Stefano Primo Martire', 'Severino Abate', 'Francesco Di Sales', 'Giovanni Xxiii', 'Benedetto Da Norcia',
    'Stjepan Prvomucenik', 'Benedikt opat', 'Sv. Juraj', 'Karlo Lwanga i dr.', 'Pio V. papa',
    'Jean de Dieu', 'Fr. de Sales', 'Th. d\'Aquin', 'Basile Pleine', 'Epiphanie',
    'Francisco de Asís', 'Teresa de Jesús', 'Johannes d.T.', 'Franz v.A.',
  ];
  for (const n of names) assert.equal(isNonName(n), false, `sollte bleiben: ${n}`);
});

test('G-11: normalizeName entfernt Whitespace und Sommerzeit-Suffixe', () => {
  assert.equal(normalizeName('  Jude -1h '), 'Jude');
  assert.equal(normalizeName('Rameaux +1h'), 'Rameaux');
  assert.equal(normalizeName('Anna'), 'Anna');
});

test('G-11: parseNames zerlegt abalin-Strings, filtert und dedupliziert', () => {
  assert.deepEqual(parseNames('Anna, Johannes Döparens dag, n/a, Anna, Bert '), ['Anna', 'Bert']);
  assert.deepEqual(parseNames('Jude -1h, Simon'), ['Jude', 'Simon']);
  assert.deepEqual(parseNames(undefined), []);
  assert.deepEqual(parseNames(''), []);
});

test('G-11: pruneNamedays entfernt Nicht-Namen, loescht leere Tage und protokolliert', () => {
  const { table, removed } = pruneNamedays({
    '01-01': ['Nový rok', 'Anna'],
    '06-24': ['Johannes Döparens dag'],
    '12-26': ['Stjepan Prvomucenik', 'Krunoslav', 'Krunoslav'],
  });
  assert.deepEqual(table, { '01-01': ['Anna'], '12-26': ['Stjepan Prvomucenik', 'Krunoslav'] });
  assert.deepEqual(removed, [
    { day: '01-01', name: 'Nový rok' },
    { day: '06-24', name: 'Johannes Döparens dag' },
  ]);
  assert.deepEqual(pruneNamedays(undefined), { table: {}, removed: [] });
});
