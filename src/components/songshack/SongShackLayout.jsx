import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useSongShackAuth } from "../../utils/songshack/useSongShackAuth";
import "../css/songshack.css";

export default function SongShackLayout() {
  const { user } = useSongShackAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/songshack");
  };

  return (
    <div className="ss-shell">
      <header className="ss-nav">
        <NavLink to="/songshack" className="ss-logo">
          SongShack
        </NavLink>

        <nav className="ss-nav-links">
          <NavLink to="/songshack" end>Home</NavLink>
          <NavLink to="/songshack/ranking">Rankings</NavLink>
          <NavLink to="/songshack/new-album">Add Album</NavLink>
          {user ? (
            <>
              <NavLink to="/songshack/profile">Profile</NavLink>
              <button className="ss-nav-btn" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <NavLink to="/songshack/login">Login</NavLink>
          )}
        </nav>
      </header>

      <main className="ss-main">
        <Outlet />
      </main>

      <footer className="ss-footer">
        <p>&copy; Ewan MacKerracher : 2024 SongShack</p>
      </footer>
    </div>
  );
}