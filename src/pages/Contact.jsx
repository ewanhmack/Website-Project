import React from "react";
import "./PageStyles.css";

function Contact() {
  return (
    <div className="page-container">
      <h2>Contact Me</h2>
      <p className="muted">Best way to reach me:</p>
      <ul className="contact-list">
        <li>Email: <a href="mailto:ewanhmack@gmail.com">ewanhmack@gmail.com</a></li>
        <li>LinkedIn: <a href="https://www.linkedin.com/in/ewan-mack-h355/" target="_blank" rel="noopener noreferrer">ewan-mack-h355</a></li>
        <li>Instagram: <a href="https://www.instagram.com/ewanhmack/" target="_blank" rel="noopener noreferrer">@ewanhmack</a></li>
        <li>CV available on request</li>
      </ul>
    </div>
  );
}
export default Contact;
