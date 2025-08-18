import React from "react";

export default function ContactCard({ href, label, title, subtitle, icon, external = false }) {
  const props = external
    ? { href, target: "_blank", rel: "noopener noreferrer", "aria-label": label }
    : { href, "aria-label": label };

  return (
    <a className="contact-card" {...props}>
      <div className="contact-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="contact-body">
        <h3>{title}</h3>
        <p className="muted">{subtitle}</p>
      </div>
      <span className="contact-arrow" aria-hidden="true">→</span>
    </a>
  );
}
