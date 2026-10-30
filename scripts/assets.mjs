// Renders PNG icons and the social card with system Chrome.
// Usage: npm run assets
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const font = async (pkg, file) =>
  `data:font/woff2;base64,${(await readFile(`${root}node_modules/@fontsource-variable/${pkg}/files/${file}`)).toString('base64')}`;

const fraunces = await font('fraunces', 'fraunces-latin-opsz-italic.woff2');
const fraunces2 = await font('fraunces', 'fraunces-latin-opsz-normal.woff2');
const grotesk = await font('schibsted-grotesk', 'schibsted-grotesk-latin-wght-normal.woff2');
const mono = await font('martian-mono', 'martian-mono-latin-wght-normal.woff2');
const favicon = await readFile(`${root}public/favicon.svg`, 'utf8');

const fonts = `
@font-face{font-family:F;font-style:italic;src:url(${fraunces})}
@font-face{font-family:F;font-style:normal;src:url(${fraunces2})}
@font-face{font-family:G;src:url(${grotesk})}
@font-face{font-family:M;src:url(${mono})}`;

const og = `<!doctype html><style>${fonts}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f4f3ee;color:#1b1a17;font-family:G;display:grid;grid-template-columns:1fr 430px;gap:56px;padding:72px 80px;align-items:center}
.eyebrow{font:500 15px M;letter-spacing:.2em;text-transform:uppercase;color:#78756c}
h1{font-family:F;font-weight:400;font-variation-settings:'opsz' 144;font-size:96px;line-height:.93;letter-spacing:-.04em;margin-top:26px}
h1 em{color:#1f5c46}
.logo{display:flex;align-items:center;gap:14px;font:italic 40px F;letter-spacing:-.03em;margin-bottom:56px}
.logo i{width:22px;height:22px;border-radius:50%;display:inline-block}
.board{background:#1f5c46;border-radius:32px;padding:22px;display:grid;grid-template-columns:repeat(7,1fr);gap:9px;box-shadow:0 40px 80px -40px rgba(0,0,0,.45)}
.board span{aspect-ratio:1;border-radius:50%;background:rgba(0,0,0,.26)}
.r{background:#d9442b!important}.k{background:#1b1a17!important}.w{box-shadow:0 0 0 4px #e0a32e}
p{margin-top:28px;font-size:22px;color:#78756c}
</style><body><div>
<div class="logo"><i style="background:#d9442b"></i><i style="background:#1b1a17;margin-left:-6px"></i>Parlour</div>
<div class="eyebrow">Six games · two players · one link</div>
<h1>Board games for two, <em>over a link.</em></h1>
<p>Chess, Reversi, Four in a Row, Dots &amp; Boxes and more.</p>
</div><div class="board">${Array.from({ length: 42 }, (_, i) => {
  const map = { 36: 'r w', 37: 'r w', 38: 'r w', 39: 'r w', 29: 'k', 30: 'k', 31: 'k', 40: 'k', 32: 'r', 24: 'k' };
  return `<span class="${map[i] ?? ''}"></span>`;
}).join('')}</div></body>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

for (const [file, size] of [['favicon.png', 64], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await page.setViewport({ width: size, height: size });
  const pad = file === 'apple-touch-icon.png' ? '' : '';
  await page.setContent(`<style>*{margin:0}body{width:${size}px;height:${size}px}svg{width:100%;height:100%;display:block}</style>${favicon.replace('rx="16"', file.startsWith('icon-') || file.startsWith('apple') ? 'rx="0"' : 'rx="16"')}${pad}`);
  await writeFile(`${root}public/${file}`, await page.screenshot({ type: 'png', omitBackground: true }));
  console.log('wrote', file);
}

await page.setViewport({ width: 1200, height: 630 });
await page.setContent(og, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await writeFile(`${root}public/og.png`, await page.screenshot({ type: 'png' }));
console.log('wrote og.png');
await browser.close();
