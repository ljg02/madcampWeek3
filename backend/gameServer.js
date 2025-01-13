// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 또는 필요한 도메인만 지정할 수 있음
  },
});

// --- 게임 월드 상태 예시 ---
let players = {}; // 플레이어 목록 { socket.id: { x: 0, y: 0 } }
let shipPos = { x: 0, y: 0};  //우주선 위치 { x: 0, y: 0 }
let weaponAngle = 0;    //turret 각도
let bullets = []; // 총알 목록 { x, y, angleRad, speed, ... }
let monsters = [];

// 우주선에 상대적으로 스폰위치를 랜덤하게 결정, shipPos를 더해 글로벌 좌표계로
function spawnMonsterOnEdge(angle) {
  const radius = 200;
  const angleRad = (angle * Math.PI) / 180;
 
  return { x: radius * Math.cos(angleRad) + shipPos.x, y: radius * Math.sin(angleRad) + shipPos.y};
}

function startSpawningMonsters() {
    function spawnMonster() {
      const angle = Math.random() * 360;
      const monster = {
        ...spawnMonsterOnEdge(angle),
        speed: Math.random() * 0.5 + 0.7, // Random speed between 1 and 4
        t: 0.001, // LERP interpolation factor
        zigzagAmplitude: Math.random() * 5 + 20,
        zigzagFrequency: Math.random() * 0.5 + 0.01,
        zigzagDirection: Math.random() < 0.5 ? -1 : 1,
        frameInterval: Math.floor(Math.random() * 50) + 20,
        frameCount: 0,
      };
  
      // Add the new monster to the array
      monsters.push(monster);
    }
  
    function spawnAtRandomInterval() {
      if(monsters.length > 10) return;
      spawnMonster(); // Spawn one monster
  
      // Set a random interval for the next spawn (between 1 and 5 seconds)
      const nextSpawnTime = Math.random() * 4000 + 3000;
      setTimeout(spawnAtRandomInterval, nextSpawnTime);
    }
  
    // Start the spawning loop
    spawnAtRandomInterval();
  }

startSpawningMonsters();

// 주기적으로 총알 이동 & 게임 상태 갱신(서버 사이드 게임 루프 예시)
setInterval(() => {
  // 1. 총알 이동
  bullets = bullets.map((b) => {
    return {
      ...b,
      x: b.x + b.speed * Math.cos(b.angleRad),
      y: b.y + b.speed * Math.sin(b.angleRad),
      mileage: b.mileage + b.speed,
    };
  });

  // 2. 1000px를 날아간 총알은 제거
  bullets = bullets.filter((b) => {
    if (b.mileage > 1000) {
      return false;
    }
    return true;
  })

  // 몬스터 움직임에 따른 위치 계산
  monsters = monsters.map((monster) => {
    let dx= monster.x - shipPos.x;
    let dy= monster.y - shipPos.y;

    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

    if (distanceToCenter !== 0) {
      dx /= distanceToCenter;
      dy /= distanceToCenter;
    }

    monster.frameCount++;
    if (monster.frameCount % 30 === 0) {
      monster.zigzagDirection *= -1;
    }

    //수직 벡터
    const perpDx = dy;
    const perpDy = -dx;

    //우주선-몬스터를 잇는 직선에 수직으로 진동하도록
    const zigzagX = perpDx * monster.zigzagAmplitude * monster.zigzagDirection;
    const zigzagY = perpDy * monster.zigzagAmplitude * monster.zigzagDirection;

    monster.x += zigzagX * 0.1;
    monster.y += zigzagY * 0.1;

    return monster;
  });

  // 3. 모든 클라이언트에게 최신 상태를 브로드캐스트
  io.emit("updateGameState", { players, shipPos, weaponAngle, bullets, monsters });
}, 10);

// 클라이언트가 소켓 연결을 맺으면
io.on("connection", (socket) => {
  console.log("새로운 유저 연결:", socket.id);

  // 1) 플레이어 등록
  players[socket.id] = { x: 0, y: 0 };

  // 2) 클라이언트로부터 상태 업데이트 받기
  //    예: 플레이어가 키/마우스 입력을 통해 위치나 각도를 바꿨을 때 emit("playerMove", ...)
  socket.on("playerMove", (playerPos) => {
    // data = { playerPos, } (프론트엔드에서 보내준다고 가정)
    if (players[socket.id]) {
      players[socket.id].x = playerPos.x;
      players[socket.id].y = playerPos.y;
    }
    // 이후 매 프레임마다 setInterval로 updateGameState를 보내므로,
    // 여기서는 따로 emit하지 않아도 됨(선택사항)
  });

  socket.on("spaceShipMove", (keys) => {
    let { x, y } = shipPos;
    const step = 10;
    // WASD
    if (keys['ArrowUp']) y -= step;
    if (keys['ArrowDown']) y += step;
    if (keys['ArrowLeft']) x -= step;
    if (keys['ArrowRight']) x += step;

    shipPos = { x, y };
  });

  socket.on("turretMove", (newWeaponAngle) => {
    weaponAngle = newWeaponAngle
  });

  // 3) 총알 발사
  socket.on("shootBullet", (bulletData) => {
    // bulletData = { x, y, angleRad, speed, radius, ... }
    // 발사 위치/각도 계산은 클라이언트에서 한 뒤 서버로 전송
    bullets.push({
      ...bulletData,
      // 예: 서버에서 시간을 찍거나 ID를 붙일 수도
      ownerId: socket.id,
    });
  });

  // 4) 연결 해제
  socket.on("disconnect", () => {
    console.log("유저 접속 해제:", socket.id);
    // 플레이어 목록에서 제거
    delete players[socket.id];
  });
});

server.listen(5000, () => {
  console.log("서버가 5000번 포트에서 실행 중...");
});
