// One-time authorization, accessible only from this computer.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Fill SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in server/.env first.');
  process.exit(1);
}
const redirect = 'http://127.0.0.1:8888/callback';
const state = randomBytes(32).toString('hex');
const parameters = new URLSearchParams({
  client_id: SPOTIFY_CLIENT_ID, response_type: 'code', redirect_uri: redirect,
  scope: 'user-read-currently-playing', state,
});
let used = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8888');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
  if (used || url.searchParams.get('state') !== state) { res.writeHead(400).end('Invalid authorization state.'); return; }
  used = true;
  try {
    if (!url.searchParams.get('code') || url.searchParams.has('error')) throw new Error();
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: redirect }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!data.refresh_token) throw new Error();
    const path = new URL('./.env', import.meta.url);
    const original = await readFile(path, 'utf8');
    const line = `SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`;
    const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(original)
      ? original.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, () => line)
      : `${original}\n${line}\n`;
    await writeFile(path, updated, { mode: 0o600 });
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Spotify connecté. Tu peux fermer cet onglet.');
    console.log('Spotify connected. Credentials saved locally, without printing them.');
  } catch {
    res.writeHead(400).end('Authorization failed. Restart the setup to try again.');
  } finally {
    clearTimeout(expiry);
    server.close();
  }
});
const expiry = setTimeout(() => server.close(), 10 * 60 * 1000);
server.listen(8888, '127.0.0.1', () => {
  console.log(`Open this link on this computer:\nhttps://accounts.spotify.com/authorize?${parameters}`);
});
