import React from "react";

function HighlightCard({ imageSource, imageAlt, title, description, chips, href }) {
  return (
    <article className="card">
      <a className="card-link" href={href} aria-label={title}>
        <figure className="thumb">
          <img src={imageSource} alt={imageAlt} loading="lazy" decoding="async" />
        </figure>

        <div className="card-body">
          <h3 className="card-title">{title}</h3>
          <p className="muted">{description}</p>

          {chips && chips.length > 0 ? (
            <div className="chips">
              {chips.map((chip) => (
                <span key={chip} className="chip">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </a>
    </article>
  );
}

export default function Highlights() {
  const highlightItems = [
    {
      imageSource: "images/projects/photography/HighresScreenshot00007.png",
      imageAlt: "Photography Game — desert biome at dusk",
      title: "Photography Game (UE5)",
      description: "First-person photography with save-to-disk screenshots.",
      chips: ["UE5", "Blueprints", "Gameplay"],
      href: "#/projects/3d-photography-game",
    },
    {
      imageSource: "images/projects/music/Website%20Home.jpg",
      imageAlt: "Music website homepage featuring highlighted albums",
      title: "Music Website",
      description: "Browse albums, rate & review, and see rankings.",
      chips: ["PHP", "JavaScript", "MySQL"],
      href: "#/projects/music-website",
    },
    {
      imageSource: "images/projects/BaradDurApi.png",
      imageAlt: "Barad-Dur API Software",
      title: "Barad-Dur Eye Tracker",
      description:
        "Face tracking software built into a Lego Barad-Dur that rotates the Eye of Sauron to follow the user.",
      chips: ["Python", "API", "Raspberry Pi"],
      href: "#/projects/barad-du-r-eye-tracker",
    },
  ];

  return (
    <div className="grid three" aria-label="Selected work">
      {highlightItems.map((highlightItem) => (
        <HighlightCard key={highlightItem.title} {...highlightItem} />
      ))}
    </div>
  );
}
