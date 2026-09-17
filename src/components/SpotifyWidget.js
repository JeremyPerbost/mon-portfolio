import { useEffect, useState } from "react";
import "./SpotifyWidget.css";

export default function SpotifyWidget({ endpoint = process.env.REACT_APP_SPOTIFY_ENDPOINT }) {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    if (!endpoint) return undefined;
    let disposed = false;
    let timer;
    let controller;
    const update = async () => {
      clearTimeout(timer);
      controller?.abort();
      if (document.hidden) return;
      controller = new AbortController();
      const activeController = controller;
      const timeout = setTimeout(() => activeController.abort(), 10000);
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error("Spotify unavailable");
        const data = await response.json();
        if (!disposed && controller === activeController) setTrack(data.isPlaying && data.title && /^https:\/\/open\.spotify\.com\//.test(data.url) ? data : null);
      } catch {
        if (!disposed && controller === activeController) setTrack(null);
      } finally {
        clearTimeout(timeout);
        if (!disposed && controller === activeController && !document.hidden) timer = setTimeout(update, 30000);
      }
    };
    const visibility = () => {
      clearTimeout(timer);
      if (document.hidden) controller?.abort();
      else update();
    };
    update();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [endpoint]);

  if (!track) return null;
  return (
    <a className="spotify-widget" href={track.url} target="_blank" rel="noopener noreferrer" aria-label={`J’écoute ${track.title}, ${track.artist}, sur Spotify (nouvel onglet)`}>
      {track.cover && <img src={track.cover} alt="Pochette de l’album" />}
      <span className="spotify-widget__text">
        <span className="spotify-widget__label">J’écoute sur Spotify</span>
        <strong>{track.title}</strong>
        <span className="spotify-widget__artist">{track.artist}</span>
      </span>
      <span className="spotify-widget__bars" aria-hidden="true"><i /><i /><i /></span>
    </a>
  );
}
