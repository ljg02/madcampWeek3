// import React, { useEffect, useRef, useState } from 'react';
// import axios from 'axios';

// function GameMap() {
//   const [monsters, setMonsters] = useState([]);
//   const canvasRef = useRef(null);
//   const shiftTarget=useRef({x:0,y:0});

//   useEffect(()=>{
//     let shiftInterval;
//     const handleKeypress=async (e)=>{
//       let dx=0;
//       let dy=0;
//       switch(e.key){
//         case 'w':
//           dy=-2;
//           break;
//         case 'a':
//           dy=2;
//           break;
//         case 's':
//           dx=-2;
//           break;
//         case 'd':
//           dx=2;
//           break;
//         default:
//           return;
//       }
//       shiftTarget.current.x+=dx;
//       shiftTarget.current.y+=dy;
//       if(!shiftInterval){
//         shiftInterval=setInterval(async()=>{
//           await axios.post('http://localhost:5000/api/monster/shift',{
//             direction: e.key,
//             shiftAmount: 10,
//         });
//       },10);
//     }
//     };
//     const handleKeyup=()=>{
//       clearInterval(shiftInterval);
//       shiftInterval=null;
//     };
    
//     window.addEventListener('keydown', handleKeypress);
//     window.addEventListener('keyup',handleKeyup);
//     return ()=>{
//       window.removeEventListener('keydown',handleKeypress);
//       window.removeEventListener('keyup',handleKeyup);
//       clearInterval(shiftInterval);
//     };
//   },[]);

//   // Fetch the monster's initial position
//   useEffect(() => {
//     const fetchMonsters = async () => {
//       const response = await fetch('http://localhost:5000/api/monster/position');
//       const data = await response.json();
//       setMonsters(data);
//     };

//     fetchMonsters();
//   }, []);
  

//   // Continuously update the monster's position
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       const response = await fetch('http://localhost:5000/api/monster/move', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({width: window.innerWidth, height: window.innerHeight}),
//       });

//       const updatedMonster = await response.json();
//       setMonsters(updatedMonster);
//     }, 10); // Update every 100 milliseconds

//     return () => clearInterval(interval);
//   }, []);

//   useEffect(()=>{
//     const resizeCanvas=()=>{
//         const canvas=canvasRef.current;
//         canvas.width=window.innerWidth;
//         canvas.height=window.innerHeight;
//     }
//     resizeCanvas();
//     window.addEventListener('resize',resizeCanvas);
//     return ()=>{
//       window.removeEventListener('resize',resizeCanvas);
//     }
//   },[]);

//   // Draw the monster on the canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const context = canvas.getContext('2d');

//     const animate = () => {
//       context.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw the monsters
//       monsters.forEach((monster) => {
//         context.fillStyle = 'green';
//         context.fillRect(monster.x, monster.y, 20, 20);
//       });
//     requestAnimationFrame(animate);
//   };

//   animate();
// }, [monsters]);

//   return (
//     <div>
//       <canvas
//         ref={canvasRef}
//         style={{ border: '1px solid black' }}
//       ></canvas>
//     </div>
//   );
// }

// export default GameMap;
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function GameMap() {
  const [monsters, setMonsters] = useState([]);
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pressedKeys = useRef(new Set());

  // Track key presses
  useEffect(() => {
    const handleKeydown = (e) => {
      pressedKeys.current.add(e.key);
    };

    const handleKeyup = (e) => {
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
    };
  }, []);

  // Continuously update the offset based on pressed keys
  useEffect(() => {
    const moveInterval = setInterval(async () => {
      let dx = 0;
      let dy = 0;

      if (pressedKeys.current.has('ArrowUp')) dy -= 10;
      if (pressedKeys.current.has('ArrowDown')) dy += 10;
      if (pressedKeys.current.has('ArrowLeft')) dx -= 10;
      if (pressedKeys.current.has('ArrowRight')) dx += 10;

      if (dx !== 0 || dy !== 0) {
        setOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));

        // Send the movement update to the backend
        await axios.post('http://localhost:5000/api/monster/shift', {
          direction: Array.from(pressedKeys.current),
          shiftAmount: 10,
        });
      }
    }, 15);

    return () => clearInterval(moveInterval);
  }, []);

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
        body: JSON.stringify({ width: window.innerWidth, height: window.innerHeight }),
      });

      const updatedMonsters = await response.json();
      setMonsters(updatedMonsters);
    }, 15);

    return () => clearInterval(interval);
  }, []);

  // Resize the canvas on window resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Draw the monsters on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      monsters.forEach((monster) => {
        context.fillStyle = 'green';
        context.fillRect(monster.x - offset.x, monster.y - offset.y, 20, 20);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [monsters, offset]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ border: '0px solid black' }}
      ></canvas>
    </div>
  );
}

export default GameMap;
