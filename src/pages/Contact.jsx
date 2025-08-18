import React from "react";
import ContactGrid from "../components/contact/ContactGrid";
import QuickMessageForm from "../components/contact/QuickMessageForm";
import CVPanel from "../components/contact/CVPanel";
import "./contact.css";      // add if you created a separate file
import "./PageStyles.css";   // keep your base styles

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
      <QuickMessageForm />
      <CVPanel />
    </div>
  );
}
