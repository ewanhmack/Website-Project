import React from "react";
import ContactGrid from "../components/contact/ContactGrid";
import QuickMessageForm from "../components/contact/QuickMessageForm";
import CVPanel from "../components/contact/CVPanel";
import Reveal from "../components/Reveal";
import "../components/css/contact.css";
import "../components/css/PageStyles.css";

export default function Contact() {
  return (
    <div className="page-container contact">
      <header className="contact-hero">
        <h2>Contact</h2>
        <p className="muted">
          Prefer email, but I’m also on LinkedIn and Instagram. I’ll get back to you as soon as I can.
        </p>
      </header>

      <ContactGrid />

      <div className="contact-main-grid">
        <Reveal as="div">
          <QuickMessageForm />
        </Reveal>
        <Reveal as="div" delay={80}>
          <CVPanel />
        </Reveal>
      </div>
    </div>
  );
}
