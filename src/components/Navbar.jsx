import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import "./css/ComponentStyles.css";

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    if (!isHome) {
      return undefined;
    }

    const onScroll = () => setIsAtTop(window.scrollY < 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const isTransparent = isHome && isAtTop;

  return (
    <nav className={`navbar ${isTransparent ? "navbar--transparent" : ""}`}>
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