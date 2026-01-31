import React from "react";
import "./AboutMe.css";
import archeryIcon from "../assets/archery.svg";
import cameraIcon from "../assets/camera.svg";
import roboticsIcon from "../assets/robotics.svg";
import headphoneIcon from "../assets/headphones.svg";

function ChipRow({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="aboutme-chips">
      {items.map((item) => (
        <span key={item} className="aboutme-chip">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function AboutMe() {
  const focusCards = [
    {
      title: "What I build",
      body: "Interactive projects across game dev and web. I focus on solid feedback loops, clean UI, and systems that feel responsive.",
    },
    {
      title: "Current interests",
      body: "UE5 gameplay systems, photography tooling, and accessibility patterns in games and interfaces.",
    },
    {
      title: "What I’m after",
      body: "A role where I can ship polished features, collaborate closely, and keep levelling up across engineering and UX.",
    },
  ];

  const toolkit = [
    "Unreal Engine 5 (C++ / Blueprints)",
    "React + TypeScript",
    "UI/UX polish and accessibility",
    "SFML / graphics programming",
    "APIs and small tooling scripts",
  ];

  const tags = [
    "UE5",
    "C++",
    "Blueprints",
    "React",
    "TypeScript",
    "SFML",
    "Python",
  ];

  return (
    <div className="aboutme">
      <section className="aboutme-section">
        <div className="aboutme-container">
          <header className="aboutme-head">
            <div className="aboutme-eyebrow">About me</div>
            <h1 className="aboutme-title">Hi, I’m Ewan</h1>
            <p className="aboutme-sub">
              I’m a Computer Games Development student at LJMU. I enjoy building
              gameplay systems in Unreal Engine 5, front-end tooling in React,
              and projects that blend creativity with engineering.
            </p>
          </header>

          <div className="aboutme-hero-grid">
            <div className="aboutme-panel">
              <h2 className="aboutme-panel-title">Quick summary</h2>

              <div className="aboutme-stats">
                <div className="aboutme-stat">
                  <div className="aboutme-stat-value">LJMU</div>
                  <div className="aboutme-stat-label">Games Dev student</div>
                </div>
                <div className="aboutme-stat">
                  <div className="aboutme-stat-value">UE5</div>
                  <div className="aboutme-stat-label">Gameplay systems</div>
                </div>
                <div className="aboutme-stat">
                  <div className="aboutme-stat-value">React</div>
                  <div className="aboutme-stat-label">UI + tooling</div>
                </div>
              </div>

              <div className="aboutme-divider" />

              <h3 className="aboutme-panel-subtitle">Toolkit</h3>
              <ul className="aboutme-list">
                {toolkit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <ChipRow items={tags} />
            </div>

            <div className="aboutme-panel">
              <div className="aboutme-photo-frame" aria-hidden="true">
                <img src="./headshot.webp" alt="Me" />
              </div>
              <div className="aboutme-photo-caption">
                Replace this with a headshot, or keep a favourite photo as a
                vibe piece.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutme-section">
        <div className="aboutme-container">
          <header className="aboutme-head">
            <div className="aboutme-eyebrow">Outside of coding</div>
            <h2 className="aboutme-title">Hobbies</h2>
            <p className="aboutme-sub">
              A few things I enjoy when I’m not building games or tools.
            </p>
          </header>

          <div className="aboutme-hobbies-grid">
            <div className="aboutme-hobby-card">
              <div className="aboutme-hobby-icon">
                <img src={archeryIcon} alt="Archery" />
              </div>
              <div>
                <div className="aboutme-hobby-title">Archery</div>
                <div className="aboutme-hobby-body">
                  I shoot recurve and barebow at my university club, which I am
                  currently vice president of.
                </div>
              </div>
            </div>

            <div className="aboutme-hobby-card">
              <div className="aboutme-hobby-icon">
                <img src={cameraIcon} alt="Camera" />
              </div>
              <div>
                <div className="aboutme-hobby-title">Photography</div>
                <div className="aboutme-hobby-body">
                  Landscape and wildlife photography. I enjoy capturing small
                  details and experimenting with light and composition.
                </div>
              </div>
            </div>
            <div className="aboutme-hobby-card">
              <div className="aboutme-hobby-icon">
                <img src={roboticsIcon} alt="Robotics" />
              </div>
              <div>
                <div className="aboutme-hobby-title">Robotics</div>
                <div className="aboutme-hobby-body">
                  I enjoy building and programming small robots, often using
                  Arduino and Raspberry Pi platforms. For example the Barad-Dur
                  project
                </div>
              </div>
            </div>
            <div className="aboutme-hobby-card">
              <div className="aboutme-hobby-icon">
                <img src={headphoneIcon} alt="Headphones" />
              </div>
              <div>
                <div className="aboutme-hobby-title">Movies and Music</div>
                <div className="aboutme-hobby-body">
                  I am a big fan of sci-fi and fantasy films, as well as
                  soundtracks and scores.
                  <br />
                  Some of my favourites include Interstellar, The Lord of the
                  Rings, and Blade Runner 2049.
                  <br />I also collect vinyl records and mostly listen to 90's
                  music.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutme-section aboutme-section-alt">
        <div className="aboutme-container">
          <header className="aboutme-head">
            <div className="aboutme-eyebrow">Focus</div>
            <h2 className="aboutme-title">What you’ll see in my work</h2>
            <p className="aboutme-sub">
              Themes I keep coming back to across projects.
            </p>
          </header>

          <div className="aboutme-grid">
            {focusCards.map((card) => (
              <div key={card.title} className="aboutme-card">
                <h3 className="aboutme-card-title">{card.title}</h3>
                <p className="aboutme-card-body">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="aboutme-cta">
            <div>
              <div className="aboutme-cta-title">Want to see projects?</div>
              <div className="aboutme-cta-sub">
                Jump straight into the work and browse the full list.
              </div>
            </div>
            <div className="aboutme-cta-actions">
              <a className="btn" href="#/projects">
                View projects
              </a>
              <a className="btn" href="#/contact">
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
