
// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const TILE_SIZE = 32;
// const VIEWPORT_WIDTH = 10;
// const VIEWPORT_HEIGHT = 10;

// function Map() {
//   const [mapData, setMapData] = useState([]);
//   const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

//   useEffect(() => {
//     fetchMapChunk(playerPosition.x, playerPosition.y);
//   }, [playerPosition]);

//   const fetchMapChunk = async (x, y) => {
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/map/chunk?x=${x}&y=${y}&width=${VIEWPORT_WIDTH}&height=${VIEWPORT_HEIGHT}`
//       );
//       if (response.data && Array.isArray(response.data.data)) {
//         setMapData(response.data.data);
//       } else {
//         console.error("Invalid map data:", response.data);
//         setMapData([]);
//       }
//     } catch (error) {
//       console.error("Error fetching map chunk", error);
//       setMapData([]);
//     }
//   };

//   const handleKeyDown = (e) => {
//     let newPlayerPosition = { ...playerPosition };

//     switch (e.key) {
//       case "ArrowUp":
//         newPlayerPosition.y = Math.max(0, newPlayerPosition.y - 1);
//         break;
//       case "ArrowDown":
//         newPlayerPosition.y += 1;
//         break;
//       case "ArrowLeft":
//         newPlayerPosition.x = Math.max(0, newPlayerPosition.x - 1);
//         break;
//       case "ArrowRight":
//         newPlayerPosition.x += 1;
//         break;
//       default:
//         return;
//     }

//     setPlayerPosition(newPlayerPosition);
//   };

//   useEffect(() => {
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [playerPosition]);

//   const offsetX = playerPosition.x * TILE_SIZE * -1;
//   const offsetY = playerPosition.y * TILE_SIZE * -1;

//   return (
//     <div
//       style={{
//         width: VIEWPORT_WIDTH * TILE_SIZE,
//         height: VIEWPORT_HEIGHT * TILE_SIZE,
//         display: "grid",
//         gridTemplateColumns: `repeat(${VIEWPORT_WIDTH}, ${TILE_SIZE}px)`,
//         gridTemplateRows: `repeat(${VIEWPORT_HEIGHT}, ${TILE_SIZE}px)`,
//         overflow: "hidden",
//         position: "relative",
//         border: "1px solid black",
//         transform: `translate(${offsetX}px, ${offsetY}px)`, // ✅ Apply the offset
//       }}
//     >
//       {Array.isArray(mapData) &&
//         mapData.flat().map((tile, index) => (
//           <div
//             key={index}
//             style={{
//               width: TILE_SIZE,
//               height: TILE_SIZE,
//               backgroundColor: tile === 1 ? "green" : "brown",
//               border: "1px solid black",
//             }}
//           ></div>
//         ))}
//     </div>
//   );
// }

// export default Map;
import React, { useState, useEffect } from "react";
import axios from "axios";

const TILE_SIZE = 16; // Size of each tile in pixels
const VIEWPORT_WIDTH = 10; // Number of tiles visible horizontally
const VIEWPORT_HEIGHT = 10; // Number of tiles visible vertically

function Map() {
  const [mapData, setMapData] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

  // Fetch initial map chunk
  useEffect(() => {
    fetchMapChunk(playerPosition.x, playerPosition.y);
  }, [playerPosition]);

  // Fetch map chunk from backend
  const fetchMapChunk = async (x, y) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/map/chunk?x=${x}&y=${y}&width=${VIEWPORT_WIDTH}&height=${VIEWPORT_HEIGHT}`
      );
      if (response.data && Array.isArray(response.data.data)) {
        setMapData(response.data.data);
      } else {
        console.error("Invalid map data:", response.data);
        setMapData([]);
      }
    } catch (error) {
      console.error("Error fetching map chunk", error);
    }
  };

  // Handle arrow key input to move player
  const handleKeyDown = (e) => {
    let newPlayerPosition = { ...playerPosition };

    switch (e.key) {
      case "ArrowUp":
        if (newPlayerPosition.y > 0) newPlayerPosition.y -= 1;
        break;
      case "ArrowDown":
        if (newPlayerPosition.y < 100 - VIEWPORT_HEIGHT) newPlayerPosition.y += 1;
        break;
      case "ArrowLeft":
        if (newPlayerPosition.x > 0) newPlayerPosition.x -= 1;
        break;
      case "ArrowRight":
        if (newPlayerPosition.x < 100 - VIEWPORT_WIDTH) newPlayerPosition.x += 1;
        break;
      default:
        return;
    }

    setPlayerPosition(newPlayerPosition);
  };

  // Add keydown event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPosition]);

  // Calculate offset to center the player in the viewport
  const offsetX = playerPosition.x * TILE_SIZE * -1;
  const offsetY = playerPosition.y * TILE_SIZE * -1;

  return (
    <div
      style={{
        width: VIEWPORT_WIDTH * TILE_SIZE,
        height: VIEWPORT_HEIGHT * TILE_SIZE,
        overflow: "hidden",
        position: "relative",
        border: "1px solid black",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: offsetY,
          left: offsetX,
          display: "grid",
          gridTemplateColumns: `repeat(${VIEWPORT_WIDTH}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${VIEWPORT_HEIGHT}, ${TILE_SIZE}px)`,
        }}
      >
        {Array.isArray(mapData) &&
          mapData.flat().map((tile, index) => (
            <div
              key={index}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: tile === 1 ? "green" : "brown",
                border: "1px solid black",
              }}
            ></div>
          ))}
      </div>
    </div>
  );
}

export default Map;
