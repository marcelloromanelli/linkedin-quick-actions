/**
 * Generate extension icons at required sizes
 *
 * Design: Bold double chevron on LinkedIn blue - suggests speed & navigation
 * LinkedIn brand color: #0A66C2
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 48, 128];
const OUTPUT_DIR = path.join(__dirname, '..', 'icons');

// LinkedIn brand colors
const BG_COLOR = '#0A66C2';      // LinkedIn Blue
const ICON_COLOR = '#FFFFFF';    // White

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - rounded square
  const radius = size * 0.22;
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Double chevron >> suggesting speed/quick navigation
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 128;

  ctx.strokeStyle = ICON_COLOR;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.12; // Thick bold lines

  // First chevron (left)
  ctx.beginPath();
  ctx.moveTo(cx - 28 * s, cy - 32 * s);
  ctx.lineTo(cx + 4 * s, cy);
  ctx.lineTo(cx - 28 * s, cy + 32 * s);
  ctx.stroke();

  // Second chevron (right)
  ctx.beginPath();
  ctx.moveTo(cx + 4 * s, cy - 32 * s);
  ctx.lineTo(cx + 36 * s, cy);
  ctx.lineTo(cx + 4 * s, cy + 32 * s);
  ctx.stroke();

  return canvas;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate all sizes
for (const size of SIZES) {
  const canvas = generateIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated ${filename} (${buffer.length} bytes)`);
}

console.log('\nAll icons generated with LinkedIn blue (#0A66C2)!');
