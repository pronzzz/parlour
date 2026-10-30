// README screenshots. Build first, then: npm run preview -- --port 4196 & npm run screenshots
// The invite shot opens a real (empty) table, which Firestore clears after a week.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}docs/screenshots`;
const BASE = process.env.BASE_URL ?? 'http://localhost:4196';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

async function open(path, { theme = 'light', width = 1440, height = 900, mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
  await page.evaluateOnNewDocument((t) => localStorage.setItem('parlour:theme', t), theme);
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const click = (page, selector) => page.$eval(selector, (el) => el.click());
const shoot = async (page, name) => {
  await sleep(1400);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('wrote', name);
  await page.close();
};

// Landing, light and dark.
for (const theme of ['light', 'dark']) {
  const page = await open('/', { theme });
  await sleep(4200); // let the demo table drop a few discs
  await shoot(page, `landing-${theme}`);
}

// The game index.
{
  const page = await open('/');
  await page.evaluate(() => document.getElementById('games').scrollIntoView());
  await page.mouse.move(700, 420);
  await shoot(page, 'games');
}

// Chess, a few moves into an Italian.
{
  const page = await open('/here/chess', { theme: 'dark', height: 1000 });
  await sleep(800);
  for (const [a, b] of [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'], ['c2', 'c3'], ['g8', 'f6'], ['d2', 'd4']]) {
    await click(page, `[aria-label^="${a}"]`);
    await click(page, `[aria-label^="${b}"]`);
    await sleep(250);
  }
  await click(page, '[aria-label^="e5"]');
  await shoot(page, 'chess');
}

// Reversi mid-game.
{
  const page = await open('/here/reversi', { height: 1000 });
  await sleep(800);
  for (let i = 0; i < 14; i++) {
    await page.evaluate((k) => {
      const opts = [...document.querySelectorAll('[role=grid] button:not(:disabled)')];
      opts[(k * 7) % opts.length]?.click();
    }, i);
    await sleep(220);
  }
  await shoot(page, 'reversi');
}

// Snakes & Ladders.
{
  const page = await open('/here/snakes', { height: 1050 });
  await sleep(800);
  for (let i = 0; i < 9; i++) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Roll')?.click());
    await sleep(900);
  }
  await shoot(page, 'snakes');
}

// Online: the host's invite screen.
{
  const page = await open('/', { theme: 'dark' });
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Play online'))?.click());
  await page.waitForFunction(() => location.pathname.startsWith('/t/'), { timeout: 20000 });
  await page.waitForSelector('[aria-label="Invite a player"]', { timeout: 20000 });
  await shoot(page, 'invite');
}

// Phone: Four in a Row.
{
  const page = await open('/here/four', { width: 390, height: 844, mobile: true });
  await sleep(800);
  for (const c of [3, 3, 4, 2, 4, 4, 5, 2, 2]) {
    await click(page, `[aria-label="Drop in column ${c + 1}"]`);
    await sleep(350);
  }
  await shoot(page, 'phone');
}

await browser.close();
