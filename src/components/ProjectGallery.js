import React, { useRef, useState } from "react";

export default function ProjectGallery({ projects }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const goTo = (index) => {
    const track = trackRef.current;
    const next = Math.max(0, Math.min(projects.length - 1, index));
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    const destinations = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: projects.length - 1 };
    if (event.key in destinations) {
      event.preventDefault();
      goTo(destinations[event.key]);
    }
  };

  return (
    <div className="project-gallery" role="region" aria-roledescription="carrousel" aria-label="Mes projets">
      <header className="projects-header">
        <div>
          <h2 className="section-heading">Mes projets<span aria-hidden="true">.</span></h2>
        </div>
      </header>

      <div
        className="projects-track"
        ref={trackRef}
        tabIndex={0}
        aria-label="Projets : utilisez les flèches gauche et droite pour parcourir"
        onKeyDown={handleKeyDown}
        onScroll={() => {
          const track = trackRef.current;
          setActive(Math.round(track.scrollLeft / track.clientWidth));
        }}
      >
        {projects.map((project, index) => (
          <article
            className="project-slide"
            key={project.href}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${projects.length} : ${project.title}`}
            inert={index !== active ? true : undefined}
          >
            <div className="project-feature">
              <div className="project-feature__copy">
                <p className="project-category">{project.category || "Développement logiciel"}</p>
                <h3>{project.title}</h3>
                <p className="project-tagline">{project.tagline}</p>
                <p className="project-description">{project.description}</p>
                <ul className="project-stack" aria-label="Technologies utilisées">
                  {project.stack.map((tech) => <li key={tech}>{tech}</li>)}
                </ul>
                <a className="project-link" href={project.href} target="_blank" rel="noopener noreferrer">
                  {project.href.includes("play.google.com") ? "Découvrir sur Google Play" : "Explorer sur GitHub"}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              </div>
              <div className={`project-visual ${project.visual === "retro" ? "project-visual--retro" : ""}`}>
                {project.image ? (
                  <img src={project.image} alt={`Aperçu du projet ${project.title}`} loading="lazy" />
                ) : project.visual === "retro" ? (
                  <div className="retro-art" aria-label="Illustration du projet de rétro-ingénierie Mega Drive" role="img">
                    <span className="retro-art__platform">SEGA MEGA DRIVE / GENESIS</span>
                    <div className="retro-art__green"><span className="retro-art__flag" /><span className="retro-art__ball" /></div>
                    <strong>PEBBLE<br />BEACH</strong>
                    <span className="retro-art__subtitle">GOLF LINKS</span>
                    <div className="retro-art__footer"><span>68000 + Z80</span><span>BYTE-PERFECT</span></div>
                  </div>
                ) : (
                  <div className="project-type-art" aria-hidden="true">
                    <span>{project.category || "Développement logiciel"}</span>
                    <strong>{project.symbol || "{ }"}</strong>
                    <span>{project.stack.slice(0, 2).join(" / ")}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="projects-navigation">
        <div className="project-position" aria-live="polite" aria-atomic="true">
          <strong>{String(active + 1).padStart(2, "0")}</strong><span> / {String(projects.length).padStart(2, "0")}</span>
        </div>
        <div className="project-arrows">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Projet précédent">←</button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === projects.length - 1} aria-label="Projet suivant">→</button>
        </div>
      </footer>
    </div>
  );
}
