/* Testi da mostrare: date, durate, punteggi dei set. Logica pura, testabile con node.
   Solo caratteri sicuri per i font del bracciale (niente trattini lunghi). */

import { STRINGS } from './i18n.js';

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

// es. "dom 5 ott · 18:30" (giorni e mesi nella lingua lang)
export function formatDate(ts, lang) {
  if (!(ts > 0)) return '';
  const t = STRINGS[lang] || STRINGS.it;
  const d = new Date(ts);
  return t.days[d.getDay()] + ' ' + d.getDate() + ' ' + t.months[d.getMonth()] + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// es. "48'" oppure "1h 05'"; "--" se manca l'ora d'inizio (partite della versione 1.0)
export function formatDuration(ms) {
  if (!(ms > 0)) return '--';
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return min + "'";
  return Math.floor(min / 60) + 'h ' + pad(min % 60) + "'";
}

// es. "6-4 3-6 6-2"
export function setsLine(sets) {
  return sets.map((x) => x[0] + '-' + x[1]).join(' ');
}
