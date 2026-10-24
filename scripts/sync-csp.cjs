// Run after changing browser scripts. Static pages use hash-based strict CSP
// and SRI, avoiding a fixed nonce or an evolving ad-script domain allowlist.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const scripts = ['app.js', 'info-actions.js', 'resources.js', 'ads-loader.js', 'navigation.js'];
const hashes = new Map(scripts.map(name => {
  const file = path.join(root, name);
  const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  fs.writeFileSync(file, source);
  return [name, 'sha256-' + crypto.createHash('sha256').update(source).digest('base64')];
}));
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
  if (entry.name.startsWith('.') || entry.name === 'audio' || entry.name === 'images') return [];
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of walk(root)) {
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace(/<script\b([^>]*\bsrc="([^"]+)"[^>]*)>/g, (tag, attrs, src) => {
    const hash = hashes.get(path.posix.basename(src.split('?')[0]));
    if (!hash) throw new Error('Untrusted script in ' + file + ': ' + src);
    attrs = attrs.replace(/\s+(?:integrity|crossorigin)="[^"]*"/gi, '');
    return `<script${attrs} integrity="${hash}" crossorigin="anonymous">`;
  });
  fs.writeFileSync(file, source.replace(/\r\n/g, '\n'));
}
const configFile = path.join(root, 'vercel.json');
const config = JSON.parse(fs.readFileSync(configFile));
config.buildCommand = 'node scripts/sync-csp.cjs';
config.outputDirectory = '.';
const csp = ["default-src 'self'", "base-uri 'none'", "object-src 'none'", "form-action 'self'", "frame-ancestors 'self'",
  `script-src 'self' ${[...hashes.values()].map(h => `'${h}'`).join(' ')} 'strict-dynamic' https:`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:", "media-src 'self'", "frame-src https:", "connect-src 'self' https:", 'upgrade-insecure-requests'].join('; ');
config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value = csp;
fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
console.log('Updated script integrity and strict CSP for ' + hashes.size + ' scripts.');
