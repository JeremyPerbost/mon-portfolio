import { useEffect, useRef } from "react";
import "./InteractiveBackground.css";

const artworks = [
  { theme: "contact", src: "/ressources/backgrounds/contact.svg" },
];

export default function InteractiveBackground() {
  const backgroundRef = useRef(null);

  useEffect(() => {
    const element = backgroundRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;

    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.setProperty("--pointer-visible", "0");
    };
    const move = (event) => {
      if (motion.matches || !pointer.matches || event.pointerType === "touch") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--pointer-x", `${event.clientX}px`);
        element.style.setProperty("--pointer-y", `${event.clientY}px`);
        element.style.setProperty("--pointer-visible", "1");
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    motion.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      motion.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
    };
  }, []);

  return (
    <div className="ambient-background" ref={backgroundRef} aria-hidden="true">
      {artworks.map((artwork) => (
        <div
          className={`ambient-art ambient-art--${artwork.theme}`}
          key={artwork.theme}
          style={{ backgroundImage: `url("${artwork.src}")` }}
        />
      ))}
      <div className="ambient-field ambient-field--first"><div /></div>
      <div className="ambient-field ambient-field--second"><div /></div>
      <div className="ambient-grid" />
      <div className="ambient-pointer" />
    </div>
  );
}
