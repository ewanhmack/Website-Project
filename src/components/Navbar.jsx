import React from "react";
import { NavLink } from "react-router-dom";
import "./ComponentStyles.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#/" className="brand">Ewan MacKerracher</a>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Home</NavLink>
          <NavLink to="/programming" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Programming</NavLink>
          <NavLink to="/photography" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Photography</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Contact</NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
