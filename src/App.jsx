import React from "react";
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
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
          Javascript
        </p>
      </section>

    </div>
  );
}

const router = createBrowserRouter([
  {
    index: true
    element: <HomePage />
    children: [
      {
        path: 'programming',
        element: <Programming />,
      },
      {
        path: 'photography',
        element: <Photography />,
      },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}


export default App;
