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

  // Lightning bolt
  ctx.fillStyle = ICON_COLOR;

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 128; // Base design at 128px

  // Lightning bolt path (stylized)
  ctx.beginPath();

  // Points for lightning bolt shape - classic design
  const points = [
    [cx + 12 * scale, cy - 42 * scale],   // Top right start
    [cx - 18 * scale, cy + 6 * scale],    // Middle left
    [cx + 4 * scale, cy + 6 * scale],     // Middle center right
    [cx - 12 * scale, cy + 42 * scale],   // Bottom left end
    [cx + 18 * scale, cy - 6 * scale],    // Middle right
    [cx - 4 * scale, cy - 6 * scale],     // Middle center left
  ];

  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
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
