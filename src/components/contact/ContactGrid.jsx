import React from "react";
import ContactCard from "./ContactCard";

const MailIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"/>
  </svg>
);

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5Z"/><path fill="currentColor" d="M3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-4.9c0-1.17-.02-2.67-1.63-2.67-1.62 0-1.87 1.27-1.87 2.58V21H10z"/>
  </svg>
);

const InstagramIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm6-1.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0Z"/>
  </svg>
);

export default function ContactGrid() {
  return (
    <section className="contact-grid" aria-label="Contact options">
      <ContactCard
        href="mailto:ewanhmack@gmail.com"
        label="Send me an email"
        title="Email"
        subtitle="ewanhmack@gmail.com"
        icon={MailIcon}
      />
      <ContactCard
        href="https://www.linkedin.com/in/ewan-mack-h355/"
        label="Open my LinkedIn"
        title="LinkedIn"
        subtitle="Ewan MacKerracher"
        icon={LinkedInIcon}
        external
      />
      <ContactCard
        href="https://www.instagram.com/ewanhmack/"
        label="Open my Instagram"
        title="Instagram"
        subtitle="@ewanhmack"
        icon={InstagramIcon}
        external
      />
    </section>
  );
}
