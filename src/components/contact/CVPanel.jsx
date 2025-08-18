import React from "react";

export default function CVPanel() {
  return (
    <section className="cv-panel panel">
      <div className="cv-copy">
        <h3 className="card-title">CV</h3>
        <p className="muted">Happy to share a copy of my CV on request.</p>
      </div>
      <a className="btn" href="mailto:ewanhmack@gmail.com?subject=CV%20request">
        Request CV
      </a>
    </section>
  );
}
