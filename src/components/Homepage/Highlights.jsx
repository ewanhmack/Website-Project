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
      imgSrc: "images/projects/BaradDurApi.png",
      imgAlt: "Barad Dur API Software",
      title: "Barad-Dur Eye Tracker",
      desc: "A face tracking software built into a Lego Barad-Dur which rotates the eye of Sauron to follow the user.",
      chips: ["Python", "API", "Raspberry Pi"],
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
