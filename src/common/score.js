/* miSmash, segnapunti padel e tennis · logica pura (nessuna API di sistema, testabile con node)
   Una partita è salvata solo come: sport, al meglio di 3 o 5 set, chi ha battuto
   per primo, punto d'oro sì/no, ora d'inizio e la sequenza dei punti ('0' = noi,
   '1' = loro). Tutto il
   resto (game, set, tie-break, battuta, statistiche) si ricalcola rigiocando la
   sequenza: così annullare un punto è solo togliere un carattere, senza stati da
   tenere allineati. Padel e tennis si contano allo stesso modo; cambia solo il
   nome del punto secco sul 40-40 (punto d'oro / punto decisivo). */

export const NOI = 0;
export const LORO = 1;
export const PADEL = 'padel';
export const TENNIS = 'tennis';

const GAME_LABELS = ['0', '15', '30', '40'];
const GAMES_PER_SET = 6;
const TIEBREAK_TO = 7;
export const MAX_HISTORY = 30;

export function newMatch(first, golden, sport, start, bestOf) {
  return {
    sport: sport === TENNIS ? TENNIS : PADEL,
    bestOf: bestOf === 5 ? 5 : 3,
    first: first === LORO ? LORO : NOI,
    golden: !!golden,
    points: '',
    start: start > 0 ? start : 0
  };
}

export function addPoint(match, team) {
  if (compute(match).winner >= 0) return match;
  return Object.assign({}, match, { points: match.points + String(team) });
}

/* Toglie l'ultimo punto segnato da quella squadra (di solito è anche l'ultimo
   punto in assoluto: si corregge subito un tocco sbagliato). */
export function undoPoint(match, team) {
  const i = match.points.lastIndexOf(String(team));
  if (i < 0) return match;
  return Object.assign({}, match, { points: match.points.slice(0, i) + match.points.slice(i + 1) });
}

/* Toglie l'ultimo punto, chiunque l'abbia fatto. */
export function undoLast(match) {
  if (!match.points) return match;
  return Object.assign({}, match, { points: match.points.slice(0, -1) });
}

export function compute(match) {
  const sets = []; // set chiusi, es. [[6, 4], [3, 6]]
  const setsWon = [0, 0];
  const pointsWon = [0, 0];
  const gamesWon = [0, 0]; // in tutta la partita, tie-break compresi
  const breaks = [0, 0]; // game vinti in risposta (tie-break esclusi)
  let games = [0, 0];
  let pts = [0, 0];
  let tiebreak = false;
  let gamesPlayed = 0; // game giocati in tutta la partita, tie-break compresi
  let winner = -1;
  const setsToWin = match.bestOf === 5 ? 3 : 2;

  for (let k = 0; k < match.points.length && winner < 0; k++) {
    const w = match.points.charCodeAt(k) === 49 ? LORO : NOI;
    const o = 1 - w;
    pts[w]++;
    pointsWon[w]++;

    let gameWon;
    if (tiebreak) gameWon = pts[w] >= TIEBREAK_TO && pts[w] - pts[o] >= 2;
    else gameWon = pts[w] >= 4 && (pts[w] - pts[o] >= 2 || match.golden);
    if (!gameWon) continue;

    if (!tiebreak && w !== serverOf(match.first, gamesPlayed)) breaks[w]++;
    games[w]++;
    gamesWon[w]++;
    gamesPlayed++;
    pts = [0, 0];

    const setWon = tiebreak || (games[w] >= GAMES_PER_SET && games[w] - games[o] >= 2);
    tiebreak = false;
    if (setWon) {
      sets.push(games);
      setsWon[w]++;
      games = [0, 0];
      if (setsWon[w] === setsToWin) winner = w;
    } else if (games[0] === GAMES_PER_SET && games[1] === GAMES_PER_SET) {
      tiebreak = true;
    }
  }

  // Battuta: si alterna a ogni game. Nel tie-break batte prima chi è di turno,
  // poi si cambia dopo il primo punto e in seguito ogni due punti.
  let server = serverOf(match.first, gamesPlayed);
  if (tiebreak && Math.floor((pts[0] + pts[1] + 1) / 2) % 2 === 1) server = 1 - server;

  // Lato di battuta ('R' destra / 'L' sinistra): da destra con un numero pari di
  // punti giocati nel game, da sinistra con un numero dispari (vale anche nel
  // tie-break). Sul punto d'oro sceglie chi risponde, quindi nessun lato.
  const goldenPoint = match.golden && !tiebreak && pts[0] === 3 && pts[1] === 3;
  const side = winner >= 0 || goldenPoint ? '' : (pts[0] + pts[1]) % 2 === 0 ? 'R' : 'L';

  return {
    sets,
    setsWon,
    games,
    pts,
    labels: pointLabels(pts, tiebreak),
    tiebreak,
    goldenPoint,
    server,
    side,
    winner,
    gamesPlayed,
    pointsWon,
    gamesWon,
    breaks
  };
}

function serverOf(first, gamesPlayed) {
  return gamesPlayed % 2 === 0 ? first : 1 - first;
}

function pointLabels(pts, tiebreak) {
  if (tiebreak) return [String(pts[0]), String(pts[1])];
  if (pts[0] >= 3 && pts[1] >= 3) {
    if (pts[0] === pts[1]) return ['40', '40'];
    return pts[0] > pts[1] ? ['AD', '40'] : ['40', 'AD'];
  }
  return [GAME_LABELS[pts[0]], GAME_LABELS[pts[1]]];
}

/* Set da mostrare: quelli chiusi più quello in corso, se è già iniziato. */
export function scoreSets(s) {
  if (s.winner >= 0 || (s.games[0] === 0 && s.games[1] === 0)) return s.sets;
  return s.sets.concat([s.games]);
}

/* Valida quanto letto dallo storage: qualsiasi cosa strana → nessuna partita. */
export function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.points !== 'string' || !/^[01]*$/.test(raw.points)) return null;
  return Object.assign(newMatch(raw.first, raw.golden, raw.sport, raw.start, raw.bestOf), { points: raw.points });
}

/* Storico: dalla più recente alla più vecchia, al massimo MAX_HISTORY partite.
   Ogni voce è una partita con in più l'ora di fine. */
export function addToHistory(history, match, end) {
  if (!match || !match.points) return history;
  const entry = Object.assign({}, match, { end: end > 0 ? end : 0 });
  return [entry].concat(history).slice(0, MAX_HISTORY);
}

export function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < MAX_HISTORY; i++) {
    const m = sanitize(raw[i]);
    if (m && m.points) out.push(Object.assign(m, { end: raw[i].end > 0 ? raw[i].end : 0 }));
  }
  return out;
}
