import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";

const phrases = [
  "Bienvenue dans le portfolio de Jérémy Perbost.",
  "je suis né dans le C.",
  "je préfère le rock",
  "./let's_go",
];

const skills = [
  { src: "/ressources/icones_competences/javascript.webp", alt: "JavaScript" },
  { src: "/ressources/icones_competences/Typescript.png", alt: "TypeScript" },
  { src: "/ressources/icones_competences/python.png", alt: "Python" },
  { src: "/ressources/icones_competences/java.png", alt: "Java" },
  { src: "/ressources/icones_competences/C.png", alt: "C" },
  { src: "/ressources/icones_competences/Cpp.png", alt: "C++" },
  { src: "/ressources/icones_competences/R.png", alt: "R" },
  { src: "/ressources/icones_competences/Angular.png", alt: "Angular" },
  { src: "/ressources/icones_competences/html.png", alt: "HTML" },
  { src: "/ressources/icones_competences/CSS.png", alt: "CSS" },
  { src: "/ressources/icones_competences/linux.png", alt: "Linux" },
  { src: "/ressources/icones_competences/cisco.png", alt: "Cisco" },
  { src: "/ressources/icones_competences/prolog.svg", alt: "Prolog" },
  { src: "/ressources/icones_competences/Amazon_Web_Services_Logo.svg.png", alt: "AWS" },
  { src: "/ressources/icones_competences/chat_gpt.png", alt: "ChatGPT" },
  { src: "/ressources/icones_competences/firebase.png", alt: "Firebase" },
  { src: "/ressources/icones_competences/godot.svg", alt: "Godot" },
  { src: "/ressources/icones_competences/docker.png", alt: "Docker" },
  { src: "/ressources/icones_competences/Git.png", alt: "Git" },
];

const projects = [
  {
    title: "Carnet de santé virtuel",
    href: "https://github.com/AssilM/CarnetDeSante",
    tagline: "Dossier médical numérique full-stack (patients, médecins, admins).",
    stack: ["React 19 + Vite", "Tailwind", "Node/Express", "PostgreSQL", "JWT", "Socket.IO", "Multer"],
    description:
      "Gestion complète des rendez-vous, documents et messagerie temps réel avec rôles patients/médecins/admins et uploads sécurisés.",
  },
  {
    title: "Démineur en C",
    href: "https://github.com/JeremyPerbost/demineur",
    tagline: "Implémentation d'un démineur en C avec interface graphique simple.",
    stack: ["C", "Makefile", "SDL (affichage)"],
    description:
      "Reproduction du gameplay du Démineur avec gestion des mines, comptage adjacent et contrôles clavier/souris.",
    image: "/ressources/projets_image/demineur_C.png",
  },
  {
    title: "CY2PIE",
    href: "https://github.com/JeremyPerbost/gamejame-cytech",
    tagline: "Jeu Godot 2D multi toupies créé pour la game jam CYTech 2024/2025.",
    stack: ["Godot", "GDScript", "2D physics", "Boosts & power-ups", "Export Linux"],
    description:
      "Brawler multijoueur où chaque joueur contrôle une toupie : arène top-down, manches en 3 points, boosts (speed, durabilité, attaques, téléportation, invincibilité, pièges) et builds livrés pour Linux.",
  },
  {
    title: "Maison intelligente (Angular)",
    href: "https://github.com/JeremyPerbost/ing1devweb",
    tagline: "Site web domotique (dashboard) en Angular avec backend Firebase.",
    stack: ["Angular", "Firebase", "EmailJS", "UUID tokens", "jsPDF", "Chart.js"],
    description:
      "Application front Angular de maison connectée : gestion des pages via routing, services Firebase pour données, envoi d'emails (EmailJS), génération de PDF (jsPDF) et visualisations (Chart.js).",
  },
  {
    title: "CYnapse",
    href: "https://github.com/Abde2lah/ProjetJAVA",
    tagline: "Éditeur/solveur de labyrinthes en JavaFX avec algorithmes de graphes.",
    stack: ["Java", "JavaFX", "Algorithmes de graphes (BFS/DFS)", "Maven"],
    description:
      "Création, modification et résolution de labyrinthes avec interface JavaFX et plusieurs stratégies de parcours.",
  },
  {
    title: "SAF (Spring Actor Framework)",
    href: "https://github.com/JeremyPerbost/JEE-Groupe3",
    tagline: "Plateforme tournois multi-agents inspirée d'Akka sur microservices Spring.",
    stack: ["Java 21", "Spring Boot 3", "Spring Cloud Eureka", "RabbitMQ", "Resilience4j", "MySQL", "Docker Compose", "Thymeleaf"],
    description:
      "Framework d'acteurs distribué (User/Tournament services) avec communication RabbitMQ, découverte Eureka, résilience (circuit breaker, retry) et interface orchestrateur.",
  },
];

const sectionNav = [
  { id: "accueil", label: "Accueil" },
  { id: "about", label: "À propos" },
  { id: "competences", label: "Compétences" },
  { id: "projets", label: "Projets" },
  { id: "contact", label: "Contact" },
];

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState("");
  const [activeSection, setActiveSection] = useState("accueil");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let timer;
    const phrase = phrases[currentIndex];

    const type = (i = 0) => {
      if (i <= phrase.length) {
        setText(phrase.slice(0, i));
        timer = setTimeout(() => type(i + 1), 75);
      } else {
        timer = setTimeout(() => erase(phrase.length), 1300);
      }
    };

    const erase = (i) => {
      if (i >= 0) {
        setText(phrase.slice(0, i));
        timer = setTimeout(() => erase(i - 1), 30);
      } else {
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
      }
    };

    type();

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-theme-section]");
    const themeObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.intersectionRatio - b.intersectionRatio);

        const active = visible[visible.length - 1];
        if (active?.target?.dataset?.themeSection) {
          document.body.setAttribute("data-theme", active.target.dataset.themeSection);
          setActiveSection(active.target.id || active.target.dataset.themeSection);
        }
      },
      { threshold: 0.55 }
    );

    sections.forEach((section) => themeObserver.observe(section));

    if (sections[0]?.dataset?.themeSection) {
      document.body.setAttribute("data-theme", sections[0].dataset.themeSection);
      setActiveSection(sections[0].id || sections[0].dataset.themeSection);
    }

    return () => {
      themeObserver.disconnect();
      document.body.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("[data-theme-section]"));
    sections.forEach((section) => {
      const id = section.id || section.dataset.themeSection;
      const isActive = id === activeSection;
      section.classList.toggle("section--focused", isActive);
      section.classList.toggle("section--muted", !isActive);
    });
    document.body.setAttribute("data-active-section", activeSection);
    return () => document.body.removeAttribute("data-active-section");
  }, [activeSection]);

    useEffect(() => {
      const sections = Array.from(document.querySelectorAll("[data-theme-section]"));
      const scroller = document.querySelector(".content");
      if (!sections.length || !scroller) return undefined;

      let locked = false;

      const handleWheel = (event) => {
        if (locked) return;
        const delta = event.deltaY;
        if (Math.abs(delta) < 24) return;

        const current = sections.findIndex(
          (section) => (section.id || section.dataset.themeSection) === activeSection
        );

        if (delta > 0 && current < sections.length - 1) {
          event.preventDefault();
          locked = true;
          sections[current + 1].scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            locked = false;
          }, 850);
        } else if (delta < 0 && current > 0) {
          event.preventDefault();
          locked = true;
          sections[current - 1].scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            locked = false;
          }, 850);
        }
      };

      scroller.addEventListener("wheel", handleWheel, { passive: false });
      return () => scroller.removeEventListener("wheel", handleWheel, { passive: false });
    }, [activeSection]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 140, scale: 0.93, rotateX: -2.5 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 210,
        damping: 20,
        mass: 0.9,
        bounce: 0.35,
        delay: 0.07 * i,
      },
    }),
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const payload = {
      user_name: formData.name.trim().slice(0, 80),
      user_email: formData.email.trim().slice(0, 120),
      message: formData.message.trim().slice(0, 1000),
    };

    if (!payload.user_name || !payload.user_email || !payload.message) return;

    setSending(true);
    try {
      await emailjs.send("service_70wrt0p", "template_dzzwdeo", payload, "OmCmTfBC2x21RmMh6");
      alert("Merci ! Votre message a bien été envoyé.");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue. Réessayez plus tard.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="section-rail" aria-label="Navigation des sections">
        {sectionNav.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`rail-dot ${activeSection === item.id ? "rail-dot--active" : ""}`}
            aria-label={item.label}
          >
            <span className="rail-dot__label">{item.label}</span>
          </a>
        ))}
      </div>

      <motion.section
        id="accueil"
        className="section section-hero"
        data-theme-section="hero"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionVariants}
        custom={0}
      >
        <div className="section-content hero">
          <p className="hero-typed">
            {text}
            <span className="hero-caret" aria-hidden="true" />
          </p>
        </div>
      </motion.section>

      <motion.section
        id="about"
        className="section section-about"
        data-theme-section="about"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionVariants}
        custom={1}
      >
        <div className="section-content about">
          <div className="about-media">
            <img src="/ressources/photo.jpg" alt="Jérémy Perbost" loading="lazy" />
          </div>
          <div className="about-text">
            <h2 className="section-heading">Qui suis-je ?</h2>
            <p className="section-body">
              Je me présentes : Jérémy perbost, étudiant en deuxième année d'école d'ingénieur informatique à CY-tech. Passioné par l'informatique et la cybersécurité
            </p>
            <div className="about-badges">
              <img src="/ressources/cytech-logo.png" alt="CY Tech" loading="lazy" />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="competences"
        className="section section-skills"
        data-theme-section="skills"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionVariants}
        custom={2}
      >
        <div className="section-content skills">
          <div className="skills-header">
            <h2 className="section-heading">Compétences</h2>
            <p className="section-body">
              Je suis organisé et rigoureux dans mon travail, habitué à collaborer efficacement en équipe. J’aime apprendre de nouvelles technologies et relever des défis techniques. Toujours force de proposition, je cherche à créer des solutions propres et efficaces.
            </p>
          </div>

          <div className="skills-marquee" aria-label="Logos de compétences en défilement">
            <div className="skills-track">
              {[...skills, ...skills].map((logo, index) => (
                <div className="skill-chip" key={`${logo.alt}-${index}`}>
                  <img src={logo.src} alt={logo.alt} loading="lazy" />
                  <span>{logo.alt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="projets"
        className="section section-projects"
        data-theme-section="projects"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionVariants}
        custom={3}
      >
        <div className="section-content projects">
          <div className="projects-panel">
            <div className="projects-header">
              <h2 className="section-heading">Mes projets</h2>
              <p className="section-body">Vous pouvez découvrir une sélection de mes projets récents ci-dessous.</p>
            </div>

            <div className="projects-grid" role="list">
              {projects.map((project) => (
                <a
                  key={project.href}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="project-card"
                  role="listitem"
                >
                  <div className="project-card__glass" />
                  <div className="project-card__content">
                    <div className="project-card__header">
                      <h3>{project.title}</h3>
                      <span className="project-card__tagline">{project.tagline}</span>
                    </div>
                    <p className="project-card__desc">{project.description}</p>
                    <div className="project-card__stack">
                      {project.stack.map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                    {project.image && (
                      <div className="project-card__thumb" aria-hidden="true">
                        <img src={project.image} alt="" loading="lazy" />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="contact"
        className="section section-contact"
        data-theme-section="contact"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={sectionVariants}
        custom={4}
      >
        <div className="section-content contact">
          <div className="contact-header">
            <h2 className="section-heading">Me contacter</h2>
            <p className="section-body">
              Écrivez-moi pour une opportunité, une collaboration ou un retour sur mes projets.
            </p>
          </div>

          <div className="contact-grid">
            <form className="contact-form" onSubmit={handleContactSubmit} autoComplete="on" noValidate>
              <label className="contact-field">
                <span>Nom</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleContactChange}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Votre nom"
                />
              </label>
              <label className="contact-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleContactChange}
                  required
                  maxLength={120}
                  placeholder="vous@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </label>
              <label className="contact-field">
                <span>Message</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleContactChange}
                  required
                  minLength={10}
                  maxLength={1000}
                  placeholder="Votre message"
                  rows={5}
                />
              </label>
              <button type="submit" className="contact-submit" aria-label="Envoyer">
                <span className="material-symbols-outlined" aria-hidden="true">send</span>
              </button>
            </form>

            <div className="contact-info">
              <div>
                <span className="contact-label">Email</span>
                <a href="mailto:Jeremy1perbost@gmail.com">Jeremy1perbost@gmail.com</a>
              </div>
              <div>
                <span className="contact-label">Téléphone</span>
                <a href="tel:+33636100731">+33 06 36 10 07 31</a>
              </div>
              <div className="contact-links">
                <span className="contact-label">Réseaux</span>
                <a href="https://www.linkedin.com/in/jeremy-perbost-54ba96192/" target="_blank" rel="noreferrer" className="contact-link">
                  <img src="/ressources/contact_images/LinkedIn_icon.svg.png" alt="LinkedIn" loading="lazy" />
                  LinkedIn
                </a>
                <a href="https://github.com/JeremyPerbost" target="_blank" rel="noreferrer" className="contact-link">
                  <img src="/ressources/contact_images/github_icone.svg" alt="GitHub" loading="lazy" />
                  GitHub
                </a>
                <a href="https://jeremy-perbost.itch.io/" target="_blank" rel="noreferrer" className="contact-link">
                  <img src="/ressources/contact_images/itchio_icone.webp" alt="itch.io" loading="lazy" />
                  itch.io
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}

export default Home;
