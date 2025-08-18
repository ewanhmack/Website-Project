import React from "react";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-row">
        <div>© {new Date().getFullYear()} Ewan MacKerracher</div>
        <div className="footer-links">
          <a href="https://github.com/ewanhmack">GitHub</a>
          <a href="https://www.linkedin.com/in/ewan-mack-h355/" rel="noopener">LinkedIn</a>
          <a href="mailto:ewanhmack@gmail.com">Email</a>
        </div>
      </div>
    </footer>
  );
}
