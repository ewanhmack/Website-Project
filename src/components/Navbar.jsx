import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import "./ComponentStyles.css";

function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#/" className="brand">Ewan MacKerracher</a>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Home</NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Programming</NavLink>
          <NavLink to="/photography" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Photography</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Contact</NavLink>
          <NavLink to="/music" className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}>Music</NavLink>
          <NavLink
            to={user ? "/admin" : "/admin/login"}
            className="navbar-link admin-link"
            title={user ? "Admin dashboard" : "Admin login"}
            aria-label={user ? "Admin dashboard" : "Admin login"}
          >
            ⚙
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;