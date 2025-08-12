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


function Photography() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("data/photography.json")
      .then(res => res.json())
      .then(setData)
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
