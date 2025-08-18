import React from "react";

/** Reusable card */
function HighlightCard({ imgSrc, imgAlt, title, desc, chips = [] }) {
  return (
    <div className="card">
      <figure className="thumb">
        <img src={imgSrc} alt={imgAlt} loading="lazy" decoding="async" />
      </figure>
      <h3 className="card-title">{title}</h3>
      <p className="muted">{desc}</p>
      {!!chips.length && (
        <div className="chips">
          {chips.map((c, i) => (
            <span key={i} className="chip">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Highlights() {
  const items = [
    {
      imgSrc: "images/projects/photography/HighresScreenshot00007.png",
      imgAlt: "Photography Game — desert biome at dusk",
      title: "Photography Game (UE5)",
      desc: "First-person photography with save-to-disk screenshots.",
      chips: ["UE5", "Blueprints", "Gameplay"],
    },
    {
      imgSrc: "images/projects/music/Website%20Home.jpg",
      imgAlt: "Music website homepage featuring highlighted albums",
      title: "Music Website",
      desc: "Browse albums, rate & review, and see rankings.",
      chips: ["PHP", "JavaScript", "MySQL"],
    },
    {
      imgSrc: "images/projects/Virtual-Assistant.png",
      imgAlt: "Raspberry Pi virtual assistant",
      title: "Virtual Assistant",
      desc: "A voice-activated assistant running on a Raspberry Pi, designed for accessibility and everyday tasks.",
      chips: ["Python", "Accessibility", "UX"],
    },
  ];

  return (
    <div className="grid three">
      {items.map((item) => (
        <HighlightCard key={item.title} {...item} />
      ))}
    </div>
  );
}
