import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import GameMap from "../monster/monster.js";

function World() {
  const [socket, setSocket] = useState(null);
  //0) 우주선 월드 좌표
  const [shipPos, setShipPos] = useState({ x: 0, y: 0});

  // ---------------------------
  // 1) 플레이어 (우주선 로컬 좌표계)
  // ---------------------------
  // 초기에 (0,0)을 사용
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const playerPosRef = useRef(playerPos);

  // ---------------------------
  // 2) 카메라 오프셋(화면 왼쪽 위의 글로벌 좌표, 화면 중심에 우주선이 위치)
  // ---------------------------
  // 플레이어를 화면 중앙에 두기 위해 매 렌더 때 계산할 예정
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // ---------------------------
  // 3) 입력 상태
  // ---------------------------
  const [keys, setKeys] = useState({});          // 키보드
  const keysRef = useRef(keys);
  const [weaponAngle, setWeaponAngle] = useState(0); // 마우스 각도(도 단위)

  // ---------------------------
  // 4) 총알 목록(각 총알의 글로벌 좌표)
  // ---------------------------
  const [bullets, setBullets] = useState([]);

  // ---------------------------
  // 5) 우주선, 플레이어 크기
  // ---------------------------
  const SHIP_RADIUS = 150;   // 우주선 반지름
  const PLAYER_RADIUS = 15;  // 내부 원 플레이어 반지름
  const TURRET_WIDTH = 50;  //포탑 두께
  const TURRET_HEIGHT = 20; //포탑 길이
  const BULLET_SPEED = 30;  //총알 속도
  const BULLET_RADIUS = 5;  //총알 반지름

  // 화면 중앙(정중앙 픽셀 좌표)
  const [screenCenter, setScreenCenter] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const canvasRef = useRef(null);

  // ---------------------------------------------------------
  // (A) 브라우저 창 크기 변화 감지 -> 화면 중앙 재계산
  // ---------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setScreenCenter({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      // canvas 크기도 다시 조정
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------------------------------------------------
  // (B) 키 눌림/해제
  // ---------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys((prevKeys) => {
        const newKeys = { ...prevKeys, [event.key]: true };
        keysRef.current = newKeys; // keysRef 업데이트
        return newKeys;
      });
    };
    const handleKeyUp = (event) => {
      setKeys((prevKeys) => {
        const newKeys = { ...prevKeys, [event.key]: false };
        keysRef.current = newKeys; // keysRef 업데이트
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ---------------------------------------------------------
  // (C) 우주선 이동 (글로벌 좌표계)
  //     - 방향키로 이동한다고 가정
  // ---------------------------------------------------------
  useEffect(() => {
    if (!socket) return; // socket이 null이면 return
    const interval = setInterval(() => {
      socket.emit("spaceShipMove", keysRef.current);
    }, 15);

    return () => clearInterval(interval);
  }, [socket]); // socket을 의존성 배열에 추가

  // ---------------------------------------------------------
  // (D) 플레이어 이동 (우주선 로컬 좌표계)
  //     - W,S,A,D로 이동한다고 가정
  // ---------------------------------------------------------
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);
  useEffect(() => {
    const interval = setInterval(() => {
      const keys = keysRef.current;
      let { x, y } = playerPosRef.current;
      const step = 5;
      // WASD
      if (keys["w"] || keys["W"]) y -= step;
      if (keys["s"] || keys["S"]) y += step;
      if (keys["a"] || keys["A"]) x -= step;
      if (keys["d"] || keys["D"]) x += step;

      // 우주선 경계 내부 플레이어 제한
      // (우주선 반지름 150 - 플레이어 반지름 25 = 125까지 가능)
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = SHIP_RADIUS - PLAYER_RADIUS;
      if (dist > maxDist) {
        const scale = maxDist / dist;
        x *= scale;
        y *= scale;
      }

      //setPlayerPos({ x, y });
      if(socket) {
        socket.emit("playerMove", { x, y });
      }
    }, 15);

    return () => clearInterval(interval);
  }, [socket]);

  // ---------------------------------------------------------
  // (E) 카메라 오프셋 계산
  //     - 우주선을 화면 중앙에 고정시키기 위해
  //     - offset = shipPos - screenCenter
  // ---------------------------------------------------------
  useEffect(() => {
    setCameraOffset({
      x: shipPos.x - screenCenter.x,
      y: shipPos.y - screenCenter.y,
    });
  }, [shipPos, screenCenter]);

  // ---------------------------------------------------------
  // (F) 마우스 움직임에 따라 무기(포탑) 각도 계산
  // ---------------------------------------------------------
  useEffect(() => {
    const handleMouseMove = (e) => {
      // (1) 화면(우주선) 중심 = (centerX, centerY)
      //     (우주선이 화면 정중앙에 고정이므로)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // (2) 마우스와 화면 중심 사이의 벡터 (dx, dy)
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // (3) 각도(라디안) 계산
      const angleInRadians = Math.atan2(dy, dx);

      // (4) 도(deg) 단위로 변환
      const angleInDegrees = (angleInRadians * 180) / Math.PI;

      if(socket) {
        socket.emit("turretMove", angleInDegrees);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socket]);

  // ---------------------------------------------------------
  // (G) 마우스 클릭 -> 총알 발사 (월드 좌표)
  // ---------------------------------------------------------
  useEffect(() => {
    const handleMouseDown = () => {
      const angleRad = (weaponAngle * Math.PI) / 180;
      // 포탑 끝에서 발사한다고 가정
      const turretDist = SHIP_RADIUS + TURRET_HEIGHT; // 우주선 표면보다 조금 바깥
      const bulletX = turretDist * Math.cos(angleRad);
      const bulletY = turretDist * Math.sin(angleRad);

      // bulletX, bulletY는 "우주선 중심 (0,0) 기준"
      // 우주선 월드 좌표가 (uwx, uwy)라면:
      const worldX = shipPos.x + bulletX;
      const worldY = shipPos.y + bulletY;

      // 총알의 발사 당시 글로벌 좌표
      const newBullet = {
        x: worldX,
        y: worldY,
        angleRad,
        speed: BULLET_SPEED,
        radius: BULLET_RADIUS,
        mileage: 0, //총알이 주행한 거리
      };

      //setBullets((prev) => [...prev, newBullet]);
      if(socket) {
        socket.emit("shootBullet", newBullet);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [weaponAngle, shipPos, socket]);

  //서버와 연결하고 매 프레임마다 객체들의 좌표 정보 받아오기
  useEffect(() => {
    // 1) 서버에 소켓 연결
    const newSocket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
      transports: ["websocket"], // 옵션
    });
    setSocket(newSocket);

    // 2) 매 프레임마다 서버가 보내주는 'updateGameState' 이벤트 수신
    newSocket.on("updateGameState", (data) => {
      setShipPos(data.shipPos);
      setPlayerPos(data.players[newSocket.id]);
      setWeaponAngle(data.weaponAngle);
      setBullets(data.bullets);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // ---------------------------------------------------------
  // (I) Canvas 드로잉 로직 - 총알 그리기
  // ---------------------------------------------------------
  useEffect(() => {
    let animationId;
    const ctx = canvasRef.current?.getContext("2d");

    // 캔버스가 없으면(draw할 수 없으면) 정지
    if (!ctx) return;

    const draw = () => {
      // 1) 캔버스 초기화 (지우기)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // 2) 총알 그리기
      bullets.forEach((bullet) => {
        // 캔버스 상 좌표 = bullet.x - cameraOffset.x, bullet.y - cameraOffset.y
        const drawX = bullet.x - cameraOffset.x;
        const drawY = bullet.y - cameraOffset.y;

        ctx.beginPath();
        ctx.arc(drawX, drawY, bullet.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "yellow";
        ctx.fill();
      });

      // (추가) 필요하다면 우주선, 플레이어도 여기서 그림
      // 우주선을 캔버스에 그리려면, 우주선 중심/반지름 정보를 사용:
      // - ctx.arc(shipX, shipY, SHIP_RADIUS, ...)

      // 3) 다음 프레임 요청
      animationId = requestAnimationFrame(draw);
    };

    draw();

    // cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [bullets, cameraOffset]);

  // ---------------------------------------------------------
  // 렌더링
  // ---------------------------------------------------------
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        // 배경 이미지를 보여주고 싶다면 아래처럼,
        // cameraOffset에 따라 backgroundPosition을 조정할 수 있음.
        backgroundImage:
          'url("https://static.vecteezy.com/system/resources/thumbnails/050/286/592/small_2x/a-starry-night-sky-with-a-long-line-of-stars-photo.jpg")',
        backgroundRepeat: "repeat",
        // 예: 배경 위치에 cameraOffset 반영 (원하는 로직에 맞춰 조정)
        backgroundPosition: `${-cameraOffset.x}px ${-cameraOffset.y}px`,
      }}
    >
      {/* <canvas> : 총알(및 기타 오브젝트) 드로잉 */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          // zIndex를 좀 높게 해주면,
          // 배경보다 앞으로 그려질 수 있음
          zIndex: 10,
        }}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* (1) 우주선 (큰 원) */}
      {/* 사실상 화면 중심에 고정 */}
      <div
        style={{
          position: "absolute",
          width: SHIP_RADIUS * 2,
          height: SHIP_RADIUS * 2,
          borderRadius: "50%",
          backgroundColor: "rgba(0,255,0,0.2)",
          border: "2px solid green",
          left: 0,
          top: 0,
          transform: `translate(
            ${shipPos.x - cameraOffset.x - SHIP_RADIUS}px,
            ${shipPos.y - cameraOffset.y - SHIP_RADIUS}px
          )`,
        }}
      >
        {/* (2) 우주선 내부 플레이어(빨간 원) */}
        <div
          style={{
            position: "absolute",
            width: PLAYER_RADIUS * 2,
            height: PLAYER_RADIUS * 2,
            borderRadius: "50%",
            backgroundColor: "pink",
            left: 0,
            top: 0,
            transform: `translate(
                ${playerPos.x - PLAYER_RADIUS + SHIP_RADIUS}px,
                ${playerPos.y - PLAYER_RADIUS + SHIP_RADIUS}px
              )`,
            // (shipPos.x - playerPos.x)는 우주선에 상대적인 플레이어의 위치
          }}
        />

        {/* (3) 우주선 표면 포탑 */}
        <Turret angle={weaponAngle} shipRadius={SHIP_RADIUS} turretWidth={TURRET_WIDTH} turretHeight={TURRET_HEIGHT} />
      </div>

      {/* 기존 총알 그리던 부분 */}

      {/* (5) GameMap 컴포넌트 (원하시는 방식으로 cameraOffset을 넘기면 됨) */}
      {/* 예: <GameMap offset={cameraOffset} /> */}
      {/* <GameMap offset={cameraOffset} /> */}
    </div>
  );
}

/** 우주선 표면 포탑 */
function Turret({ angle, shipRadius, turretWidth, turretHeight }) {
  // 도 -> 라디안
  const angleRad = (angle * Math.PI) / 180;
  // 포탑 위치(우주선 중심 기준)

  // 포탑이 우주선 바깥으로 약간 나가도록
  const turretDist = shipRadius + turretWidth / 2;

  const turretX = turretDist * Math.cos(angleRad);
  const turretY = turretDist * Math.sin(angleRad);

  return (
    <div
      style={{
        position: "absolute",
        width: `${turretWidth}px`,
        height: `${turretHeight}px`,
        backgroundColor: "blue",
        // 우주선 중심에 맞추기(우주선 하위 컴포넌트이므로 우주선에 상대적인 위치로 설정)
        left: 0,
        top: 0,
        // 회전
        transform: `
          translate(
            ${shipRadius - turretWidth / 2 + turretX}px,
            ${shipRadius - turretHeight / 2 + turretY}px
          )
          rotate(${angle}deg)
        `,
        transformOrigin: "center center",
      }}
    />
  );
}

export default World;
