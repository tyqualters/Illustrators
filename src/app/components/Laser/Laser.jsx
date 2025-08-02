'use client'
import React, { useState, useEffect, useRef } from 'react';
import './Laser.css';

function Laser() {
  const [lasers, setLasers] = useState([]);
  const laserAudio = useRef(null);

  useEffect(() => {
    laserAudio.current = new Audio('/Sounds/laserSound.mp3'); // make sure path is correct (CASE-SENSITIVE IN PROD)
  }, []);

  const handleClick = (e) => {
    const newLaser = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };

    setLasers((prev) => [...prev, newLaser]);

    if (laserAudio.current) {
      laserAudio.current.currentTime = 0;
      laserAudio.current.play();
    }

    setTimeout(() => {
      setLasers((prev) => prev.filter((l) => l.id !== newLaser.id));
    }, 400); // match your CSS animation duration
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {lasers.map((laser) => (
        <div
          key={laser.id}
          className="laser"
          style={{ left: `${laser.x}px`, top: `${laser.y}px` }}
        />
      ))}
    </>
  );
}

export default Laser;