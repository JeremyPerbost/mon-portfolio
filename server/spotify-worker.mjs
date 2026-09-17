const CACHE_SECONDS = 15;

function json(data, origin, status = 200) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(data), { status, headers });
}

async function getAccessToken(env) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!response.ok) throw new Error("Spotify authorization unavailable");
  return response.json();
}

async function getNowPlaying(env) {
  const token = await getAccessToken(env);
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (response.status === 204 || response.status === 429) return { isPlaying: false };
  if (!response.ok) throw new Error("Spotify playback unavailable");
  const data = await response.json();
  if (!data.is_playing || data.currently_playing_type !== "track" || !data.item || data.item.is_local) {
    return { isPlaying: false };
  }
  return {
    isPlaying: true,
    title: data.item.name,
    artist: (data.item.artists || []).map((artist) => artist.name).join(", "),
    cover: data.item.album?.images?.[0]?.url || null,
    url: data.item.external_urls?.spotify,
  };
}

export async function handleSpotifyRequest(request, env, ctx) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "https://jeremyperbost.fr")
    .split(",")
    .map((value) => value.trim());

  if (url.pathname !== "/now-playing") return new Response(null, { status: 404 });
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
  if (origin && !allowed.includes(origin)) return new Response(null, { status: 403 });

  const cache = caches.default;
  const cacheKey = new Request("https://spotify-cache.internal/now-playing");
  const cached = await cache.match(cacheKey);
  if (cached) return json(await cached.json(), origin);

  let data;
  try {
    data = await getNowPlaying(env);
  } catch {
    data = { isPlaying: false };
  }
  const cachedResponse = json(data, null);
  cachedResponse.headers.set("Cache-Control", `max-age=${CACHE_SECONDS}`);
  ctx.waitUntil(cache.put(cacheKey, cachedResponse));
  return json(data, origin);
}

export default {
  fetch: handleSpotifyRequest,
};
