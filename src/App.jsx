import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Programming from "./pages/Programming";
import Photography from "./pages/Photography";
import Contact from "./pages/Contact";
import "./App.css";

function Home() {
  return (
    <div
      className="App"
      style={{
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <header>
        <h1>Ewan MacKerracher</h1>
        <p>This is my portfolio of projects</p>
      </header>
      <section>
        <h2>About Me</h2>
        <p>
          Hi! I'm an aspiring 2nd year Northern Irish student studying Computer
          Games Development at LJMU. Some of my personal interests include:
          Photography, Programming, and traveling. I currently have a placement
          within Cirdan working as a Software Developer working with React and
          JavaScript.
        </p>
        <p>
          This website is a showcase of my work, including programming projects, and
          acts as a portfolio for my photography.
        </p>
      </section>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/programming" element={<Programming />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;
