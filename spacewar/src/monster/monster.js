// import React, { useEffect, useState, useRef } from 'react';

// function GameMap() {
//   const [monster, setMonster] = useState({ x: 0, y: 0 });
//   const mapSize = { width: 1000, height: 500 };
//   const canvasRef=useRef(null);

//   // Fetch the monster's initial position
//   useEffect(() => {
//     const fetchMonster = async () => {
//       const response = await fetch('http://localhost:5000/api/monster/position');
//       const data = await response.json();
//       setMonster(data);
//     };

//     fetchMonster();
//   }, []);

//   const lerp=(start, end, t)=> start+(end-start)*t;

  

//   // Automatically move the monster toward the center
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       const response = await fetch('http://localhost:5000/api/monster/move', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(mapSize),
//       });

//       const updatedMonster = await response.json();
//       setMonster(updatedMonster);
//     }, 100); // Move every 100 milliseconds

//     return () => clearInterval(interval);
//   }, [monster]);

//   useEffect(()=>{
//     const canvas =canvasRef.current;
//     const context=canvas.getContext('2d');
//     context.clearRect(0,0,canvas.width,canvas.height);
//     context.filStyle='green';
//     context.fillRect(monster.x, monster.y,20,20);
//   },[monster]);


//   return (
//     <div>
//       <h2>Game Map</h2>
//       <canvas 
//       ref={canvasRef} 
//       width={mapSize.width} 
//       height={mapSize.height} 
//       styel={{border: '1px solid balck'}}
//       ></canvas>
//     </div>
//   );
// }

// export default GameMap;

import React, { useEffect, useRef, useState } from 'react';

function GameMap() {
  const [monster, setMonster] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const mapSize = { width: 1000, height: 500 };

  // Fetch the monster's initial position
  useEffect(() => {
    const fetchMonster = async () => {
      const response = await fetch('http://localhost:5000/api/monster/position');
      const data = await response.json();
      setMonster(data);
    };

    fetchMonster();
  }, []);

  // Continuously update the monster's position
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('http://localhost:5000/api/monster/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapSize),
      });

      const updatedMonster = await response.json();
      setMonster(updatedMonster);
    }, 10); // Update every 100 milliseconds

    return () => clearInterval(interval);
  }, []);

  // Draw the monster on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the monster (green box)
    context.fillStyle = 'green';
    context.fillRect(monster.x, monster.y, 20, 20);
  }, [monster]);

  return (
    <div>
      <h2>Game Map</h2>
      <canvas
        ref={canvasRef}
        width={mapSize.width}
        height={mapSize.height}
        style={{ border: '1px solid black' }}
      ></canvas>
    </div>
  );
}

export default GameMap;
