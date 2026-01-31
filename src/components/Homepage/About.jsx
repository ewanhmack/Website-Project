import React from "react";

function ChipRow({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="chips">
      {items.map((chip) => (
        <span key={chip} className="chip">
          {chip}
        </span>
      ))}
    </div>
  );
}

export default function AboutSection() {
  const toolkit = [
    "Unreal Engine 5 (C++ / Blueprints)",
    "SFML / SEG graphics programming",
    "React + TypeScript",
    "UI/UX polish + accessibility",
  ];

  const focusAreas = [
    "Gameplay prototypes with strong feedback loops",
    "Graphics + interaction systems",
    "Accessible patterns in games and tools",
  ];

  return (
    <section id="about" className="section container" aria-label="About">
      <header className="section-head">
        <div className="section-eyebrow">About</div>
        <h2 className="section-title">Hi, I’m Ewan</h2>
        <p className="muted">
          I’m a Computer Games Development student at LJMU. I enjoy building gameplay
          systems in UE5, graphics programming with SFML/SEG, and exploring accessibility
          patterns in games.
        </p>
      </header>

      <div className="grid two">
        <div className="panel">
          <h3 className="card-title">Toolkit</h3>
          <ul className="list muted" style={{ listStyle: "none", paddingLeft: 0 }}>
            {toolkit.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>

          <div style={{ marginTop: 14 }}>
            <ChipRow
              items={["UE5", "C++", "Blueprints", "React", "TypeScript", "SFML", "SEG"]}
            />
          </div>
        </div>

        <div className="panel">
          <h3 className="card-title">Right now</h3>
          <p className="muted">
            Placement at <strong>Cirdan</strong> as a Software Developer working with
            React and JavaScript.
          </p>

          <div style={{ marginTop: 12 }}>
            <h4 className="card-title" style={{ fontSize: "1rem", marginBottom: 8 }}>
              Current focus
            </h4>
            <ul className="list muted" style={{ listStyle: "none", paddingLeft: 0 }}>
              {focusAreas.map((focusArea) => (
                <li key={focusArea}>{focusArea}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
