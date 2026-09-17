import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import InteractiveBackground from "./components/InteractiveBackground";
import SpotifyWidget from "./components/SpotifyWidget";
import './App.css';

function App() {
  const navLinks = [
    { href: "#accueil", label: "Accueil" },
    { href: "#about", label: "À propos" },
    { href: "#competences", label: "Compétences" },
    { href: "#experiences", label: "Expériences" },
    { href: "#projets", label: "Projets" },
    { href: "#contact", label: "Contact" },
    {
      label: "CV",
      children: [
        {
          href: "/ressources/cv-jeremy-perbost-fr.pdf",
          label: "CV Français",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          href: "/ressources/cv-jeremy-perbost-en.pdf",
          label: "CV Anglais",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ],
    },
  ];

  return (
    <Router>
      <div className="app-shell">
        <InteractiveBackground />
        <SpotifyWidget />
        <NavBar brand="Jérémy Perbost" links={navLinks} />

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>

        <footer className="footer" id="contact">
          <span>© 2026 Jérémy Perbost</span>
        </footer>
      </div>
    </Router>
  );
}

export default App;
