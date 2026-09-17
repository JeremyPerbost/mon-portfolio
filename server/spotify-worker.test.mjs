import test from "node:test";
import assert from "node:assert/strict";

const memory = new Map();
globalThis.caches = {
  default: {
    match: async (key) => memory.get(key.url)?.clone(),
    put: async (key, value) => memory.set(key.url, value.clone()),
  },
};

const originalFetch = globalThis.fetch;
const { handleSpotifyRequest } = await import("./spotify-worker.mjs");
const env = {
  SPOTIFY_CLIENT_ID: "id",
  SPOTIFY_CLIENT_SECRET: "secret",
  SPOTIFY_REFRESH_TOKEN: "refresh",
  ALLOWED_ORIGINS: "https://jeremyperbost.fr,http://localhost:3000",
};
const ctx = { waitUntil: (promise) => promise };

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  memory.clear();
});

test("returns only public track data to an allowed origin", async () => {
  globalThis.fetch = async (url) => url.includes("/api/token")
    ? Response.json({ access_token: "access" })
    : Response.json({
      is_playing: true,
      currently_playing_type: "track",
      item: {
        name: "Song",
        artists: [{ name: "Artist" }],
        album: { images: [{ url: "https://image.example/cover.jpg" }] },
        external_urls: { spotify: "https://open.spotify.com/track/test" },
      },
    });
  const response = await handleSpotifyRequest(
    new Request("https://worker.example/now-playing", { headers: { Origin: "https://jeremyperbost.fr" } }),
    env,
    ctx,
  );
  const body = await response.json();
  assert.equal(body.title, "Song");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://jeremyperbost.fr");
  assert.ok(!JSON.stringify(body).includes("access"));
});

test("rejects unknown origins and paths", async () => {
  assert.equal((await handleSpotifyRequest(new Request("https://worker.example/now-playing", { headers: { Origin: "https://evil.example" } }), env, ctx)).status, 403);
  assert.equal((await handleSpotifyRequest(new Request("https://worker.example/other"), env, ctx)).status, 404);
});

test("returns the current Steam game without exposing the API key", async () => {
  globalThis.fetch = async () => Response.json({
    response: {
      players: [{
        gameid: "730",
        gameextrainfo: "Counter-Strike 2",
        profileurl: "https://steamcommunity.com/id/test/",
      }],
    },
  });
  const response = await handleSpotifyRequest(
    new Request("https://worker.example/steam", { headers: { Origin: "https://jeremyperbost.fr" } }),
    { ...env, STEAM_API_KEY: "steam-secret", STEAM_ID: "76561190000000000" },
    ctx,
  );
  const body = await response.json();
  assert.equal(body.title, "Counter-Strike 2");
  assert.equal(body.appId, "730");
  assert.ok(!JSON.stringify(body).includes("steam-secret"));
});
