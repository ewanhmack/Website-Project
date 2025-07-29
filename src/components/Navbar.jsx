import React from "react";
import { NavLink } from "react-router-dom";
import './ComponentStyles.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Home</NavLink>
        <NavLink to="/programming" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Programming</NavLink>
        <NavLink to="/photography" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Photography</NavLink>
        <NavLink to="/contact" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Contact</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;