import React from "react";

export default function AboutSection() {
  return (
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
          <ul className="list muted" style={{ listStyle: "none" }}>
            <li>UE5 (Blueprints & C++)</li>
            <li>Graphics & engine tinkering (SFML / SEG)</li>
            <li>Gameplay prototyping</li>
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
  );
}
