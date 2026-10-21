const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

function validate(file) {
  const b = fs.readFileSync(file);
  const sigOk = b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  let off = 8, ihdr = null, idat = [], crcOk = true, sawIend = false;

  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.slice(off + 4, off + 8).toString('ascii');
    const data = b.slice(off + 8, off + 8 + len);
    const crc = b.readUInt32BE(off + 8 + len);
    const computed = crc32(b.slice(off + 4, off + 8 + len));
    if (crc !== computed) crcOk = false;

    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') sawIend = true;

    off += 12 + len;
    if (type === 'IEND') break;
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const expected = ihdr.height * (1 + ihdr.width * 4);
  const pixelsOk = raw.length === expected;

  // sample a few pixels for sanity (non-empty, alpha present)
  const stride = ihdr.width * 4 + 1;
  let nonBg = 0, opaque = 0;
  for (let y = 0; y < ihdr.height; y++) {
    for (let x = 0; x < ihdr.width; x++) {
      const o = y * stride + 1 + x * 4;
      const r = raw[o], g = raw[o + 1], bl = raw[o + 2], a = raw[o + 3];
      if (a > 0) opaque++;
      if (a > 0 && (r > 40 || g > 40 || bl > 60)) nonBg++;
    }
  }

  console.log(
    `${path.basename(file).padEnd(20)} sig:${sigOk ? 'OK' : 'BAD'}  ${ihdr.width}x${ihdr.height} ` +
      `depth:${ihdr.depth} ctype:${ihdr.colorType}  crc:${crcOk ? 'OK' : 'BAD'}  ` +
      `iend:${sawIend ? 'OK' : 'BAD'}  pixels:${pixelsOk ? 'OK' : 'BAD ' + raw.length + '!=' + expected}  ` +
      `lit:${nonBg}  opaque:${opaque}`
  );
  return sigOk && crcOk && sawIend && pixelsOk && nonBg > 0;
}

const root = path.join(__dirname, '..');
const targets = [
  ...fs.readdirSync(path.join(root, 'assets')).filter((f) => f.endsWith('.png')).map((f) => path.join(root, 'assets', f)),
  ...['logo.png', 'logo-dark.png', 'logo-light.png'].map((f) => path.join(root, f)),
];
let allOk = true;
for (const f of targets) allOk = validate(f) && allOk;
console.log(allOk ? '\nAll PNGs valid.' : '\nINVALID PNG DETECTED');
