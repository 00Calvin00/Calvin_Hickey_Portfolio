/**
 * Turns the full-size originals in assets/images/ into web-ready files in site/img/.
 *
 * Every image gets a WebP and a JPEG at each width, so <picture> can serve
 * the smallest file the browser supports at the size it actually needs.
 *
 * Usage: npm run images
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE_DIR = 'assets/images';
const OUTPUT_DIR = 'site/img';

// crop: optional aspect ratio [w, h]; position: which part to keep when cropping
const IMAGES = [
  { src: 'portrait.jpg', name: 'portrait', widths: [400, 800], crop: [4, 5], position: 'centre' },
  { src: 'uguide.png', name: 'uguide', widths: [700, 1400], crop: [16, 10], position: 'top' },
  { src: 'apecoo.png', name: 'apecoo', widths: [700, 1400], crop: [16, 10], position: 'top' },
];

async function build({ src, name, widths, crop, position }) {
  for (const width of widths) {
    const height = crop ? Math.round((width * crop[1]) / crop[0]) : undefined;
    const pipeline = sharp(`${SOURCE_DIR}/${src}`)
      .rotate()
      .resize({ width, height, fit: 'cover', position });
    await pipeline.clone().webp({ quality: 78 }).toFile(`${OUTPUT_DIR}/${name}-${width}.webp`);
    await pipeline
      .clone()
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(`${OUTPUT_DIR}/${name}-${width}.jpg`);
    console.log(`${name}-${width} (${width}x${height ?? 'auto'})`);
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });
for (const image of IMAGES) await build(image);
