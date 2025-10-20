import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import Programming from "./pages/Programming";
import ProjectDetail from "./components/projects/ProjectDetail";
import Photography from "./pages/Photography";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import "./App.css";
import "./components/ComponentStyles.css";
import "./pages/PageStyles.css";
import Electric from "./pages/Electric";


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
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </Router>
  );
}
