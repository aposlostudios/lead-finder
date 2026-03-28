// Generate simple PNG icons from raw pixel data
const fs = require("fs");
const path = require("path");
const { deflateSync } = require("zlib");

function createPNG(size) {
  // Create a simple blue square with "LF" text effect
  const width = size;
  const height = size;

  // Raw RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);

  const bgR = 37, bgG = 99, bgB = 235; // Blue background
  const cornerRadius = Math.floor(size * 0.15);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Rounded corners check
      let inCorner = false;
      const corners = [
        [cornerRadius, cornerRadius],
        [width - cornerRadius - 1, cornerRadius],
        [cornerRadius, height - cornerRadius - 1],
        [width - cornerRadius - 1, height - cornerRadius - 1],
      ];

      for (const [cx, cy] of corners) {
        if (
          (x < cornerRadius || x > width - cornerRadius - 1) &&
          (y < cornerRadius || y > height - cornerRadius - 1)
        ) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
            inCorner = true;
          }
        }
      }

      if (inCorner) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      } else {
        // Slight gradient
        const gradientFactor = 1 - (y / height) * 0.2;
        pixels[idx] = Math.min(255, Math.floor(bgR * gradientFactor));
        pixels[idx + 1] = Math.min(255, Math.floor(bgG * gradientFactor));
        pixels[idx + 2] = Math.min(255, Math.floor(bgB * gradientFactor));
        pixels[idx + 3] = 255;
      }
    }
  }

  // Draw "LF" letters (simple block font)
  const letterScale = Math.floor(size / 24);
  const startX = Math.floor(size * 0.2);
  const startY = Math.floor(size * 0.25);
  const letterHeight = Math.floor(size * 0.5);
  const letterWidth = Math.floor(size * 0.2);
  const thickness = Math.max(2, Math.floor(size * 0.06));

  function drawRect(rx, ry, rw, rh, r, g, b) {
    for (let dy = ry; dy < ry + rh && dy < height; dy++) {
      for (let dx = rx; dx < rx + rw && dx < width; dx++) {
        if (dx >= 0 && dy >= 0) {
          const idx = (dy * width + dx) * 4;
          pixels[idx] = r;
          pixels[idx + 1] = g;
          pixels[idx + 2] = b;
          pixels[idx + 3] = 255;
        }
      }
    }
  }

  // "L" - vertical bar + horizontal bar
  drawRect(startX, startY, thickness, letterHeight, 255, 255, 255);
  drawRect(startX, startY + letterHeight - thickness, letterWidth, thickness, 255, 255, 255);

  // "F" - vertical bar + two horizontal bars
  const fStartX = startX + letterWidth + Math.floor(size * 0.08);
  drawRect(fStartX, startY, thickness, letterHeight, 255, 255, 255);
  drawRect(fStartX, startY, letterWidth, thickness, 255, 255, 255);
  drawRect(fStartX, startY + Math.floor(letterHeight * 0.45), Math.floor(letterWidth * 0.8), thickness, 255, 255, 255);

  // Encode as PNG
  return encodePNG(pixels, width, height);
}

function encodePNG(pixels, width, height) {
  // Filter rows (filter type 0 = None)
  const filtered = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    filtered[y * (1 + width * 4)] = 0; // Filter type: None
    pixels.copy(filtered, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = deflateSync(filtered);

  // PNG file structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc ^= 0xffffffff;
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    createChunk("IHDR", ihdr),
    createChunk("IDAT", compressed),
    createChunk("IEND", Buffer.alloc(0)),
  ]);
}

// Generate icons
const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, "icon-192.png"), createPNG(192));
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), createPNG(512));

console.log("Icons generated!");
