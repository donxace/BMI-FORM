const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

(async () => {
  const token = jwt.sign(
    { sub: 1, username: 'admin', role: 'admin' },
    'your_secret_key',
    { expiresIn: '1h' }
  );

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`[console.${msg.type()}]`, msg.text());
  });
  page.on('pageerror', (err) => {
    console.log('[pageerror]', err.message);
  });
  page.on('requestfailed', (req) => {
    console.log('[requestfailed]', req.url(), req.failure()?.errorText);
  });

  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem('authToken', t);
    localStorage.setItem('userRole', 'admin');
  }, token);

  await page.setViewport({ width: 1280, height: 900 });

  console.log('--- Navigating to /environment-monitoring ---');
  await page.goto('http://localhost:5174/environment-monitoring', {
    waitUntil: 'networkidle0',
  });
  await page.screenshot({ path: 'nav-check-1-environment.png' });

  console.log('--- Clicking Intrusion Detection nav link ---');
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const target = links.find((a) =>
      a.textContent?.includes('Intrusion Detection')
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Link found and clicked:', clicked);

  await new Promise((r) => setTimeout(r, 1500));
  console.log('Current URL:', page.url());

  await page.screenshot({ path: 'nav-check-2-intrusion.png' });

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('--- Body text sample ---');
  console.log(bodyText);

  await browser.close();
})().catch((err) => {
  console.error('SCRIPT ERROR:', err);
  process.exit(1);
});
