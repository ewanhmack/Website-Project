import React from "react";
import Hero from "../components/Homepage/Hero";
import AboutSection from "../components/Homepage/About";
import Highlights from "../components/Homepage/Highlights";
import SiteFooter from "../components/SiteFooter";

export default function Home() {
  return (
    <div className="home">
      <Hero />

      <AboutSection />

      <section id="selected-work" className="section section-alt">
        <div className="container">
          <header className="section-head">
            <div className="section-eyebrow">Highlights</div>
            <h2 className="section-title">Selected Work</h2>
          </header>
          <Highlights />
        </div>
      </section>
    </div>
  );
}
