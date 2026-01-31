import React from "react";
import Hero from "../components/Homepage/Hero";
import AboutSection from "../components/Homepage/About";
import Highlights from "../components/Homepage/Highlights";
import SiteFooter from "../components/SiteFooter";

export default function Home() {
  return (
    <div className="home">
      <Hero />

      <AboutSection />

      <section id="selected-work" className="section section-alt" aria-label="Selected work">
        <div className="container">
          <header className="section-head">
            <div className="section-eyebrow">Highlights</div>
            <h2 className="section-title">Selected Work</h2>
            <p className="muted">
              A few projects that best represent what I like building.
            </p>
          </header>

          <Highlights />

          <div className="home-cta panel" style={{ marginTop: 24 }}>
            <div>
              <h3 className="card-title">Want the full list?</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Browse all projects, photography, and experiments in one place.
              </p>
            </div>
            <div className="hero-cta" style={{ justifyContent: "flex-end" }}>
              <a className="btn primary" href="#/photography">
                View photography
              </a>
              <a className="btn primary" href="#/programming">
                View all projects
              </a>
              <a className="btn primary" href="#/contact">
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
