import React from "react";
import ContactCard from "./ContactCard";
import Reveal from "../Reveal";
import MailIcon from "../../assets/mail.svg";
import LinkedInIcon from "../../assets/linkedin.svg";
import InstagramIcon from "../../assets/instagram.svg";
import GithubIcon from "../../assets/github.svg";

const CARDS = [
  {
    href: "mailto:ewanhmack@gmail.com",
    label: "Send me an email",
    title: "Email",
    subtitle: "ewanhmack@gmail.com",
    icon: MailIcon,
  },
  {
    href: "https://www.linkedin.com/in/ewan-mack-h355/",
    label: "Open my LinkedIn",
    title: "LinkedIn",
    subtitle: "Ewan MacKerracher",
    icon: LinkedInIcon,
    external: true,
  },
  {
    href: "https://www.instagram.com/ewanhmack/",
    label: "Open my Instagram",
    title: "Instagram",
    subtitle: "@ewanhmack",
    icon: InstagramIcon,
    external: true,
  },
  {
    href: "https://github.com/ewanhmack",
    label: "Open my GitHub",
    title: "GitHub",
    subtitle: "@ewanhmack",
    icon: GithubIcon,
    external: true,
  },
];

export default function ContactGrid() {
  return (
    <section className="contact-grid" aria-label="Contact options">
      {CARDS.map((card, index) => (
        <Reveal as="div" key={card.title} delay={index * 60}>
          <ContactCard {...card} />
        </Reveal>
      ))}
    </section>
  );
}
