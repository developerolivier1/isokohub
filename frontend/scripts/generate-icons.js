import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'assets', 'logo.png');

if (!existsSync(logoPath)) {
  console.error('ERROR: Main logo not found at assets/logo.png. Please ensure the logo file exists.');
  process.exit(1);
}

console.log('All PWA icons now reference /assets/logo.png directly via manifest.json and vite.config.js.');
console.log('No separate icon generation needed. The main logo file is used for all branding.');
console.log(`Logo location: ${logoPath}`);
console.log('Icon generation complete.');
