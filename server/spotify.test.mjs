import test from 'node:test';
import assert from 'node:assert/strict';
import { createNowPlayingReader } from './spotify.mjs';

const env = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'private-secret', SPOTIFY_REFRESH_TOKEN: 'private-refresh' };
const token = () => Response.json({ access_token: 'private-access', expires_in: 3600 });
const song = { is_playing: true, currently_playing_type: 'track', item: {
  name: 'Test song', artists: [{ name: 'Test artist' }], album: { images: [{ url: 'https://image.example/cover.png' }] },
  external_urls: { spotify: 'https://open.spotify.com/track/test' },
} };

test('returns only display data and shares token/playback calls across concurrent visitors', async () => {
  const requests = [];
  const read = createNowPlayingReader(env, async (url, options) => {
    requests.push({ url, options });
    return url.includes('/api/token') ? token() : Response.json(song);
  });
  const results = await Promise.all([read(), read(), read()]);
  assert.equal(results[0].title, 'Test song');
  assert.equal(results[0].artist, 'Test artist');
  assert.equal(requests.length, 2);
  assert.ok(!JSON.stringify(results).includes('private-'));
  await read();
  assert.equal(requests.length, 2);
});

for (const [name, playback] of [
  ['no playback', () => new Response(null, { status: 204 })],
  ['paused', () => Response.json({ ...song, is_playing: false })],
  ['podcast', () => Response.json({ ...song, currently_playing_type: 'episode' })],
  ['rate limited', () => new Response(null, { status: 429, headers: { 'Retry-After': '60' } })],
  ['revoked token', () => new Response(null, { status: 401 })],
]) {
  test(`hides the widget when ${name}`, async () => {
    const read = createNowPlayingReader(env, async url => url.includes('/api/token') ? token() : playback());
    assert.deepEqual(await read(), { isPlaying: false });
  });
}

test('network failures are hidden and temporarily cached', async () => {
  let calls = 0;
  const read = createNowPlayingReader(env, async () => { calls++; throw new Error('network'); });
  assert.deepEqual(await read(), { isPlaying: false });
  await read();
  assert.equal(calls, 1);
});
