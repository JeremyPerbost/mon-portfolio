import { useEffect, useState } from "react";
import "./SteamWidget.css";

export default function SteamWidget({ endpoint = process.env.REACT_APP_STEAM_ENDPOINT }) {
  const [game, setGame] = useState(null);

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
        const response = await fetch(endpoint, { signal: activeController.signal });
        if (!response.ok) throw new Error("Steam unavailable");
        const data = await response.json();
        const validUrl = /^https:\/\/store\.steampowered\.com\/app\//.test(data.url || "");
        if (!disposed && controller === activeController) setGame(data.isPlaying && data.title && validUrl ? data : null);
      } catch {
        if (!disposed && controller === activeController) setGame(null);
      } finally {
        clearTimeout(timeout);
        if (!disposed && controller === activeController && !document.hidden) timer = setTimeout(update, 60000);
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

  if (!game) return null;
  return (
    <a className="steam-widget" href={game.url} target="_blank" rel="noopener noreferrer" aria-label={`Je joue à ${game.title} sur Steam (nouvel onglet)`}>
      {game.cover && <img src={game.cover} alt={`Illustration de ${game.title}`} />}
      <span className="steam-widget__text">
        <span className="steam-widget__label">Je joue sur Steam</span>
        <strong>{game.title}</strong>
      </span>
      <span className="steam-widget__status" aria-hidden="true" />
    </a>
  );
}
