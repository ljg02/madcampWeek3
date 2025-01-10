const express = require("express");
const router = express.Router();

// Example 2D map (replace with your map logic)
const MAP_DATA =  Array.from({ length: 1000 }, () =>
  Array.from({ length: 1000 }, () => (Math.random() > 0.5 ? 1 : 0))
);

// GET /api/map/chunk
router.get("/chunk", (req, res) => {
  const { x, y, width, height } = req.query;

  const chunkX = parseInt(x);
  const chunkY = parseInt(y);
  const chunkWidth = parseInt(width);
  const chunkHeight = parseInt(height);

  if (
    isNaN(chunkX) ||
    isNaN(chunkY) ||
    isNaN(chunkWidth) ||
    isNaN(chunkHeight) ||
    chunkX<0||
    chunkY<0||
    chunkWidth<=0||
    chunkWidth<=0
  ) {
    return res.status(400).json({ error: "Invalid query parameters." });
  }

  if (
    chunkY + chunkHeight > MAP_DATA.length ||
    chunkX + chunkWidth > MAP_DATA[0].length
  ) {
    return res.status(400).json({ error: "Requested chunk is out of bounds." });
  }

  // Extract the requested chunk from the map
  const chunk = MAP_DATA.slice(chunkY, chunkY + chunkHeight).map((row) =>
    row.slice(chunkX, chunkX + chunkWidth)
  );

  res.json({
    x: chunkX,
    y: chunkY,
    width: chunkWidth,
    height: chunkHeight,
    data: chunk,
  });
});

module.exports = router;
