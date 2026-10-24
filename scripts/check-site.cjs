const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
const policy = config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
const htmlFiles = [
  ...fs.readdirSync(root).filter(n => n.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'guides')).filter(n => n.endsWith('.html')).map(n => 'guides/' + n)
];
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/id="siteNavigation"/g) || []).length, 1, file);
  assert.equal((html.match(/id="menuToggle"/g) || []).length, 1, file);
  assert.equal(/ads-loader\.js/.test(html), file.startsWith('guides/'), 'Ad placement: ' + file);
  assert.ok(!html.includes('pagead2.googlesyndication.com'), 'Direct advertising runtime: ' + file);
  for (const [,attrs,src] of html.matchAll(/<script\b([^>]*\bsrc="([^"]+)"[^>]*)>/g)) {
    const source = fs.readFileSync(path.join(root, path.basename(src.split('?')[0])));
    const hash = 'sha256-' + crypto.createHash('sha256').update(source).digest('base64');
    assert.ok(attrs.includes(`integrity="${hash}"`), 'Integrity mismatch: ' + file);
    assert.ok(policy.includes(`'${hash}'`), 'CSP trust missing: ' + file);
  }
}
for (const [slug, minutes] of [['30-minute-study',30],['60-minute-study',60],['90-minute-exam-routine',90]]) {
  const html = fs.readFileSync(path.join(root, 'guides', slug + '.html'), 'utf8');
  assert.ok(html.includes(`class="cta" href="/?minutes=${minutes}"`), slug);
}
const loader = fs.readFileSync(path.join(root, 'ads-loader.js'), 'utf8');
for (const route of ['/', '/index.html', '/resources', '/resources.html', '/about', '/contact', '/privacy', '/guides', '/guides/', '/guides/study-record', '/guides/timer-walkthrough.html']) {
  const inserted = [];
  vm.runInNewContext(loader, {window:{location:{pathname:route}},document:{createElement:()=>({}),head:{appendChild:s=>inserted.push(s)}}});
  assert.equal(inserted.length, /^\/guides\/[^/]+$/.test(route) ? 1 : 0, route);
}
console.log(`PASS: ${htmlFiles.length} pages: navigation, guide-only ads, SRI/CSP, duration links and ad-loader routes`);
