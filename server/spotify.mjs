// Node 20.12+; no third-party dependencies. Credentials stay on this server.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createNowPlayingReader(env, request = fetch) {
  let cached = { isPlaying: false };
  let cacheUntil = 0;
  let pending;
  let accessToken;
  let tokenUntil = 0;
  let refreshToken = env.SPOTIFY_REFRESH_TOKEN;

  async function read() {
    if (!accessToken || Date.now() >= tokenUntil) {
      const response = await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('Spotify authorization unavailable');
      const token = await response.json();
      accessToken = token.access_token;
      refreshToken = token.refresh_token || refreshToken;
      tokenUntil = Date.now() + Math.max(0, token.expires_in - 60) * 1000;
    }
    const response = await request('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401) tokenUntil = 0;
    if (response.status === 429) {
      cacheUntil = Date.now() + Math.max(30, Number(response.headers.get('Retry-After')) || 30) * 1000;
      return { isPlaying: false };
    }
    if (response.status === 204) return { isPlaying: false };
    if (!response.ok) throw new Error('Spotify playback unavailable');
    const data = await response.json();
    if (!data.is_playing || data.currently_playing_type !== 'track' || !data.item || data.item.is_local) return { isPlaying: false };
    return {
      isPlaying: true,
      title: data.item.name,
      artist: (data.item.artists || []).map(artist => artist.name).join(', '),
      cover: data.item.album?.images?.[0]?.url || null,
      url: data.item.external_urls?.spotify,
    };
  }

  return async () => {
    if (Date.now() < cacheUntil) return cached;
    if (!pending) pending = read().then(data => {
      cached = data;
      cacheUntil = Math.max(cacheUntil, Date.now() + 15000);
      return data;
    }).catch(() => {
      cached = { isPlaying: false };
      cacheUntil = Date.now() + 30000;
      return cached;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}

export function createSpotifyServer(env) {
  const read = createNowPlayingReader(env);
  const origins = (env.ALLOWED_ORIGINS || 'https://jeremyperbost.fr').split(',').map(s => s.trim());
  return createServer(async (req, res) => {
    if (req.url !== '/now-playing') { res.writeHead(404).end(); return; }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    if (req.headers.origin && !origins.includes(req.headers.origin)) { res.writeHead(403).end(); return; }
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (req.headers.origin) headers['Access-Control-Allow-Origin'] = req.headers.origin;
    res.writeHead(200, headers).end(JSON.stringify(await read()));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'].every(key => process.env[key])) {
    console.error('Configure server/.env first; see server/README.md.');
    process.exitCode = 1;
  } else {
    createSpotifyServer(process.env).listen(Number(process.env.PORT) || 3001, process.env.HOST || '127.0.0.1', () => console.log('Spotify endpoint ready.'));
  }
}
