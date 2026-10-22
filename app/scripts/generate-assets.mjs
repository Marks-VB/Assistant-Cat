// Gera os bitmaps de origem (ícone 1024px e splash 2732px) a partir do SVG do app.
// Depois rode: npm run assets:generate
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceSvg = path.join(root, 'public', 'icon.svg');
const resourcesDir = path.join(root, 'resources');
const background = '#121212';

await mkdir(resourcesDir, { recursive: true });

await sharp(sourceSvg).resize(1024, 1024).png().toFile(path.join(resourcesDir, 'icon.png'));

// Ícone adaptativo: somente o gato, centralizado na zona segura, sobre fundo sólido.
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g transform="translate(256 256) scale(1) translate(-256 -256)">
    <path d="M112 215 96 91l126 71a157 157 0 0 1 68 0l126-71-16 124a160 160 0 1 1-288 0Z" fill="#FF4D4D"/>
    <path d="M151 257c0-18 13-32 30-32s30 14 30 32-13 32-30 32-30-14-30-32Zm150 0c0-18 13-32 30-32s30 14 30 32-13 32-30 32-30-14-30-32Z" fill="#121212"/>
    <path d="m256 282-25 31h50l-25-31Zm-46 59c15 16 30 23 46 23s31-7 46-23" fill="none" stroke="#121212" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  </g>
</svg>`;

await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile(path.join(resourcesDir, 'icon-foreground.png'));

await sharp({
  create: { width: 1024, height: 1024, channels: 4, background }
}).png().toFile(path.join(resourcesDir, 'icon-background.png'));

const splashSize = 2732;
const splashIcon = await sharp(sourceSvg).resize(512, 512).png().toBuffer();
const splash = sharp({
  create: { width: splashSize, height: splashSize, channels: 4, background }
}).composite([{ input: splashIcon, gravity: 'centre' }]);

await splash.png().toFile(path.join(resourcesDir, 'splash.png'));
await splash.png().toFile(path.join(resourcesDir, 'splash-dark.png'));

// Ícone 512x512 exigido pela ficha da Google Play.
const storeDir = path.join(root, '..', 'artes', 'play-store');
await mkdir(storeDir, { recursive: true });
await sharp(sourceSvg).resize(512, 512).png().toFile(path.join(storeDir, 'icone-512.png'));

console.log('Assets gerados em app/resources/ e artes/play-store/');
