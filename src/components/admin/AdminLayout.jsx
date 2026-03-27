import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import "../../pages/Admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  const navItems = [
    { icon: "🏠", label: "Dashboard", path: "/admin" },
    { icon: "🗂️", label: "Projects", path: "/admin/projects" },
    { icon: "📷", label: "Photos", path: "/admin/photos" },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-title">Admin</span>
          <span className="admin-sidebar-email">{auth.currentUser?.email}</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? "admin-nav-item--active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="admin-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}