import React from "react";
import Reveal from "../components/Reveal";
import "../components/css/AboutMe.css";
import archeryIcon from "../assets/archery.svg";
import cameraIcon from "../assets/camera.svg";
import roboticsIcon from "../assets/robotics.svg";
import headphoneIcon from "../assets/headphones.svg";

const STATS = [
  { value: "LJMU", label: "Games Dev student" },
  { value: "UE5", label: "Gameplay systems" },
  { value: "React", label: "UI + tooling" },
];

const TOOLKIT = ["UE5", "C++", "Blueprints", "React", "TypeScript", "SFML", "Python"];

const HOBBIES = [
  {
    icon: archeryIcon,
    title: "Archery",
    body: "I shoot recurve and barebow at my university club, which I am currently vice president of.",
  },
  {
    icon: cameraIcon,
    title: "Photography",
    body: "Landscape and wildlife photography. I enjoy capturing small details and experimenting with light and composition.",
  },
  {
    icon: roboticsIcon,
    title: "Robotics",
    body: "I enjoy building and programming small robots, often using Arduino and Raspberry Pi platforms. For example the Barad-Dûr project.",
  },
  {
    icon: headphoneIcon,
    title: "Movies and Music",
    body: "I'm a big fan of sci-fi and fantasy films, as well as soundtracks and scores — Interstellar, The Lord of the Rings, and Blade Runner 2049 are up there. I also collect vinyl and mostly listen to 90's music.",
  },
];

const FOCUS_CARDS = [
  {
    title: "What I build",
    body: "Interactive projects across game dev and web. I focus on solid feedback loops, clean UI, and systems that feel responsive.",
  },
  {
    title: "Current interests",
    body: "UE5 gameplay systems, photography tooling, and accessibility patterns in games and interfaces.",
  },
  {
    title: "What I'm after",
    body: "A role where I can ship polished features, collaborate closely, and keep levelling up across engineering and UX.",
  },
];

export default function AboutMe() {
  return (
    <div className="aboutme">
      <section className="aboutme-section aboutme-hero">
        <div className="aboutme-container">
          <div className="aboutme-hero-grid">
            <Reveal as="div" className="aboutme-hero-text">
              <div className="aboutme-eyebrow">About me</div>
              <h1 className="aboutme-title">Hi, I&rsquo;m Ewan</h1>
              <p className="aboutme-sub">
                I&rsquo;m a Computer Games Development student at LJMU. I enjoy building
                gameplay systems in Unreal Engine 5, front-end tooling in React,
                and projects that blend creativity with engineering.
              </p>

              <div className="aboutme-chips">
                {TOOLKIT.map((item) => (
                  <span key={item} className="aboutme-chip">
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal as="div" className="aboutme-photo-wrap" delay={120}>
              <div className="aboutme-photo-frame">
                <img src="./headshot.webp" alt="Ewan MacKerracher" />
              </div>
              <div className="aboutme-photo-badge">
                Placement at Cirdan &mdash; Software Developer
              </div>
            </Reveal>
          </div>

          <div className="aboutme-stats">
            {STATS.map((stat, index) => (
              <Reveal
                as="div"
                key={stat.value}
                className="aboutme-stat"
                delay={index * 80}
              >
                <div className="aboutme-stat-value">{stat.value}</div>
                <div className="aboutme-stat-label">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutme-section">
        <div className="aboutme-container">
          <Reveal as="header" className="aboutme-head">
            <div className="aboutme-eyebrow">Outside of coding</div>
            <h2 className="aboutme-title">Hobbies</h2>
            <p className="aboutme-sub">
              A few things I enjoy when I&rsquo;m not building games or tools.
            </p>
          </Reveal>

          <div className="aboutme-hobbies-list">
            {HOBBIES.map((hobby, index) => (
              <Reveal
                as="div"
                key={hobby.title}
                className={`aboutme-hobby-row ${index % 2 === 1 ? "is-reversed" : ""}`}
                delay={index * 60}
              >
                <div className="aboutme-hobby-icon">
                  <img src={hobby.icon} alt="" aria-hidden="true" />
                </div>
                <div className="aboutme-hobby-copy">
                  <div className="aboutme-hobby-title">{hobby.title}</div>
                  <div className="aboutme-hobby-body">{hobby.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutme-section aboutme-section-alt">
        <div className="aboutme-container">
          <Reveal as="header" className="aboutme-head">
            <div className="aboutme-eyebrow">Focus</div>
            <h2 className="aboutme-title">What you&rsquo;ll see in my work</h2>
            <p className="aboutme-sub">
              Themes I keep coming back to across projects.
            </p>
          </Reveal>

          <div className="aboutme-grid">
            {FOCUS_CARDS.map((card, index) => (
              <Reveal
                as="div"
                key={card.title}
                className="aboutme-card"
                delay={index * 80}
              >
                <h3 className="aboutme-card-title">{card.title}</h3>
                <p className="aboutme-card-body">{card.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal as="div" className="aboutme-cta">
            <div>
              <div className="aboutme-cta-title">Want to see projects?</div>
              <div className="aboutme-cta-sub">
                Jump straight into the work and browse the full list.
              </div>
            </div>
            <div className="aboutme-cta-actions">
              <a className="btn primary" href="#/projects">
                View projects
              </a>
              <a className="btn" href="#/contact">
                Contact
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
