/**
 * Generate extension icons at required sizes
 *
 * Design: White "LQ" text on LinkedIn blue rounded square
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
  const radius = size * 0.18;
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // "LQ" text - clean and legible at all sizes
  ctx.fillStyle = ICON_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Bold font, sized to fill the icon
  const fontSize = size * 0.52;
  ctx.font = `bold ${fontSize}px -apple-system, "Segoe UI", sans-serif`;

  ctx.fillText('LQ', size / 2, size / 2 + size * 0.04);

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
