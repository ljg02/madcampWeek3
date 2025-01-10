import React, { useState, useEffect } from "react";
import axios from "axios";

const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 20;
const VIEWPORT_HEIGHT = 15;

function Map() {
  const [mapData, setMapData] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchMapChunk(playerPosition.x, playerPosition.y);
  }, [playerPosition]);

  const fetchMapChunk = async (x, y) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/map/chunk?x=${x}&y=${y}`);
        console.log("Map Data:", response.data);
      setMapData(response.data);
    } catch (error) {
      console.error("Error fetching map chunk", error);
    }
  };

  const handleKeyDown = (e) => {
    let newOffset = { ...offset };
    switch (e.key) {
      case "ArrowUp":
        newOffset.y += TILE_SIZE;
        break;
      case "ArrowDown":
        newOffset.y -= TILE_SIZE;
        break;
      case "ArrowLeft":
        newOffset.x += TILE_SIZE;
        break;
      case "ArrowRight":
        newOffset.x -= TILE_SIZE;
        break;
      default:
        return;
    }
    setOffset(newOffset);
    setPlayerPosition({
      x: playerPosition.x + (newOffset.x / TILE_SIZE),
      y: playerPosition.y + (newOffset.y / TILE_SIZE),
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [offset]);

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
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {mapData.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
            style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        position: "absolute",
        top: rowIndex * TILE_SIZE,
        left: colIndex * TILE_SIZE,
        backgroundColor: tile === 1 ? "green" : "brown",
        border: "1px solid black", // Add a border for visibility
              }}
            ></div>
          ))
        )}
      </div>
    </div>
  );
}

export default Map;
