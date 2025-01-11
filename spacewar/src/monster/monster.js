import React, { useEffect, useRef, useState } from 'react';

function GameMap() {
  const [monsters, setMonsters] = useState([]);
  const canvasRef = useRef(null);
//   const mapSize = { width: 1000, height: 500 };

  // Fetch the monster's initial position
  useEffect(() => {
    const fetchMonsters = async () => {
      const response = await fetch('http://localhost:5000/api/monster/position');
      const data = await response.json();
      setMonsters(data);
    };

    fetchMonsters();
  }, []);

  // Continuously update the monster's position
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('http://localhost:5000/api/monster/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({width: window.innerWidth, height: window.innerHeight}),
      });

      const updatedMonster = await response.json();
      setMonsters(updatedMonster);
    }, 10); // Update every 100 milliseconds

    return () => clearInterval(interval);
  }, []);

  useEffect(()=>{
    const resizeCanvas=()=>{
        const canvas=canvasRef.current;
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize',resizeCanvas);
  },[]);

  // Draw the monster on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the monster (green box)
    monsters.forEach((monster)=>{
    context.fillStyle = 'green';
    context.fillRect(monster.x, monster.y, 20, 20);
    });
  }, [monsters]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black' }}
      ></canvas>
    </div>
  );
}

export default GameMap;
