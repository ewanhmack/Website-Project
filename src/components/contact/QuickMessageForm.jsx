import React, { useState } from "react";

export default function QuickMessageForm() {
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
  );
}
