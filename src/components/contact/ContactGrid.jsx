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

const GithubIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z"/>
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
      <ContactCard
        href="https://github.com/ewanhmack"
        label="Open my GitHub"
        title="GitHub"
        subtitle="@ewanhmack"
        icon={GithubIcon}
        external
      />
    </section>
  );
}
