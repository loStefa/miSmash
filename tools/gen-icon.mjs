// Genera le immagini dell'app in src/common/ (node puro senza dipendenze):
// - icon.png (192×192): icona dell'app, pallina giallo-lime con le due cuciture bianche
// - court.png, trophy.png, padel.png, tennis.png, team.png, golden.png, ball-grey.png
//   (240×240): immagini delle schede di scelta (home, sport, chi batte, punto d'oro)
import zlib from 'zlib';
import fs from 'fs';

const SS = 4; // supersampling per bordi morbidi

const LIME = [223, 255, 79]; // #dfff4f
const SEAM = [250, 250, 245];
const WHITE = [255, 255, 255];
const LIGHT = [229, 229, 234]; // #e5e5ea
const SOFT = [199, 199, 204]; // #c7c7cc
const GREY = [142, 142, 147]; // #8e8e93
const BLUE = [10, 132, 255]; // #0a84ff
const RED = [255, 69, 58]; // #ff453a
const GOLD = [255, 214, 10]; // #ffd60a
const GOLD_DARK = [204, 160, 0];

/* ---------- forme: vero se (x, y) è dentro ---------- */

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inRing = (x, y, cx, cy, rx, ry, w) => inEllipse(x, y, cx, cy, rx, ry) && !inEllipse(x, y, cx, cy, rx - w, ry - w);

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.max(x0 + r, Math.min(x, x1 - r));
  const cy = Math.max(y0 + r, Math.min(y, y1 - r));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// segmento con le estremità arrotondate, spesso 2r
function inCapsule(x, y, ax, ay, bx, by, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= r * r;
}

// stellina a quattro punte (scintilla)
const inSparkle = (x, y, cx, cy, s) => Math.sqrt(Math.abs(x - cx)) + Math.sqrt(Math.abs(y - cy)) <= Math.sqrt(s);

// stella a cinque punte, con la punta in alto
function inStar(x, y, cx, cy, outer, inner) {
  const r = Math.hypot(x - cx, y - cy);
  const a = (Math.atan2(x - cx, cy - y) + 2 * Math.PI) % ((2 * Math.PI) / 5);
  const t = Math.abs(a / ((2 * Math.PI) / 5) - 0.5) * 2; // 1 sulla punta, 0 nella rientranza
  return r <= inner + (outer - inner) * t;
}

// coordinate del punto nel disegno ruotato di deg gradi attorno a (cx, cy)
function unrotate(x, y, cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) + dy * Math.sin(a), cy - dx * Math.sin(a) + dy * Math.cos(a)];
}

// pallina con due cuciture curve
function ball(x, y, cx, cy, r, body, seam) {
  if (!inCircle(x, y, cx, cy, r)) return null;
  for (const sx of [cx - r * 1.3, cx + r * 1.3]) {
    if (Math.abs(Math.hypot(x - sx, y - cy) - r * 0.95) < (3 * r) / 92) return seam; // spessore 6px a r = 92
  }
  return body;
}

/* ---------- disegni ---------- */

const appIcon = (x, y) => ball(x, y, 96, 96, 92, LIME, SEAM);

// campo visto dall'alto con la pallina: "PARTITA"
function court(x, y) {
  const b = ball(x, y, 172, 78, 22, LIME, SEAM);
  if (b) return b;
  if (inRoundRect(x, y, 40, 116, 200, 124, 4)) return WHITE; // rete, sporge dal campo
  if (!inRoundRect(x, y, 52, 20, 188, 220, 12)) return null;
  const inner = x >= 64 && x <= 176 && y >= 32 && y <= 208;
  const border = !inner && x >= 60 && x <= 180 && y >= 28 && y <= 212;
  const service = inner && (Math.abs(y - 70) <= 2 || Math.abs(y - 170) <= 2);
  const middle = Math.abs(x - 120) <= 2 && y >= 70 && y <= 170;
  return border || service || middle ? WHITE : BLUE;
}

// coppa: "STORICO"
function trophy(x, y) {
  if (inStar(x, y, 120, 80, 20, 9)) return GOLD_DARK;
  if (inRoundRect(x, y, 62, 34, 178, 50, 5)) return GOLD; // bordo
  if (y >= 50 && inEllipse(x, y, 120, 50, 50, 72)) return GOLD; // coppa
  if (x <= 76 && inRing(x, y, 66, 80, 26, 28, 8)) return GOLD; // manici
  if (x >= 164 && inRing(x, y, 174, 80, 26, 28, 8)) return GOLD;
  if (inRoundRect(x, y, 110, 112, 130, 160, 3)) return GOLD; // gambo
  if (inRoundRect(x, y, 84, 156, 156, 176, 5)) return GOLD_DARK;
  if (inRoundRect(x, y, 70, 176, 170, 202, 7)) return GOLD; // base
  return null;
}

// racchetta da padel piena con i fori, inclinata, e pallina
function padel(x, y) {
  const b = ball(x, y, 182, 60, 26, LIME, SEAM);
  if (b) return b;
  const [u, v] = unrotate(x, y, 120, 120, -38);
  if (inRing(u, v, 120, 84, 52, 58, 8)) return BLUE; // bordo
  if (inEllipse(u, v, 120, 84, 44, 50)) {
    // fori a nido d'ape dentro una zona più piccola
    if (inEllipse(u, v, 120, 84, 34, 40)) {
      const row = Math.round((v - 84) / 14);
      const col = Math.round((u - 120 - (row % 2) * 7) / 14);
      if (inCircle(u, v, 120 + col * 14 + (row % 2) * 7, 84 + row * 14, 4)) return null;
    }
    return LIGHT;
  }
  // cuore: trapezio con un'apertura a triangolo
  if (v >= 136 && v <= 170) {
    const half = 30 - ((v - 136) / 34) * 20;
    const hole = v >= 142 && v <= 160 ? 13 - ((v - 142) / 18) * 11 : 0;
    if (Math.abs(u - 120) <= half && Math.abs(u - 120) > hole) return BLUE;
  }
  if (inCapsule(u, v, 120, 168, 120, 222, 11)) return WHITE; // manico
  return null;
}

// racchetta da tennis con le corde, inclinata, e pallina
function tennis(x, y) {
  const b = ball(x, y, 182, 60, 26, LIME, SEAM);
  if (b) return b;
  const [u, v] = unrotate(x, y, 120, 120, -38);
  if (inRing(u, v, 120, 82, 46, 60, 9)) return RED; // telaio
  if (inEllipse(u, v, 120, 82, 37, 51)) {
    const du = (((u - 120) % 12) + 12) % 12;
    const dv = (((v - 82) % 12) + 12) % 12;
    return du < 2.2 || dv < 2.2 ? LIGHT : null; // corde
  }
  if (inCapsule(u, v, 96, 136, 120, 170, 5) || inCapsule(u, v, 144, 136, 120, 170, 5)) return RED; // cuore
  if (inCapsule(u, v, 120, 168, 120, 222, 10)) return WHITE; // manico
  return null;
}

// due giocatori: "NOI" / "LORO" (sulle schede colorate)
function team(x, y) {
  const front = inCircle(x, y, 146, 84, 31) || (y <= 206 && inEllipse(x, y, 146, 210, 58, 70));
  if (front) return WHITE;
  const gap = inCircle(x, y, 146, 84, 38) || (y <= 206 && inEllipse(x, y, 146, 210, 65, 77));
  if (gap) return null; // stacco tra i due
  const back = inCircle(x, y, 86, 94, 26) || (y <= 206 && inEllipse(x, y, 86, 206, 50, 62));
  return back ? SOFT : null;
}

// pallina d'oro con scintille: punto d'oro sì
function golden(x, y) {
  if (inSparkle(x, y, 190, 56, 26) || inSparkle(x, y, 52, 50, 14) || inSparkle(x, y, 200, 160, 12)) return WHITE;
  return ball(x, y, 114, 130, 74, GOLD, SEAM);
}

// pallina grigia: punto d'oro no (si va ai vantaggi)
const greyBall = (x, y) => ball(x, y, 120, 124, 74, GREY, SOFT);

/* ---------- PNG ---------- */

function render(size, sample) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (!c) continue;
          r += c[0]; g += c[1]; b += c[2]; a++;
        }
      }
      const i = (y * size + x) * 4;
      if (a) {
        px[i] = Math.round(r / a);
        px[i + 1] = Math.round(g / a);
        px[i + 2] = Math.round(b / a);
      }
      px[i + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return px;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const v of buf) c = CRC[(c ^ v) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function writePng(name, size, sample) {
  const px = render(size, sample);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(new URL('../src/common/' + name, import.meta.url), png);
  console.log(name + ' ' + png.length + ' byte');
}

writePng('icon.png', 192, appIcon);
writePng('court.png', 240, court);
writePng('trophy.png', 240, trophy);
writePng('padel.png', 240, padel);
writePng('tennis.png', 240, tennis);
writePng('team.png', 240, team);
writePng('golden.png', 240, golden);
writePng('ball-grey.png', 240, greyBall);
