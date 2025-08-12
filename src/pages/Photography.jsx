import React, { useState, useEffect } from "react";
import "./PageStyles.css";

function Carousel({ title, items, className }) {
  const [current, setCurrent] = useState(0);
  const length = items.length;

  function next() {
    setCurrent((current + 1) % length);
  }

  function prev() {
    setCurrent((current - 1 + length) % length);
  }

  return (
    <div className={`carousel ${className || ""}`}>
      <h2>{title}</h2>
      <div className="carousel-content">
        <button onClick={prev} className="carousel-btn">‹</button>

        <div className="carousel-card">
          <img
            src={`images/photos/${items[current].image}`}
            alt={items[current].header}
          />
          <h3>{items[current].header}</h3>
        </div>

        <button onClick={next} className="carousel-btn">›</button>
      </div>
    </div>
  );
}

function shuffleArray(array) {
  // Fisher-Yates shuffle
  const arr = array.slice(); // copy so original not mutated
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function Photography() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("data/photography.json")
      .then(res => res.json())
      .then(originalData => {
        // Shuffle each category
        const shuffledData = {
          Portraits: shuffleArray(originalData.Portraits),
          Landscapes: shuffleArray(originalData.Landscapes),
          // Animals: shuffleArray(originalData.Animals), // if you enable this later
        };
        setData(shuffledData);
      })
      .catch(err => console.error("Failed to load photography data:", err));
  }, []);

  if (!data) {
    return <div>Loading photography...</div>;
  }

  return (
    <div className="photography-page">
      <Carousel title="Portraits" items={data.Portraits} className="portrait-carousel" />
      <Carousel title="Landscapes" items={data.Landscapes} className="landscape-carousel" />
      {/* <Carousel title="Animals" items={data.Animals} className="square-carousel" /> */}
    </div>
  );
}

export default Photography;
