const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, filename) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // Border
  const b = Math.max(1, Math.round(size * 0.04));
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = b;
  ctx.strokeRect(b, b, size - b * 2, size - b * 2);

  // "AP" text
  const fontSize = Math.round(size * 0.35);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AP', size / 2, size / 2);

  // Dot top-right
  const dotR = Math.max(2, Math.round(size * 0.05));
  ctx.beginPath();
  ctx.arc(size - b * 3, b * 3, dotR, 0, Math.PI * 2);
  ctx.fillStyle = '#e8e8e8';
  ctx.fill();

  fs.writeFileSync(filename, c.toBuffer('image/png'));
  console.log(`Created ${filename}`);
}

const path = require('path');
const dir = path.join(__dirname, 'icons');

generateIcon(16, path.join(dir, 'icon16.png'));
generateIcon(48, path.join(dir, 'icon48.png'));
generateIcon(128, path.join(dir, 'icon128.png'));


