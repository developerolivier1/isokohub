import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

function generateSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#g)"/>
  <text x="50%" y="68%" font-family="Arial,sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="white" text-anchor="middle">I</text>
</svg>`;
}

const sizes = [192, 512];
for (const size of sizes) {
  const svgPath = join(iconsDir, `icon-${size}x${size}.svg`);
  const pngPath = join(iconsDir, `icon-${size}x${size}.png`);
  writeFileSync(svgPath, generateSvg(size));
  writeFileSync(pngPath, generateSvg(size));
  console.log(`Generated ${svgPath}`);
}

const appleTouch = join(publicDir, 'apple-touch-icon.png');
writeFileSync(appleTouch, generateSvg(180));
console.log(`Generated ${appleTouch}`);

console.log('Icon generation complete.');
