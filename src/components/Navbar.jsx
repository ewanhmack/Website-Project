import React from "react";
import { Link } from "react-router-dom";
import "./ComponentStyles.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link className="navbar-link" to="/">Home</Link>
        <Link className="navbar-link" to="/programming">Programming</Link>
        <Link className="navbar-link" to="/photography">Photography</Link>
        <Link className="navbar-link" to="/contact">Contact</Link>
      </div>
    </nav>
  );
}

export default Navbar;
