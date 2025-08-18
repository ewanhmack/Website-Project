import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter"; // ← import
import Programming from "./pages/Programming";
import Photography from "./pages/Photography";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import "./App.css";
import "./components/ComponentStyles.css";
import "./pages/PageStyles.css";

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="page-offset">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/programming" element={<Programming />} />
            <Route path="/photography" element={<Photography />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <SiteFooter /> {/* ← global footer */}
      </div>
    </Router>
  );
}
