import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import Programming from "./pages/Programming";
import ProjectDetail from "./components/projects/ProjectDetail";
import Photography from "./pages/Photography";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Electric from "./pages/Electric";
import ColorPicker from "./pages/ColorPicker";
import AboutMe from "./pages/AboutMe";
import ExplainThisUIPage from "./pages/ExplainThisUI";
import Music from "./pages/Music";
import Maps from "./pages/Maps";
import AdminLogin from "./components/admin/AdminLogin";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import "./components/ComponentStyles.css";
import "./pages/PageStyles.css";
import AdminProjects from "./components/admin/AdminProjects";
import AdminPhotos from "./components/admin/AdminPhotos";

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="page-offset">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/programming" element={<Programming />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/photography" element={<Photography />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/electric" element={<Electric />} />
            <Route path="/ColorPicker" element={<ColorPicker />} />
            <Route path="/ExplainThisUI" element={<ExplainThisUIPage />} />
            <Route path="/about-me" element={<AboutMe />} />
            <Route path="/music" element={<Music />} />
            <Route path="/MapExplorer" element={<Maps />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute>
                  <AdminProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/photos"
              element={
                <ProtectedRoute>
                  <AdminPhotos />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </Router>
  );
}