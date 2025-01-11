const express = require('express');
const router = express.Router();

// Monster state
let monsters=spawnMonsters(5);

function spawnMonsters(count){
    const monstersArray=[];
    const edges=['top','bottom', 'left','right'];
    for(let i=0; i< count; i++){
        const edge=edges[i%edges.length];
        monstersArray.push({
            ...spawnMonsterOnEdge(edge),
            speed: Math.random()*0.5+0.7, // Random speed between 1 and 4
            t: 0.001, // LERP interpolation factor (adjust this for smoother movement)
            zigzagAmplitude: Math.random()*5+20,
            zigzagFrequency: Math.random()*0.5+0.01,
            zigzagDirection: Math.random()<0.5?-1:1,
            framInterval: Math.floor(Math.random()*50)+20,
            frameCount:0,
        });
    }
    return monstersArray;
}

// let monster = {
//   ...spawnMonsterOnEdge(),
//   speed: Math.random()*1.5, // Random speed between 1 and 4
//   t: 0.001, // LERP interpolation factor (adjust this for smoother movement)
//   zigzagAmplitude: Math.random()*50+20,
//   zigzagFrequency: 0.7,
//   zigzagDirection: 1,
//   frameCount:0,
// };

function spawnMonsterOnEdge(edge) {
//   const edges = ['top', 'bottom', 'left', 'right'];
//   const edge = edges[Math.floor(Math.random() * edges.length)];
  const mapWidth = 1000;
  const mapHeight = 500;

  switch (edge) {
    case 'top':
      return { x: Math.floor(Math.random() * mapWidth), y: 0 };
    case 'bottom':
      return { x: Math.floor(Math.random() * mapWidth), y: mapHeight };
    case 'left':
      return { x: 0, y: Math.floor(Math.random() * mapHeight) };
    case 'right':
      return { x: mapWidth, y: Math.floor(Math.random() * mapHeight) };
    default:
      return { x: 0, y: 0 };
  }
}

router.get('/position', (req, res) => {
  res.json(monsters);
});

// Endpoint to update the monster's position using LERP
router.post('/move', (req, res) => {
  const { width, height } = req.body;
  monsters=monsters.map((monster)=>{
  // Calculate the center of the map
  const centerX = width / 2;
  const centerY = height / 2;

    let dx=centerX-monster.x;
    let dy=centerY-monster.y;

    const length=Math.sqrt(dx*dx+dy*dy);
    if(length!==0){
        dx/=length;
        dy/=length;
    }
    dx*=monster.speed;
    dy*=monster.speed;
    monster.frameCount++;
    if(monster.frameCount%30===0){
        monster.zigzagDirection*=-1;
    }
    const perpDx=-dy;
    const perpDy=dx;

    const zigzagX=perpDx*monster.zigzagAmplitude*monster.zigzagDirection;
    const zigzagY=perpDy*monster.zigzagAmplitude*monster.zigzagDirection;

    monster.x+=(dx*monster.speed)+zigzagX*0.1;
    monster.y+=(dy*monster.speed)+zigzagY*0.1;

    if (monster.x < 0) monster.x = 0;
    if (monster.x > width) monster.x = width;
    if (monster.y < 0) monster.y = 0;
    if (monster.y > height) monster.y = height;

    return monster
});
res.json(monsters);
});

module.exports = router;

