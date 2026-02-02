import React from "react";

export default function Hero() {
  return (
    <section className="hero container" aria-label="Intro">
      <div className="hero-text">
        <div className="eyebrow">Game Dev • Graphics • Web</div>

        <h1 className="hero-title">Ewan MacKerracher</h1>

        <p className="hero-sub">
          I build responsive, accessible interactive experiences — mainly in{" "}
          <strong>Unreal Engine 5</strong> and graphics work with{" "}
          <strong>SFML/SEG</strong>, plus front-end tooling in{" "}
          <strong>React</strong>.
        </p>

        <div className="hero-cta">
          <a className="btn primary" href="#/projects/barad-du-r-eye-tracker">
            Selected work
          </a>
          <a className="btn primary" href="#/about-me">
            About me
          </a>
          <a className="btn primary" href="#/contact">
            Contact
          </a>
        </div>

        <div className="hero-stats" aria-label="Quick facts">
          <div className="stat">
            <div className="stat-value">LJMU</div>
            <div className="stat-label">Games Dev student</div>
          </div>
          <div className="stat">
            <div className="stat-value">UE5</div>
            <div className="stat-label">Gameplay systems</div>
          </div>
          <div className="stat">
            <div className="stat-value">React</div>
            <div className="stat-label">UI + tooling</div>
          </div>
        </div>
      </div>

      <aside className="hero-card panel" aria-label="Featured project">
        <div className="hero-feature">
          <div className="hero-feature-top">
            <div className="kicker">Featured</div>
            <div className="media-title">UE5 Photography Prototype</div>
            <div className="tagline">Screenshot capture • diegetic UI • tagging</div>
          </div>

          <div className="hero-feature-media" aria-hidden="true">
            <img
              src="images/projects/photography/HighresScreenshot00007.png"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="hero-feature-actions">
            <a className="btn primary" href="#/programming">
              View projects
            </a>
            <a className="btn primary" href="#/photography">
              Photography
            </a>
          </div>
        </div>
      </aside>
    </section>
  );
}
