// Generates a 128x128 PNG icon using raw PNG encoding (no dependencies)
const fs = require('fs');
const zlib = require('zlib');

const SIZE = 128;

function createPNG(size) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const radius = size / 2 - 4;

      // Background circle — dark navy
      if (dist < radius) {
        pixels[idx]     = 18;   // R
        pixels[idx + 1] = 24;   // G
        pixels[idx + 2] = 38;   // B
        pixels[idx + 3] = 255;  // A
      } else {
        // Transparent outside circle
        pixels[idx] = pixels[idx+1] = pixels[idx+2] = pixels[idx+3] = 0;
      }

      // Inner colored ring (traffic light gradient — red top, yellow mid, green bottom)
      const ringOuter = radius;
      const ringInner = radius - 10;
      if (dist >= ringInner && dist < ringOuter) {
        const angle = Math.atan2(cy, cx); // -PI to PI
        const norm = (angle + Math.PI) / (2 * Math.PI); // 0 to 1

        let r, g, b;
        if (norm < 0.33) {
          // Red section
          r = 255; g = 80; b = 80;
        } else if (norm < 0.66) {
          // Yellow section
          r = 255; g = 210; b = 0;
        } else {
          // Green section
          r = 0; g = 220; b = 100;
        }

        pixels[idx]     = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = 255;
      }
    }
  }

  // Draw "TD" text pixels manually — simple pixel font at center
  const textColor = [255, 255, 255, 255];
  function setPixel(px, py, color) {
    if (px >= 0 && px < size && py >= 0 && py < size) {
      const idx = (py * size + px) * 4;
      pixels[idx]     = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = color[3];
    }
  }
  function drawRect(x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        setPixel(x + dx, y + dy, color);
  }

  const startX = 34;
  const startY = 46;
  const scale = 5;

  // T
  drawRect(startX, startY, scale * 3, scale, textColor);
  drawRect(startX + scale, startY + scale, scale, scale * 4, textColor);

  // D
  const dx = startX + scale * 4;
  drawRect(dx, startY, scale, scale * 5, textColor);
  drawRect(dx + scale, startY, scale, scale, textColor);
  drawRect(dx + scale * 2, startY + scale, scale, scale * 3, textColor);
  drawRect(dx + scale, startY + scale * 4, scale, scale, textColor);

  // Build PNG binary
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([len, typeBytes, data, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  // IDAT — raw pixel data with filter bytes
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // None filter
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const compressed = zlib.deflateSync(raw);

  const png = Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(__dirname + '/icon.png', png);
  console.log('✅ icon.png created (128x128)');
}

createPNG(SIZE);
