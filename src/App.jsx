import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Programming from "./pages/Programming";
import Photography from "./pages/Photography";
import Contact from "./pages/Contact";
import "./components/ComponentStyles.css";
import "./pages/PageStyles.css";

function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-text">
          <div className="eyebrow">Game Dev & Graphics</div>
          <h1 className="hero-title">Ewan MacKerracher</h1>
          <p className="hero-sub">
            Building responsive, accessible game experiences in <strong>Unreal Engine 5</strong>, and graphics work with <strong>SFML/SEG</strong>.
          </p>
          <div className="hero-cta">
            <a className="btn primary" href="#/programming">View Programming</a>
            <a className="btn ghost" href="#/contact">Get in touch</a>
          </div>
        </div>

        <div className="hero-card panel" aria-label="Featured project">
          <div className="media">
            <div className="media-meta">
              <div className="kicker">Featured</div>
              <div className="media-title">UE5 Photography Prototype</div>
              <div className="tagline">Screenshot capture • diegetic UI • tagging</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section container">
        <header className="section-head">
          <div className="section-eyebrow">About</div>
          <h2 className="section-title">Hi, I’m Ewan</h2>
          <p className="muted">
            I’m a 2nd-year Computer Games Development student at LJMU. I enjoy gameplay systems in UE5, graphics programming with SFML/SEG,
            and exploring accessibility patterns in games.
          </p>
        </header>

        <div className="grid two">
          <div className="panel">
            <h3 className="card-title">What I focus on</h3>
            <ul className="list muted">
              <li>UE5 (Blueprints & C++)</li>
              <li>Graphics & engine tinkering (SFML / SEG)</li>
              <li>Gameplay prototyping</li>
              <li>Accessibility (a11y) patterns</li>
            </ul>
          </div>
          <div className="panel">
            <h3 className="card-title">Currently</h3>
            <p className="muted">
              Placement at <strong>Cirdan</strong> as a Software Developer working with React & JavaScript.
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section section-alt">
        <div className="container">
          <header className="section-head">
            <div className="section-eyebrow">Highlights</div>
            <h2 className="section-title">Selected Work</h2>
          </header>

          <div className="grid three">
            <div className="card">
              <div className="thumb" />
              <h3 className="card-title">Photography Game (UE5)</h3>
              <p className="muted">First-person photography with save-to-disk screenshots.</p>
              <div className="chips">
                <span className="chip">UE5</span><span className="chip">C++</span><span className="chip">Gameplay</span>
              </div>
            </div>

            <div className="card">
              <div className="thumb" />
              <h3 className="card-title">SEG Graphics Demo</h3>
              <p className="muted">Tessellated spheres, particles, and custom pipeline.</p>
              <div className="chips">
                <span className="chip">Graphics</span><span className="chip">C++</span><span className="chip">SFML</span>
              </div>
            </div>

            <div className="card">
              <div className="thumb" />
              <h3 className="card-title">Vitual Assistant</h3>
              <p className="muted">A voice-activated virtual assistant running on a Raspberry Pi, designed for accessibility and everyday tasks.</p>
              <div className="chips">
                <span className="chip">Python</span><span className="chip">Accessibility</span><span className="chip">UX</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-row">
          <div>© {new Date().getFullYear()} Ewan MacKerracher</div>
          <div className="footer-links">
            <a href="https://github.com/ewanhmack">GitHub</a>
            <a href="https://www.linkedin.com/in/ewan-mack-h355/" rel="noopener">LinkedIn</a>
            <a href="mailto:ewanhmack@gmail.com">Email</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="page-offset">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programming" element={<Programming />} />
          <Route path="/photography" element={<Photography />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}
