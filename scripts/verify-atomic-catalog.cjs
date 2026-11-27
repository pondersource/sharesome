const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFileSync} = require('node:fs');
const {chromium, expect} = require('@playwright/test');

const core = 'https://atomicdata.dev/properties/';
const integration = 'https://atomicdata.dev/integrations/properties/';
const specs = [
  ['litewrite', '#editor'],
  ['todonna', '#new-item-input'],
  ['webmarks', 'h1'],
  ['sharesome', 'button:has-text("Choose or upload a file")'],
  ['umai', 'h1'],
  ['inspektor', 'button:has-text("Choose a resource")'],
  ['media-kraken', 'h1'],
  ['focus', 'h1'],
  ['inbox-rs', 'h1'],
  ['hyperdraft', 'h1'],
  ['savr', 'h1'],
  ['marco', 'canvas'],
  ['solid-memo', 'h1']
];
const catalog = JSON.parse(readFileSync('upstream-catalog.json', 'utf8'));
const entries = specs.map(([id]) => {
  const e = catalog.find(x => x[core + 'shortname'] === id);
  assert.ok(e, id + ' missing from catalog');
  return e;
});
if (process.argv[2] === 'serve') {
  createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(req.url === '/catalog.json' ? entries : []));
  }).listen(8000, '127.0.0.1');
} else {
  verify().catch(error => { console.error(error); process.exitCode = 1; });
}

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(() => {
    if (location.origin === 'http://localhost:6747') {
      localStorage.setItem('plugin-catalog-url', 'http://localhost:8000/catalog.json');
    }
  });
  try {
    const origin = 'http://localhost:6747';
    await page.goto(origin + '/app/dev-drive', {waitUntil: 'commit', timeout: 90000});
    await page.waitForURL(/(?:did(?:%3A|:)ad|atomic)(?:%3A|:)/, {timeout: 150000});
    for (const [i, [id, selector]] of specs.entries()) {
      const entry = entries[i];
      const name = entry[core + 'name'];
      console.log('Installing', id);
      await page.goto(origin + '/app/apps?preview=plugins', {waitUntil: 'commit', timeout: 90000});
      await page.getByRole('checkbox', {name: 'Show experimental apps'}).check({timeout: 30000});
      const install = page.getByRole('button', {name: 'Install ' + name, exact: true});
      await install.waitFor({timeout: 40000});
      const url = entry[integration + 'app-module'];
      const downloaded = page.waitForResponse(r => r.url() === url && r.ok(), {timeout: 50000});
      await install.click();
      await downloaded;
      const frame = page.frameLocator('iframe[title="App"][sandbox="allow-scripts allow-modals"]');
      const control = frame.locator(selector).first();
      await expect(control).toBeVisible({timeout: 60000});
      if (selector === 'h1') await expect(control).toContainText(name);
      console.log('Verified', id);
    }
  } catch (error) {
    console.error((await page.locator('body').innerText().catch(() => '')).slice(0, 2700));
    for (const frame of page.frames().slice(1)) {
      console.error((await frame.locator('body').innerText({timeout: 3000}).catch(() => '')).slice(0, 800));
    }
    throw error;
  } finally {
    await browser.close();
  }
}
