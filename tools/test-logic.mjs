// Test della logica punteggio: node tools/test-logic.mjs
import assert from 'assert/strict';
import {
  NOI, LORO, PADEL, TENNIS, MAX_HISTORY, newMatch, addPoint, undoPoint, undoLast, compute, scoreSets,
  sanitize, addToHistory, sanitizeHistory
} from '../src/common/score.js';
import { formatDate, formatDuration, setsLine } from '../src/common/format.js';
import { LANGS, STRINGS, pickLang, fill } from '../src/common/i18n.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok  ' + name);
}

function play(m, seq) {
  for (const c of seq) m = addPoint(m, c === 'n' ? NOI : LORO);
  return m;
}
const game = (who) => (who === 'n' ? 'nnnn' : 'llll');
const games = (who, n) => game(who).repeat(n);

test('punti base 0/15/30/40', () => {
  const m = play(newMatch(NOI, false), 'nnl');
  assert.deepEqual(compute(m).labels, ['30', '15']);
});

test('parità e vantaggio', () => {
  let m = play(newMatch(NOI, false), 'nnnlll');
  assert.deepEqual(compute(m).labels, ['40', '40']);
  m = play(m, 'n');
  assert.deepEqual(compute(m).labels, ['AD', '40']);
  m = play(m, 'l');
  assert.deepEqual(compute(m).labels, ['40', '40']);
  m = play(m, 'll');
  assert.deepEqual(compute(m).games, [0, 1]);
});

test("punto d'oro sul 40-40", () => {
  let m = play(newMatch(NOI, true), 'nnnlll');
  assert.equal(compute(m).goldenPoint, true);
  m = play(m, 'l');
  assert.deepEqual(compute(m).games, [0, 1]);
  assert.deepEqual(compute(m).labels, ['0', '0']);
});

test('battuta alternata a ogni game', () => {
  let m = newMatch(LORO, false);
  assert.equal(compute(m).server, LORO);
  m = play(m, game('n'));
  assert.equal(compute(m).server, NOI);
  m = play(m, game('l'));
  assert.equal(compute(m).server, LORO);
});

test('set 6-4', () => {
  const m = play(newMatch(NOI, false), games('n', 5) + games('l', 4) + game('n'));
  const s = compute(m);
  assert.deepEqual(s.sets, [[6, 4]]);
  assert.deepEqual(s.games, [0, 0]);
});

test('sul 6-5 non è finito, 7-5 sì', () => {
  let m = play(newMatch(NOI, false), games('n', 5) + games('l', 5) + game('n'));
  assert.deepEqual(compute(m).games, [6, 5]);
  m = play(m, game('n'));
  assert.deepEqual(compute(m).sets, [[7, 5]]);
});

test('tie-break sul 6-6 con battuta 1-2-2', () => {
  // 12 game alternati: dopo 12 game batte di nuovo chi ha iniziato
  let m = play(newMatch(NOI, false), (game('n') + game('l')).repeat(6));
  let s = compute(m);
  assert.equal(s.tiebreak, true);
  assert.deepEqual(s.games, [6, 6]);
  assert.equal(s.server, NOI);
  const servers = [s.server];
  for (let i = 0; i < 6; i++) {
    m = play(m, i % 2 ? 'l' : 'n');
    servers.push(compute(m).server);
  }
  assert.deepEqual(servers, [NOI, LORO, LORO, NOI, NOI, LORO, LORO]);
  assert.deepEqual(compute(m).labels, ['3', '3']);
});

test('tie-break vinto ai vantaggi 9-7 → set 7-6', () => {
  let m = play(newMatch(NOI, false), (game('n') + game('l')).repeat(6));
  m = play(m, 'nlnlnlnlnlnl'); // 6-6
  m = play(m, 'nl'); // 7-7
  assert.equal(compute(m).tiebreak, true);
  m = play(m, 'nn');
  const s = compute(m);
  assert.deepEqual(s.sets, [[7, 6]]);
  assert.equal(s.tiebreak, false);
  // ha iniziato il tie-break NOI → il set dopo inizia a battere LORO
  assert.equal(s.server, LORO);
});

test('al meglio dei 5 set servono 3 set vinti', () => {
  let m = play(newMatch(NOI, false, PADEL, 0, 5), games('n', 6) + games('l', 6) + games('n', 6));
  assert.equal(m.bestOf, 5);
  assert.equal(compute(m).winner, -1);
  assert.deepEqual(compute(m).setsWon, [2, 1]);
  m = play(m, games('l', 6) + games('n', 6));
  assert.equal(compute(m).winner, NOI);
  assert.deepEqual(compute(m).setsWon, [3, 2]);
  assert.equal(newMatch(NOI, false, PADEL, 0, 4).bestOf, 3);
});

test('partita al meglio dei 3 set, poi i tocchi vengono ignorati', () => {
  let m = play(newMatch(NOI, false), games('n', 6) + games('l', 6) + games('n', 6));
  const s = compute(m);
  assert.equal(s.winner, NOI);
  assert.deepEqual(s.setsWon, [2, 1]);
  assert.equal(addPoint(m, LORO).points, m.points);
});

test('annulla toglie l’ultimo punto di quella squadra', () => {
  let m = play(newMatch(NOI, false), 'nnl');
  assert.equal(undoPoint(m, LORO).points, '00');
  assert.equal(undoPoint(m, NOI).points, '01');
  assert.equal(undoPoint(newMatch(NOI, false), NOI).points, '');
});

test('annulla dopo un game vinto riapre il game', () => {
  let m = play(newMatch(NOI, false), 'nnnln');
  assert.deepEqual(compute(m).games, [1, 0]);
  m = undoPoint(m, NOI);
  assert.deepEqual(compute(m).games, [0, 0]);
  assert.deepEqual(compute(m).labels, ['40', '15']);
});

test('annulla a partita finita la riapre', () => {
  let m = play(newMatch(NOI, false), games('n', 12));
  assert.equal(compute(m).winner, NOI);
  m = undoPoint(m, NOI);
  assert.equal(compute(m).winner, -1);
  assert.deepEqual(compute(m).labels, ['40', '0']);
});

test('annulla ultimo punto, chiunque l’abbia fatto', () => {
  const m = play(newMatch(NOI, false), 'nnl');
  assert.equal(undoLast(m).points, '00');
  assert.equal(undoLast(undoLast(undoLast(m))).points, '');
  const vuota = newMatch(NOI, false);
  assert.equal(undoLast(vuota), vuota);
});

test('lato di battuta: destra con punti pari, sinistra con dispari, niente sul punto d’oro', () => {
  let m = newMatch(NOI, true);
  assert.equal(compute(m).side, 'R');
  m = play(m, 'n');
  assert.equal(compute(m).side, 'L');
  m = play(m, 'nll');
  assert.equal(compute(m).side, 'R');
  m = play(m, 'nl'); // 40-40 col punto d'oro
  assert.equal(compute(m).goldenPoint, true);
  assert.equal(compute(m).side, '');
});

test('statistiche: punti, game e break', () => {
  // 1° game batte NOI e vince NOI; 2° batte LORO e vince NOI (break);
  // 3° batte NOI e vince LORO ai vantaggi (break)
  const m = play(newMatch(NOI, false), game('n') + game('n') + 'nlll' + 'l');
  const s = compute(m);
  assert.deepEqual(s.gamesWon, [2, 1]);
  assert.deepEqual(s.breaks, [1, 1]);
  assert.deepEqual(s.pointsWon, [9, 4]);
  assert.equal(s.gamesPlayed, 3);
});

test('il tie-break non conta come break', () => {
  let m = play(newMatch(NOI, false), (game('n') + game('l')).repeat(6));
  m = play(m, 'lllllll'); // tie-break 0-7: lo vince LORO, che non batteva per primo
  const s = compute(m);
  assert.deepEqual(s.sets, [[6, 7]]);
  assert.deepEqual(s.breaks, [0, 0]); // ognuno ha sempre tenuto il servizio
});

test('set da mostrare: chiusi più quello in corso', () => {
  let m = play(newMatch(NOI, false), games('n', 6));
  assert.deepEqual(scoreSets(compute(m)), [[6, 0]]);
  m = play(m, game('l'));
  assert.deepEqual(scoreSets(compute(m)), [[6, 0], [0, 1]]);
});

test('tennis si conta come il padel e lo sport resta salvato', () => {
  const m = play(newMatch(LORO, true, TENNIS, 1000), 'nnnlll');
  assert.equal(m.sport, TENNIS);
  assert.equal(m.start, 1000);
  assert.equal(compute(m).goldenPoint, true);
  assert.equal(newMatch(NOI, false, 'calcio').sport, PADEL);
});

test('sanitize scarta dati corrotti e completa quelli della versione 1.0', () => {
  assert.equal(sanitize(null), null);
  assert.equal(sanitize({ points: '01x' }), null);
  assert.deepEqual(sanitize({ first: 1, golden: 1, points: '01' }), {
    sport: PADEL, bestOf: 3, first: 1, golden: true, points: '01', start: 0
  });
  assert.equal(sanitize({ points: '', bestOf: 5 }).bestOf, 5);
});

test('storico: in testa la più recente, niente partite vuote, al massimo ' + MAX_HISTORY, () => {
  let h = [];
  h = addToHistory(h, newMatch(NOI, false), 5);
  assert.equal(h.length, 0);
  for (let i = 0; i < MAX_HISTORY + 5; i++) h = addToHistory(h, play(newMatch(NOI, false, PADEL, i), 'n'), i + 1);
  assert.equal(h.length, MAX_HISTORY);
  assert.equal(h[0].start, MAX_HISTORY + 4);
  assert.equal(h[0].end, MAX_HISTORY + 5);
});

test('sanitizeHistory tiene solo le voci valide', () => {
  assert.deepEqual(sanitizeHistory('x'), []);
  const h = sanitizeHistory([{ points: '0', start: 1, end: 2 }, { points: 'zz' }, null, { points: '' }]);
  assert.equal(h.length, 1);
  assert.equal(h[0].end, 2);
});

test('formati: data, durata, set', () => {
  assert.equal(formatDate(new Date(2026, 9, 4, 18, 5).getTime(), 'it'), 'dom 4 ott · 18:05');
  assert.equal(formatDate(new Date(2026, 9, 4, 18, 5).getTime(), 'en'), 'Sun 4 Oct · 18:05');
  assert.equal(formatDate(new Date(2026, 9, 4, 18, 5).getTime(), 'es'), 'dom 4 oct · 18:05');
  assert.equal(formatDate(0), '');
  assert.equal(formatDuration(0), '--');
  assert.equal(formatDuration(20 * 1000), "1'");
  assert.equal(formatDuration(48 * 60000), "48'");
  assert.equal(formatDuration(65 * 60000), "1h 05'");
  assert.equal(setsLine([[6, 4], [3, 6]]), '6-4 3-6');
});

test('lingue: scelta dal codice del dispositivo, inglese se non c’è', () => {
  assert.equal(pickLang('it'), 'it');
  assert.equal(pickLang('es-ES'), 'es');
  assert.equal(pickLang('EN_us'), 'en');
  assert.equal(pickLang('zh-CN'), 'en');
  assert.equal(pickLang(undefined), 'en');
  assert.equal(fill('{n}° SET', { n: 2 }), '2° SET');
});

test('lingue: stesse chiavi in tutte, nessun testo vuoto', () => {
  const keys = (o) => Object.keys(o).sort().join(',');
  for (const l of LANGS) {
    assert.equal(keys(STRINGS[l]), keys(STRINGS.it), l);
    for (const [k, v] of Object.entries(STRINGS[l])) {
      if (typeof v === 'string') assert.ok(v.length > 0, l + '.' + k);
      else if (Array.isArray(v)) assert.equal(v.length, STRINGS.it[k].length, l + '.' + k);
      else assert.equal(keys(v), keys(STRINGS.it[k]), l + '.' + k);
    }
  }
});

console.log(`\n${passed} test superati`);
