import React, { useState, useEffect } from "react";
import GameMap from "../monster/monster.js";

function World() {
  //0) 우주선 월드 좌표
  const [shipPos, setShipPos] = useState({ x: 0, y: 0});

  // ---------------------------
  // 1) 플레이어 (우주선 로컬 좌표계)
  // ---------------------------
  // 초기에 (0,0)을 사용
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });

  // ---------------------------
  // 2) 카메라 오프셋(화면 왼쪽 위의 글로벌 좌표, 화면 중심에 우주선이 위치)
  // ---------------------------
  // 플레이어를 화면 중앙에 두기 위해 매 렌더 때 계산할 예정
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // ---------------------------
  // 3) 입력 상태
  // ---------------------------
  const [keys, setKeys] = useState({});          // 키보드
  const [weaponAngle, setWeaponAngle] = useState(0); // 마우스 각도(도 단위)

  // ---------------------------
  // 4) 총알 목록(각 총알의 글로벌 좌표)
  // ---------------------------
  const [bullets, setBullets] = useState([]);

  // ---------------------------
  // 5) 우주선, 플레이어 크기
  // ---------------------------
  const SHIP_RADIUS = 150;   // 우주선 반지름
  const PLAYER_RADIUS = 25;  // 내부 원 플레이어 반지름
  const TURRET_WIDTH = 50;  //포탑 두께
  const TURRET_HEIGHT = 20; //포탑 길이

  // 화면 중앙(정중앙 픽셀 좌표)
  const [screenCenter, setScreenCenter] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // ---------------------------------------------------------
  // (A) 브라우저 창 크기 변화 감지 -> 화면 중앙 재계산
  // ---------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setScreenCenter({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------------------------------------------------
  // (B) 키 눌림/해제
  // ---------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: true }));
    };
    const handleKeyUp = (event) => {
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  //우주선 이동(방향키)
  useEffect(() => {
    const interval = setInterval(() => {
      let { x, y } = shipPos;
      const step = 10;
      // WASD
      if (keys['ArrowUp']) y -= step;
      if (keys['ArrowDown']) y += step;
      if (keys['ArrowLeft']) x -= step;
      if (keys['ArrowRight']) x += step;

      setShipPos({ x, y });
    }, 15);

    return () => clearInterval(interval);
  }, [keys, shipPos]);

  // ---------------------------------------------------------
  // (C) 플레이어어 이동 (우주선 로컬 좌표계)
  //     - W,S,A,D로 이동한다고 가정
  // ---------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      let { x, y } = playerPos;
      const step = 3;
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

      setPlayerPos({ x, y });
    }, 15);

    return () => clearInterval(interval);
  }, [keys, playerPos]);

  // ---------------------------------------------------------
  // (D) 카메라 오프셋 계산
  //     - 우주선을 화면 중앙에 고정시키기 위해
  //     - offset = screenCenter - shipPos
  // ---------------------------------------------------------
  useEffect(() => {
    setCameraOffset({
      x: shipPos.x - screenCenter.x,
      y: shipPos.y - screenCenter.y,
    });
  }, [shipPos, screenCenter]);

  // ---------------------------------------------------------
  // (E) 마우스 움직임에 따라 무기(포탑) 각도 계산
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

      setWeaponAngle(angleInDegrees);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ---------------------------------------------------------
  // (F) 마우스 클릭 -> 총알 발사 (월드 좌표)
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
        speed: 10,
        radius: 5,
      };

      setBullets((prev) => [...prev, newBullet]);
    };

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [weaponAngle, shipPos]);

  // ---------------------------------------------------------
  // (G) 총알 이동 (월드 좌표)
  // ---------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setBullets((prev) =>
        prev
          .map((bullet) => {
            const newX = bullet.x + bullet.speed * Math.cos(bullet.angleRad);
            const newY = bullet.y + bullet.speed * Math.sin(bullet.angleRad);
            return { ...bullet, x: newX, y: newY };
          })
          .filter((b) => {
            // 카메라를 벗어나면 제거
            if (b.x < cameraOffset.x || b.x > cameraOffset.x+screenCenter.x*2 || b.y < cameraOffset.y || b.y > cameraOffset.y+screenCenter.y*2) {
              return false;
            }
            return true;
          })
      );
    }, 15);

    return () => clearInterval(interval);
  }, [cameraOffset, screenCenter]);

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
      {/* (1) 우주선 (큰 원) */}
      <div
        style={{
          position: "absolute",
          width: SHIP_RADIUS * 2,
          height: SHIP_RADIUS * 2,
          borderRadius: "50%",
          backgroundColor: "rgba(0,255,0,0.2)",
          border: "2px solid green",
          left: shipPos.x - cameraOffset.x - SHIP_RADIUS,
          top: shipPos.y - cameraOffset.y - SHIP_RADIUS,
        }}
      >
        {/* (2) 우주선 내부 플레이어(빨간 원) */}
        <div
          style={{
            position: "absolute",
            width: PLAYER_RADIUS * 2,
            height: PLAYER_RADIUS * 2,
            borderRadius: "50%",
            backgroundColor: "red",
            left: playerPos.x - PLAYER_RADIUS + SHIP_RADIUS,
            top: playerPos.y - PLAYER_RADIUS + SHIP_RADIUS,
            // 위 코드 해석:
            // 우주선 내부 플레이어가 '우주선 중심'에 오도록 배치
            // (shipPos.x - playerPos.x)는 우주선에 상대적인 플레이어의 위치
          }}
        />

        {/* (3) 우주선 표면 포탑 */}
        <Turret angle={weaponAngle} shipRadius={SHIP_RADIUS} turretWidth={TURRET_WIDTH} turretHeight={TURRET_HEIGHT} />
      </div>

      {/* (4) 총알 렌더링 (월드 좌표 -> 화면) */}
      {bullets.map((bullet, i) => {
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: bullet.radius * 2,
              height: bullet.radius * 2,
              borderRadius: "50%",
              backgroundColor: "yellow",
              left: bullet.x - cameraOffset.x - bullet.radius,
              top: bullet.y - cameraOffset.y - bullet.radius,
            }}
          />
        );
      })}

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
        left: shipRadius - turretWidth / 2 + turretX,
        top: shipRadius - turretHeight / 2 + turretY,
        // 회전
        transform: `rotate(${angle}deg)`,
        transformOrigin: "center center",
      }}
    />
  );
}

export default World;
