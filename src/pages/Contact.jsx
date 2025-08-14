import React, { useState } from "react";
import "./PageStyles.css";

export default function Contact() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  function handleMailto(e) {
    e.preventDefault();
    const to = "ewanhmack@gmail.com";
    const subject = encodeURIComponent(`Portfolio contact from ${name || "visitor"}`);
    const body = encodeURIComponent(msg);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="page-container">
      <header className="contact-hero">
        <h2>Contact</h2>
        <p className="muted">
          Prefer email, but I’m also on LinkedIn and Instagram. I’ll get back to you as soon as I can.
        </p>
      </header>

      {/* Cards */}
      <section className="contact-grid" aria-label="Contact options">
        <a className="contact-card" href="mailto:ewanhmack@gmail.com" aria-label="Send me an email">
          <div className="contact-icon" aria-hidden="true">
            {/* Mail icon (inline SVG) */}
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"/></svg>
          </div>
          <div className="contact-body">
            <h3>Email</h3>
            <p className="muted">ewanhmack@gmail.com</p>
          </div>
          <span className="contact-arrow" aria-hidden="true">→</span>
        </a>

        <a className="contact-card" href="https://www.linkedin.com/in/ewan-mack-h355/" target="_blank" rel="noopener noreferrer" aria-label="Open my LinkedIn">
          <div className="contact-icon" aria-hidden="true">
            {/* LinkedIn */}
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5Z"/><path fill="currentColor" d="M3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-4.9c0-1.17-.02-2.67-1.63-2.67-1.62 0-1.87 1.27-1.87 2.58V21H10z"/></svg>
          </div>
          <div className="contact-body">
            <h3>LinkedIn</h3>
            <p className="muted">Ewan MacKerracher</p>
          </div>
          <span className="contact-arrow" aria-hidden="true">→</span>
        </a>

        <a className="contact-card" href="https://www.instagram.com/ewanhmack/" target="_blank" rel="noopener noreferrer" aria-label="Open my Instagram">
          <div className="contact-icon" aria-hidden="true">
            {/* Instagram */}
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm6-1.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0Z"/></svg>
          </div>
          <div className="contact-body">
            <h3>Instagram</h3>
            <p className="muted">@ewanhmack</p>
          </div>
          <span className="contact-arrow" aria-hidden="true">→</span>
        </a>
      </section>

      {/* Quick message (mailto) */}
      <section className="contact-form panel" aria-label="Quick message">
        <h3 className="card-title">Quick message</h3>
        <form onSubmit={handleMailto} className="contact-form-grid">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field field-full">
            <span>Message</span>
            <textarea
              placeholder="What would you like to chat about?"
              rows={5}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
          </label>

          <div className="actions">
            <button className="btn primary" type="submit">Send email</button>
            <a className="btn ghost" href="mailto:ewanhmack@gmail.com">Open mail app</a>
          </div>
        </form>
      </section>

      {/* CV panel */}
      <section className="cv-panel panel">
        <div className="cv-copy">
          <h3 className="card-title">CV</h3>
          <p className="muted">Happy to share a copy of my CV on request.</p>
        </div>
        <a className="btn" href="mailto:ewanhmack@gmail.com?subject=CV%20request">Request CV</a>
      </section>
    </div>
  );
}
