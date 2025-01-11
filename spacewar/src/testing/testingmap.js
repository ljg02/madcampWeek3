
import React, { useState, useEffect } from "react";
import axios from "axios";

const TILE_SIZE = 32; // Size of each tile in pixels

function Map() {
  const [mapData, setMapData] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: 0,
  });

  // Calculate viewport size based on screen dimensions
  useEffect(() => {
    const handleResize = () => {
      const width = Math.floor(window.innerWidth / TILE_SIZE-1);
      const height = Math.floor(window.innerHeight / TILE_SIZE-1);
      setViewportSize({ width, height });
    };

    // Set initial size and listen for window resize
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch initial map chunk
  useEffect(() => {
    fetchMapChunk(playerPosition.x, playerPosition.y);
  }, [playerPosition.x, playerPosition.y,viewportSize.width, viewportSize.height]);

  // Fetch map chunk from backend
  const fetchMapChunk = async (x, y) => {
    try {
      //console.log('x: ', x, ', y: ', y);
      //console.log('width: ', viewportSize.width, ', height: ', viewportSize.height);
      const response = await axios.get(
        `http://localhost:5000/api/map/chunk?x=${x}&y=${y}&width=${viewportSize.width}&height=${viewportSize.height}`
      );
      if (response.data && Array.isArray(response.data.data)) {
        console.log('map fetch success');
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
        newPlayerPosition.y = Math.max(0, newPlayerPosition.y - 1);
        break;
      case "ArrowDown":
        newPlayerPosition.y += 1;
        break;
      case "ArrowLeft":
        newPlayerPosition.x = Math.max(0, newPlayerPosition.x - 1);
        break;
      case "ArrowRight":
        newPlayerPosition.x += 1;
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

  // Calculate offset to move the map
  const offsetX = TILE_SIZE;
  const offsetY = TILE_SIZE;

  return (
    <div
      style={{
        width: viewportSize.width * TILE_SIZE,
        height: viewportSize.height * TILE_SIZE,
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
          gridTemplateColumns: `repeat(${viewportSize.width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${viewportSize.height}, ${TILE_SIZE}px)`,
        }}
      >
        {Array.isArray(mapData) &&
          mapData.flat().map((tile, index) => (
            <div
              key={index}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: tile === 1 ? "black" : "white",
                border: "1px solid black",
              }}
            ></div>
          ))}
      </div>
      <div
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: "red",
          position: "absolute",
          top: (viewportSize.height / 2) * TILE_SIZE,
          left: (viewportSize.width / 2) * TILE_SIZE,
          border: "2px solid white",
        }}
      ></div>
    </div>
  );
}

export default Map;
