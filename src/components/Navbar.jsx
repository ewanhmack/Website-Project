import React from "react";
import './ComponentStyles.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <a className="navbar-link" href="/">Home</a>
        <a className="navbar-link" href="programming">Programming</a>
        <a className="navbar-link" href="photography">Photography</a>
        <a className="navbar-link" href="contact">Contact</a>
      </div>
    </nav>
  );
}

export default Navbar;