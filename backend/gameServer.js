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
let missileAngle = 0;
let ship = { x: 0, y: 0, hp: 10, radius: 150};   //우주선 상태(위치, hp)
let weaponAngle = 0;    //turret 각도
let bullets = []; // 총알 목록 { x, y, angleRad, speed, ... }
let missiles=[];
let monsters = [];
let controlAssignments={};  // 각 플레이어가 잡은 조종석 목록 { socket.id: "spaceship" }

let score = 0;  //점수(모든 플레이어가 공유)

// 각 조종석 상태(잡은 사람과 색깔)
let seatStates={
  spaceship: {occupant: null, color: "#ffffff"},
  gun: {occupant: null, color: "#ffffff"},
  missile: {occupant: null, color: "#ffffff"},
};

//몬스터 크기
const MONSTER_RADIUS = 10;
const MISSILE_BLAST_RADIUS=100;
const MISSILE_DAMAGE=5;

// 우주선에 상대적으로 스폰위치를 랜덤하게 결정, shipPos를 더해 글로벌 좌표계로
function spawnMonsterOnEdge(angle) {
  const radius = 1080 / 2;
  const angleRad = (angle * Math.PI) / 180;
 
  return {
    x: radius * Math.cos(angleRad) + ship.x,
    y: radius * Math.sin(angleRad) + ship.y
  };
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
        radius: MONSTER_RADIUS,
        hp: 3,
        vx:0,
        vy: 0,
        state: "approach",
        bounceTimer:0,
      };
  
      // Add the new monster to the array
      monsters.push(monster);
    }
  
    function spawnAtRandomInterval() {
      if(!mainLoop || monsters.length > 10) return;
      spawnMonster(); // Spawn one monster
  
      // Set a random interval for the next spawn (between 3 and 5 seconds)
      const nextSpawnTime = Math.random() * 2000 + 3000;
      setTimeout(spawnAtRandomInterval, nextSpawnTime);
    }
  
    // Start the spawning loop after 3s
    if(mainLoop) {
      setTimeout(spawnAtRandomInterval, 3000);
    }
}

function resetGameState() {
    players = {};
    ship = { x: 0, y: 0, hp: 10, radius: 150 };
    weaponAngle = 0;
    missileAngle = 0;
    bullets = [];
    missiles = [];
    monsters = [];
    controlAssignments = {};
    seatStates = {
      spaceship: {occupant: null, color: "#ffffff"},
      gun: {occupant: null, color: "#ffffff"},
      missile: {occupant: null, color: "#ffffff"},
    };
    score = 0;
    
    // 만약 다시 몬스터 스폰도 처음부터 시작하고 싶다면,
    // startSpawningMonsters()를 다시 호출하거나,
    // spawn 타이머 등을 초기화하는 로직을 넣어도 됨
}

let mainLoop = null; // 메인 루프 식별자(Interval ID 등)

function startMainLoop() {
  // 이미 실행 중이면 중복으로 시작하지 않음
  if (mainLoop) return;

  mainLoop = setInterval(() => {
    // 여기서 bullets, monsters, collisions 등 게임 로직을 돌림
    gameLoopStep();
  }, 10);
}

function stopMainLoop() {
  if (!mainLoop) return;
  clearInterval(mainLoop);
  mainLoop = null;
}

//한 주기마다 실행할 동작
function gameLoopStep() {
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
  bullets = bullets.filter((b) => b.mileage < 1000);

  // 1-1. 미사일 이동
  missiles=missiles.map((m)=>{
      return {
        ...m,
        x: m.x + m.speed*Math.cos(m.angleRadm),
        y: m.y + m.speed*Math.sin(m.angleRadm),
        mileage: m.mileage+m.speed,
      };
  });

  missiles=missiles.filter((m)=> m.mileage<1000);

  // 3. 몬스터 움직임에 따른 위치 계산
  monsters = monsters.map((monster) => {

    if(monster.state==="approach"){
      let dx=monster.x-ship.x;
      let dy=monster.y-ship.y;
      let dist=Math.sqrt(dx*dx+dy*dy);
      if(dist!==0){
        dx/=dist;
        dy/=dist;
      }
      monster.x-=dx*monster.speed;
      monster.y-=dy*monster.speed;

      const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

      //(dx, dy)는 우주선 중심에서 몬스터를 향하는 단위벡터가 됨
      if (distanceToCenter !== 0) {
        dx /= distanceToCenter;
        dy /= distanceToCenter;
      }
  
      monster.frameCount++;
      if (monster.frameCount % 30 === 0) {
        monster.zigzagDirection *= -1;
      }
  
      //몬스터가 우주선에 점점 다가가도록
      monster.x += (-dx) * monster.speed;
      monster.y += (-dy) * monster.speed;
  
      //수직 벡터
      const perpDx = dy;
      const perpDy = -dx;
  
      //우주선-몬스터를 잇는 직선에 수직으로 진동하도록
      const zigzagX = perpDx * monster.zigzagAmplitude * monster.zigzagDirection;
      const zigzagY = perpDy * monster.zigzagAmplitude * monster.zigzagDirection;
  
      monster.x += zigzagX * 0.1;
      monster.y += zigzagY * 0.1;

    }
    else if(monster.state==="bounce"){

      monster.x+=monster.vx;
      monster.y+=monster.vy;

      //프레임당 10ms만큼 감소
      monster.bounceTimer -= 10;
      if(monster.bounceTimer<=0){
        monster.state="approach";
        monster.vx=0;
        monster.vy=0;
      }
    }
  
    return monster;
  });

  // 4. **충돌 검사(총알 vs 몬스터)**
  //    - 원형 충돌: 거리 <= (bullet.radius + MONSTER_RADIUS)
  //    - 충돌한 총알/몬스터는 제거
  let newMonsters = [];
  // 어떤 총알이 충돌했는지 추적 (인덱스)
  let collidedBulletIndexes = new Set();
  let deadMonster = []; // 처치된 몬스터 정보 저장 ({ x: monster.x, y: monster.y, radius: monster.radius })
  let bulletHitMonster = []; // 총알에 피격된 몬스터 정보 저장 ({ x: monster.x, y: monster.y, radius: monster.radius })
  let ExplodedMissile=[];
  let isGameOver = false;

  // 모든 몬스터에 대해 각각 순회하며, 모든 총알과의 위치관계를 확인
  monsters.forEach((monster) => {
    let isMonsterDead = false;

    // 총알 배열을 순회하여 충돌 여부 확인
    for (let i = 0; i < bullets.length; i++) {
      if (collidedBulletIndexes.has(i)) {
        // 이미 다른 몬스터와 충돌로 제거 예정인 총알이면 건너뜀
        continue;
      }

      const b = bullets[i];
      const dx = b.x - monster.x;
      const dy = b.y - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= (b.radius + monster.radius)) {
        monster.hp-=1;
        bulletHitMonster.push({ x: monster.x, y: monster.y, radius: monster.radius });

        // 충돌 발생
        if(monster.hp<=0){
          isMonsterDead = true;
          // 처치 몬스터 정보 저장
          deadMonster.push({ x: monster.x, y: monster.y, radius: monster.radius });
        }

        // 해당 총알 제거 표시
        collidedBulletIndexes.add(i);
        // 즉시 총알 순회 종료(한 프레임당 하나의 총알만 충돌 발생)
        break;
      }
    }

    //미사일 배열을 순회하며 미사일과의 충돌 확인
    for (let j = 0; j < missiles.length; j++){
      const m = missiles[j];
      const mx = m.x - monster.x;
      const my = m.y - monster.y;
      //몬스터와 미사일 간의 거리
      const mist = Math.sqrt(mx*mx+my*my);

      //몬스터와 닿은 미사일은 폭발상태로 변경
      if(mist <= (m.radius+monster.radius)){
        m.exploded=true;
        ExplodedMissile.push({ x: m.x, y: m.y, radius: m.explodeRadius});
      }
    }

    // 우주선과의 충돌 확인
    if(!isMonsterDead && monster.state !== "bounce") {
      const dx = ship.x - monster.x;
      const dy = ship.y - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
    
      if (dist <= (ship.radius + monster.radius)) {
          ship.hp-=1;
          //우주선 충돌 이벤트 방송
          io.emit("shipHit");

          // 우주선 hp가 0이면 게임오버
          if(ship.hp<=0){
          isGameOver = true;
          }

          // 넉백 설정
          monster.state="bounce";

          let dirX=monster.x-ship.x;
          let dirY=monster.y-ship.y;
          const currentDist=Math.sqrt(dirX*dirX+dirY*dirY);

          if(currentDist !==0){
            dirX/=currentDist;
            dirY/=currentDist;
          }

          const BOUNCE_SPEED=7;
          monster.vx=dirX*BOUNCE_SPEED;
          monster.vy=dirY*BOUNCE_SPEED;

          monster.bounceTimer=300;

          // 해당 몬스터 사망 처리
          // isMonsterDead = true;
      }
    }

    // 죽지 않은 몬스터만 newMonsters에 넣음
    if (!isMonsterDead) {
      newMonsters.push(monster);
    }
  });
  monsters = newMonsters;
  newMonsters = [];

  // 폭발 반경에 들어간 몬스터 처리
  monsters.forEach((monster) => {
    let isMonsterDead = false;
    for(let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      const mx = m.x - monster.x;
      const my = m.y - monster.y;
      //몬스터와 미사일 간의 거리
      const mist = Math.sqrt(mx*mx+my*my);

      //반경 내에 있는지 확인
      if(m.exploded && mist<=(m.explodeRadius+monster.radius)){
        monster.hp-=5;
        if(monster.hp<=0){
          isMonsterDead=true;
          // 처치 몬스터 정보 저장
          deadMonster.push({ x: monster.x, y: monster.y, radius: monster.radius });
        }
      }
    }

    // 죽지 않은 몬스터만 newMonsters에 넣음
    if (!isMonsterDead) {
      newMonsters.push(monster);
    }
  });

  // 충돌되지 않은 총알만 남김
  let newBullets = bullets.filter((_, index) => {
    return !collidedBulletIndexes.has(index);
  });

  // 폭발하지 않은 미사일만 남김
  let newMissiles=missiles.filter((m, index)=>{
    return !m.exploded;
  })

  monsters = newMonsters;
  bullets = newBullets;
  missiles=newMissiles;

  // 5. 총알 피격 정보 브로드캐스트
  bulletHitMonster.forEach((monster) => {
    io.emit("monsterBulletHit", monster); // 각 피격에 대해 이벤트 전송
  });

  // 6. 미사일 폭발 정보 브로드캐스트
  ExplodedMissile.forEach((missileEffect)=>{
    io.emit("missileExplode", missileEffect);
  });

  // 7. 처치 정보 브로드캐스트
  deadMonster.forEach((monster) => {
    io.emit("monsterDead", monster); // 각 처치에 대해 이벤트 전송
    score += 10;
  });

  // 8. 게임 오버 브로드캐스트
  if(isGameOver) {
    io.emit("gameover", score);
    resetGameState();
    stopMainLoop();
  }

  // 9. 모든 클라이언트에게 최신 상태를 브로드캐스트
  //io.emit("updateGameState", { players, shipPos, weaponAngle, bullets, monsters });
  io.emit("updateGameState", { 
    players, 
    ship, 
    weaponAngle,
    missileAngle, 
    bullets,
    missiles, 
    monsters,
    score,
    seatStates,
   });
}

// 클라이언트가 소켓 연결을 맺으면
io.on("connection", (socket) => {
  console.log("새로운 유저 연결:", socket.id);

  if (!mainLoop) {
    // 메인 루프가 꺼져 있다면 다시 켜기
    startMainLoop();
    // 몬스터 스폰 시작
    startSpawningMonsters();
  }

  // 1) 플레이어 등록
  players[socket.id] = {
    x: 0, y: 0,
    name: "???",    // 임시
    color: "#ffffff" // 임시
  };

  // 플레이어 정보(이름, 색깔) 등록
  socket.on("joinGame", (data) => {
    // data = { name, color }
    // => 이걸 players[socket.id]에 저장
    if (players[socket.id]) {
      players[socket.id].name = data.name;
      players[socket.id].color = data.color;
    }
    console.log(`플레이어 등록: ${socket.id}, 이름=${data.name}, 색=${data.color}`);
  });

  // 2) 클라이언트로부터 상태 업데이트 받기
  //    예: 플레이어가 키/마우스 입력을 통해 위치나 각도를 바꿨을 때 emit("playerMove", ...)
  socket.on("playerMove", (playerPos) => {
    // data = { playerPos, } (프론트엔드에서 보내준다고 가정)
    if (players[socket.id]) {
      // 잡은 조종석이 없으면 플레이어 이동
      if(!controlAssignments[socket.id]){
        players[socket.id].x = playerPos.x;
        players[socket.id].y = playerPos.y;
      }

    }
    // 이후 매 프레임마다 setInterval로 updateGameState를 보내므로,
    // 여기서는 따로 emit하지 않아도 됨(선택사항)
  });

  socket.on("spaceShipMove", (shipPos) => {
    if(controlAssignments[socket.id]!=="spaceship"){
      return;
    }
    
    ship.x = shipPos.x;
    ship.y = shipPos.y;
  });

  socket.on("turretMove", (data) => {
    // weaponAngle = newWeaponAngle
    if(data.type==="gun"){
      weaponAngle=data.angle;
    }else if(data.type==="missile"){
      missileAngle=data.angle;
    }
  });

  // 3) 총알 발사
  socket.on("shootBullet", (bulletData) => {
    if(controlAssignments[socket.id]!=="gun"){return;}
    // bulletData = { x, y, angleRad, speed, radius, ... }
    // 발사 위치/각도 계산은 클라이언트에서 한 뒤 서버로 전송
    bullets.push({
      ...bulletData,
      // 예: 서버에서 시간을 찍거나 ID를 붙일 수도
      ownerId: socket.id,
    });
  });

  //4) 미사일 발사
  socket.on("launchMissile",(missileData)=>{
    if(controlAssignments[socket.id]!=="missile"){return;}
    missiles.push({
      ...missileData,
      ownerId: socket.id,
    })
  })

  //5) 컨트롤 잡기
  socket.on("acquireControl",(data)=>{
    // 플레이어가 잡은 조종석 목록에 해당 조종권한 할당
    controlAssignments[socket.id]=data.controlType;

    seatStates[data.controlType].occupant=socket.id;
    //조종석 색깔을 잡은 플레이어 색깔로 변경
    if(players[socket.id]){
      seatStates[data.controlType].color=players[socket.id].color;
    }else{
      seatStates[data.controlType].color="#ffffff";
    }
    //console.log(`socket ${socket.id} is controlling: ${data.controlType}`);
  });

  //6) 컨트롤 놓기(해당 플레이어가 잡은 조종석 해제)
  socket.on("releaseControl",()=>{
    //console.log(`socket ${socket.id} released control`);
    controlAssignments[socket.id]=null;
    for(let seat in seatStates){
      if(seatStates[seat].occupant===socket.id){
        seatStates[seat].occupant=null;
        seatStates[seat].color="#ffffff";
      }
    }
  })

  // 6) 연결 해제
  socket.on("disconnect", () => {
    console.log("유저 접속 해제:", socket.id);
    // 플레이어 목록에서 제거
    delete players[socket.id];
    delete controlAssignments[socket.id];
  });
});

server.listen(5000, () => {
  console.log("서버가 5000번 포트에서 실행 중...");
});
