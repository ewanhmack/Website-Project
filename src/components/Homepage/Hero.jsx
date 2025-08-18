import React from "react";

export default function Hero() {
  return (
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
  );
}
