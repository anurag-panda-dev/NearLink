/**
 * Generates the NearLink brand assets.
 *
 *   assets/icon.png            1024x1024  app icon (dark tile)
 *   assets/adaptive-icon.png   1024x1024  android adaptive foreground (transparent)
 *   assets/splash.png          1284x2778  splash screen
 *   assets/favicon.png          196x196   web favicon
 *   logo.png                    512x512   README hero logo (dark tile)
 *   logo-dark.png               512x512   README hero logo, dark mode
 *   logo-light.png              512x512   README hero logo, light mode
 *
 * Motif: a central mesh node broadcasting concentric BLE signal waves,
 * ringed by relay nodes linked into a mesh.
 *
 * No external dependencies - raw RGBA pixels + zlib PNG encoding.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');

/* ---------------------------------------------------------------- PNG ---- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------- drawing ---- */

const PALETTES = {
  dark: {
    bg: [0x08, 0x0c, 0x15],
    vignette: [0x11, 0x17, 0x26],
    cyan: [0x00, 0xf0, 0xff],
    violet: [0x8b, 0x5cf6],
    emerald: [0x10, 0xb9, 0x81],
    core: [0xff, 0xff, 0xff],
    waveAlpha: [1.0, 0.8, 0.6],
  },
  light: {
    bg: [0xff, 0xff, 0xff],
    vignette: [0xf1, 0xf5, 0xf9],
    // Deeper hues so the mark clears WCAG AA (>=4.5:1) on a white page.
    cyan: [0x15, 0x5e, 0x75], // cyan-800
    violet: [0x5b, 0x21, 0xb6], // violet-800
    emerald: [0x04, 0x78, 0x57], // emerald-700
    core: [0x22, 0xd3, 0xee], // cyan-400 beacon inside the hub
    waveAlpha: [1.0, 0.85, 0.7],
  },
};

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

function createCanvas(w, h, fill) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = fill[0];
    buf[i * 4 + 1] = fill[1];
    buf[i * 4 + 2] = fill[2];
    buf[i * 4 + 3] = 255;
  }
  return buf;
}

/** Alpha-blend a pixel. */
function blend(buf, w, x, y, color, alpha) {
  if (alpha <= 0 || x < 0 || y < 0 || x >= w) return;
  const i = (y * w + x) * 4;
  const a = Math.min(1, alpha);
  buf[i] = Math.round(buf[i] * (1 - a) + color[0] * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + color[1] * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + color[2] * a);
  buf[i + 3] = Math.max(buf[i + 3], Math.round(255 * a));
}

/** Anti-aliased disc. */
function disc(buf, w, h, cx, cy, r, color, alpha = 1) {
  const x0 = Math.floor(cx - r - 2), x1 = Math.ceil(cx + r + 2);
  const y0 = Math.floor(cy - r - 2), y1 = Math.ceil(cy + r + 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cov = Math.max(0, Math.min(1, r + 0.5 - d));
      if (cov > 0) blend(buf, w, x, y, color, cov * alpha);
    }
  }
}

/** Anti-aliased ring (annulus), optionally clipped to an angular arc. */
function ring(buf, w, h, cx, cy, r, thickness, color, alpha = 1, arcFrom = 0, arcTo = Math.PI * 2) {
  const outer = r + thickness / 2;
  const inner = r - thickness / 2;
  const x0 = Math.floor(cx - outer - 2), x1 = Math.ceil(cx + outer + 2);
  const y0 = Math.floor(cy - outer - 2), y1 = Math.ceil(cy + outer + 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d < inner - 1 || d > outer + 1) continue;
      let ang = Math.atan2(dy, dx);
      if (ang < 0) ang += Math.PI * 2;
      const start = ((arcFrom % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const end = ((arcTo % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const inArc = start <= end ? ang >= start && ang <= end : ang >= start || ang <= end;
      if (!inArc) continue;
      const cov = Math.max(0, Math.min(1, Math.min(outer + 0.5 - d, d - inner + 0.5)));
      if (cov > 0) blend(buf, w, x, y, color, cov * alpha);
    }
  }
}

/** Anti-aliased line segment. */
function line(buf, w, h, x1, y1, x2, y2, thickness, color, alpha = 1) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const steps = Math.ceil(len * 2);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(buf, w, h, x1 + dx * t, y1 + dy * t, thickness / 2, color, alpha);
  }
}

/**
 * Draws the NearLink mark into a canvas.
 *  cx, cy  centre
 *  S       mark diameter
 *  opts.bg paint the background (false = transparent)
 */
function drawMark(buf, w, h, cx, cy, S, palette, opts = {}) {
  const { bg = true, nodeRing = true } = opts;
  const P = palette;

  if (bg) {
    const maxD = Math.hypot(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - cx, y - cy) / maxD;
        const g = Math.max(0, 1 - d * 1.35);
        const i = (y * w + x) * 4;
        const tint = mix(P.bg, P.vignette, g);
        buf[i] = tint[0];
        buf[i + 1] = tint[1];
        buf[i + 2] = tint[2];
        buf[i + 3] = 255;
      }
    }
  }

  const rHub = S * 0.075;

  // mesh relay nodes around the hub
  const nodes = [];
  if (nodeRing) {
    for (const a of [-2.36, -1.18, 0.0, 1.18, 2.36, 3.14]) {
      nodes.push({ x: cx + Math.cos(a) * S * 0.36, y: cy + Math.sin(a) * S * 0.36, a });
    }
  }

  // spokes -> hub
  for (const n of nodes) {
    line(buf, w, h, n.x, n.y, cx, cy, Math.max(1, S * 0.006), P.cyan, 0.22);
  }
  // chords -> reads as a mesh, not a star
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i], b = nodes[(i + 2) % nodes.length];
    line(buf, w, h, a.x, a.y, b.x, b.y, Math.max(1, S * 0.005), P.violet, 0.16);
  }

  // BLE broadcast waves: three concentric arcs, fading outwards
  const [a0, a1, a2] = P.waveAlpha;
  const waves = [
    { r: S * 0.19, t: S * 0.030, c: P.cyan, a: a0 },
    { r: S * 0.275, t: S * 0.026, c: mix(P.cyan, P.violet, 0.45), a: a1 },
    { r: S * 0.355, t: S * 0.022, c: P.violet, a: a2 },
  ];
  for (const wv of waves) {
    ring(buf, w, h, cx, cy, wv.r, wv.t, wv.c, wv.a, -0.35, Math.PI * 2 - 0.35);
  }

  // hub glow + core
  disc(buf, w, h, cx, cy, rHub * 2.1, P.cyan, 0.1);
  disc(buf, w, h, cx, cy, rHub * 1.45, P.cyan, 0.28);
  disc(buf, w, h, cx, cy, rHub, P.cyan, 1);
  disc(buf, w, h, cx, cy, rHub * 0.45, P.core, 0.9);

  // relay node dots
  for (const n of nodes) {
    const r = S * 0.035;
    disc(buf, w, h, n.x, n.y, r * 1.9, P.emerald, 0.12);
    disc(buf, w, h, n.x, n.y, r, P.emerald, 1);
  }
}

/* ---------------------------------------------------------------- main ---- */

function write(relPath, w, h, draw) {
  const buf = createCanvas(w, h, PALETTES.dark.bg);
  draw(buf, w, h);
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, encodePNG(w, h, buf));
  console.log(`  ${relPath.padEnd(28)} ${w}x${h}`);
}

const D = PALETTES.dark;
const L = PALETTES.light;

// App icon - full bleed, mark at 78% of the canvas
write('assets/icon.png', 1024, 1024, (b, w, h) => drawMark(b, w, h, w / 2, h / 2, 1024 * 0.78, D));

// Android adaptive foreground - transparent, mark inside the 66% safe zone
write('assets/adaptive-icon.png', 1024, 1024, (b, w, h) => {
  for (let i = 0; i < w * h; i++) b[i * 4 + 3] = 0;
  drawMark(b, w, h, w / 2, h / 2, 1024 * 0.52, D, { bg: false });
});

// Splash - dark canvas, centred mark
write('assets/splash.png', 1284, 2778, (b, w, h) => {
  const maxD = Math.hypot(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - w / 2, y - h / 2) / maxD;
      const g = Math.max(0, 1 - d * 1.25);
      const i = (y * w + x) * 4;
      const tint = mix(D.bg, D.vignette, g);
      b[i] = tint[0];
      b[i + 1] = tint[1];
      b[i + 2] = tint[2];
    }
  }
  drawMark(b, w, h, w / 2, h * 0.46, 900, D, { bg: false });
});

// Web favicon
write('assets/favicon.png', 196, 196, (b, w, h) => drawMark(b, w, h, w / 2, h / 2, 196 * 0.84, D));

// README hero logos (512px -> rendered at 256px for 2x crispness)
write('logo.png', 512, 512, (b, w, h) => drawMark(b, w, h, w / 2, h / 2, 512 * 0.78, D));
write('logo-dark.png', 512, 512, (b, w, h) => drawMark(b, w, h, w / 2, h / 2, 512 * 0.78, D));
write('logo-light.png', 512, 512, (b, w, h) => drawMark(b, w, h, w / 2, h / 2, 512 * 0.78, L));

console.log('\nNearLink assets generated.');
