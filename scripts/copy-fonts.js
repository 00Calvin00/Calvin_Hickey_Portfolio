/**
 * Copies the Latin-subset WOFF2 files the site uses from the Fontsource
 * packages into site/fonts/, along with each font's SIL Open Font License.
 *
 * Self-hosting avoids a third-party request to Google Fonts and lets the
 * browser reuse the same connection as the page.
 *
 * Usage: npm run fonts
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUTPUT_DIR = 'site/fonts';

// [package, file in the package's files/ folder, output name]
const FONTS = [
  ['@fontsource-variable/fraunces', 'fraunces-latin-opsz-normal.woff2', 'fraunces.woff2'],
  ['@fontsource-variable/fraunces', 'fraunces-latin-opsz-italic.woff2', 'fraunces-italic.woff2'],
  ['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2', 'inter.woff2'],
  ['@fontsource/anton', 'anton-latin-400-normal.woff2', 'anton.woff2'],
  [
    '@fontsource/permanent-marker',
    'permanent-marker-latin-400-normal.woff2',
    'permanent-marker.woff2',
  ],
];

await mkdir(OUTPUT_DIR, { recursive: true });

for (const [pkg, file, name] of FONTS) {
  const root = path.dirname(require.resolve(`${pkg}/package.json`));
  await copyFile(path.join(root, 'files', file), path.join(OUTPUT_DIR, name));
  await copyFile(
    path.join(root, 'LICENSE'),
    path.join(OUTPUT_DIR, `${name.replace(/(-italic)?\.woff2$/, '')}-OFL.txt`),
  );
  console.log(`${pkg} -> ${OUTPUT_DIR}/${name}`);
}
