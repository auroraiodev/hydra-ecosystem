import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const targets = [
  'public/modal.png',
  'public/banners/desktop/2.png',
  'public/banners/mobile/1.png',
  'public/banners/mobile/2.png',
  'public/banners/desktop/1.jpg',
];

async function optimize() {
  console.log('🚀 Starting image optimization...');

  for (const target of targets) {
    const fullPath = path.join(root, target);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath);
      const output = fullPath.replace(ext, '.webp');

      try {
        const info = await sharp(fullPath).webp({ quality: 80 }).toFile(output);

        const oldSize = fs.statSync(fullPath).size;
        const newSize = info.size;

        console.log(`✅ ${target}:`);
        console.log(
          `   ${(oldSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB`
        );

        if (newSize < oldSize) {
          fs.unlinkSync(fullPath);
          console.log(`   Original removed.`);
        }
      } catch (err) {
        console.error(`❌ Error optimizing ${target}:`, err.message);
      }
    } else {
      console.log(`⚠️ File not found: ${target}`);
    }
  }
}

optimize();
