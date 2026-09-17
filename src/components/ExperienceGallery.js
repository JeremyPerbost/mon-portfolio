import React, { useRef, useState } from "react";

export default function ExperienceGallery({ experiences }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const goTo = (index) => {
    const track = trackRef.current;
    const next = Math.max(0, Math.min(experiences.length - 1, index));
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    const destinations = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: experiences.length - 1,
    };

    if (event.key in destinations) {
      event.preventDefault();
      goTo(destinations[event.key]);
    }
  };

  return (
    <div className="experience-gallery" role="region" aria-roledescription="carrousel" aria-label="Expériences professionnelles">
      <header className="experience-header">
        <h2 className="section-heading">Expériences professionnelles<span aria-hidden="true">.</span></h2>
      </header>

      <div
        className="experience-track"
        ref={trackRef}
        tabIndex={0}
        aria-label="Expériences : utilisez les flèches gauche et droite pour parcourir"
        onKeyDown={handleKeyDown}
        onScroll={() => {
          const track = trackRef.current;
          if (track?.clientWidth) setActive(Math.round(track.scrollLeft / track.clientWidth));
        }}
      >
        {experiences.map((experience, index) => (
          <article
            className="experience-slide"
            key={experience.title}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${experiences.length} : ${experience.title}`}
            inert={index !== active ? true : undefined}
          >
            <div className="experience-card">
              <div className="experience-summary">
                <p className="experience-kicker">Stage international</p>
                <h3>{experience.title}</h3>
                <p className="experience-date">{experience.date}</p>
                {experience.logo && <img src={experience.logo} alt={experience.logoAlt} loading="lazy" />}
              </div>

              <div className="experience-details">
                <div>
                  <p className="experience-label">Superviseur</p>
                  <a href={experience.supervisorHref} target={experience.supervisorHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {experience.supervisorName} <span aria-hidden="true">—</span> {experience.supervisorLabel}
                  </a>
                </div>
                <div>
                  <p className="experience-label">Mission</p>
                  <p className="experience-description">{experience.project}</p>
                </div>
                <ul className="experience-tools" aria-label="Compétences mobilisées">
                  {experience.tools.map((tool) => <li key={tool}>{tool}</li>)}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="experience-navigation">
        <div className="experience-position" aria-live="polite" aria-atomic="true">
          <strong>{String(active + 1).padStart(2, "0")}</strong><span> / {String(experiences.length).padStart(2, "0")}</span>
        </div>
        <div className="experience-arrows">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Expérience précédente">←</button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === experiences.length - 1} aria-label="Expérience suivante">→</button>
        </div>
      </footer>
    </div>
  );
}
