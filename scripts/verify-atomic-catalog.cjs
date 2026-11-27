const assert = require('node:assert/strict')
const { createServer } = require('node:http')
const { readFileSync } = require('node:fs')
const { chromium, expect } = require('@playwright/test')

const core = 'https://atomicdata.dev/properties/'
const props = 'https://atomicdata.dev/integrations/properties/'
const bundle = readFileSync('atomic/sharesome-0.1.0.js');
const {createHash} = require('node:crypto');
const moduleUrl = 'http://localhost:8000/atomic/sharesome-0.1.0.js';
const sharesome = {
  [core + 'localId']: 'sharesome',
  [core + 'shortname']: 'sharesome',
  [core + 'isA']: ['https://atomicdata.dev/integrations/classes/PluginCatalogEntry'],
  [core + 'name']: 'Sharesome',
  [props + 'version']: '0.1.0',
  [props + 'app-module']: moduleUrl,
  [props + 'app-module-integrity']: 'sha384-' + createHash('sha384').update(bundle).digest('base64'),
  [props + 'enabled']: true,
  [props + 'experimental']: true
};
if (process.argv[2] === 'serve') {
  createServer((request, response) => {
    if (request.url === new URL(moduleUrl).pathname) {
      response.setHeader('Content-Type', 'application/javascript')
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.end(bundle)
      return
    }
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.end(JSON.stringify(request.url === '/catalog.json' ? [sharesome] : []))
  }).listen(8000, '127.0.0.1')
} else {
  verify().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

async function verify () {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.addInitScript(() => {
    if (location.origin === 'http://localhost:6747') {
      localStorage.setItem('plugin-catalog-url', 'http://localhost:8000/catalog.json')
    }
  })
  const diagnostics = []
  page.on('pageerror', error => diagnostics.push(error.message))
  page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()) })
  page.on('requestfailed', request => diagnostics.push(request.url() + ' ' + request.failure()?.errorText))
  try {
    await page.goto('http://localhost:6747/app/dev-drive', { waitUntil: 'commit', timeout: 90000 })
    await page.waitForURL(/(?:did(?:%3A|:)ad|atomic)(?:%3A|:)/, { timeout: 150000 })
    console.log('Created fresh drive')
    await page.goto('http://localhost:6747/app/apps?preview=plugins', { waitUntil: 'commit', timeout: 90000 })
    await page.getByRole('checkbox', { name: 'Show experimental apps' }).check({ timeout: 30000 })
    const install = page.getByRole('button', { name: 'Install Sharesome', exact: true })
    await install.waitFor({ timeout: 40000 })
    const download = page.waitForResponse(r => r.url() === moduleUrl && r.ok(), { timeout: 50000 })
    await install.click()
    await download
    const frameSelector = 'iframe[title="App"][sandbox="allow-scripts allow-modals"]'
    const frame = page.frameLocator(frameSelector)
    await frame.getByRole('button', {name: 'Choose or upload a file'}).click({timeout: 90000})
    await page.locator('input[type=file]').setInputFiles({
      name: 'sharesome-test.txt', mimeType: 'text/plain', buffer: Buffer.from('Sharesome public-read test')
    })
    const share = page.getByRole('dialog').filter({hasText: 'Share sharesome-test.txt'})
    await expect(share).toBeVisible({timeout: 30000})
    await share.getByRole('radio', {name: 'Read', exact: true}).check()
    await expect(share.getByText('Anyone can open it without joining')).toBeVisible()
    await share.getByRole('button', {name: 'Done', exact: true}).click()
    const link = frame.getByLabel('Public resource link')
    await expect(link).toBeVisible()
    const url = await link.inputValue()
    assert.ok(/^https?:/.test(url))
    const parsed = new URL(url)
    const resource = new URL('/resource', parsed.origin)
    resource.searchParams.set('subject', parsed.searchParams.get('subject') ?? url)
    const guest = await browser.newContext()
    const readPublic = await guest.request.get(resource.href, {headers: {Accept: 'application/ad+json'}})
    assert.ok(readPublic.ok(), 'a signed-out client should be able to read the public file resource')
    await page.reload({waitUntil: 'commit', timeout: 90000})
    await expect(frame.getByLabel('Public resource link')).toHaveValue(url, {timeout: 90000})
    await frame.getByRole('button', {name: 'Sharing settings'}).click()
    await share.getByRole('radio', {name: 'Off', exact: true}).check()
    await share.getByRole('button', {name: 'Done', exact: true}).click()
    await expect(frame.getByLabel('Public resource link')).toHaveCount(0)
    const readPrivate = await guest.request.get(resource.href, {headers: {Accept: 'application/ad+json'}})
    assert.ok(!readPrivate.ok(), 'the same signed-out client should lose access after revocation')
    await guest.close()
    console.log('Uploaded a file, enabled public read in the host, reopened the share, and turned public read off')
  } catch (error) {
    console.error((await page.locator('body').innerText().catch(() => '')).slice(0, 3200))
    for (const frame of page.frames().slice(1)) {
      console.error(frame.url(), (await frame.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, 1000))
    }
    console.error(diagnostics.slice(-35).join('\n'))
    throw error
  } finally {
    await browser.close()
  }
}
