/**
 * Generate extension icons at required sizes
 *
 * Design: White lightning bolt on LinkedIn blue rounded square
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

  // Lightning bolt - bold design for small sizes
  ctx.fillStyle = ICON_COLOR;

  const cx = size / 2;
  const cy = size / 2;
  const s = size / 128; // Scale factor

  // Bold angular lightning bolt
  ctx.beginPath();

  // Top triangle going right
  ctx.moveTo(cx - 20 * s, cy - 48 * s);  // Top left
  ctx.lineTo(cx + 32 * s, cy - 48 * s);  // Top right
  ctx.lineTo(cx + 4 * s, cy + 4 * s);    // Middle point right

  // Jag back to the left
  ctx.lineTo(cx + 20 * s, cy + 4 * s);   // Notch right

  // Bottom triangle going left
  ctx.lineTo(cx - 32 * s, cy + 48 * s);  // Bottom left
  ctx.lineTo(cx - 4 * s, cy - 4 * s);    // Middle point left

  // Jag back to complete
  ctx.lineTo(cx - 20 * s, cy - 4 * s);   // Notch left

  ctx.closePath();
  ctx.fill();

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
