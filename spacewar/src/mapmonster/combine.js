import React, { useState, useEffect } from "react";
import GameMap from '../monster/monster.js';
function Combine() {
    // 배경 이미지를 움직이기 위한 오프셋(좌표)
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // 우주선 내부에서의 플레이어 위치 (우주선 중심 기준)
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });

    const [keys, setKeys] = useState({}); // Track pressed keys

    //커서 각도 저장(degree)
    const [weaponAngle, setWeaponAngle] = useState(0);

    // 우주선 크기 설정 (지름 300px, 반지름 150px)
    const SHIP_RADIUS = 150;
    // 플레이어(작은 원) 크기 설정 (지름 50px, 반지름 25px)
    const PLAYER_RADIUS = 25;

    // 1) 키 눌림/해제 이벤트 등록
    useEffect(() => {
        const handleKeyDown = (event) => {
            setKeys((prevKeys) => ({ ...prevKeys, [event.key]: true }));
            console.log(event.key);
        };

        const handleKeyUp = (event) => {
            setKeys((prevKeys) => ({ ...prevKeys, [event.key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 2) 무한 배경 이동
    useEffect(() => {
        const handleMoveBackground = () => {
            const step = 10;
            if (keys['ArrowUp']) {
                setOffset((prev) => ({ ...prev, y: prev.y + step }));
            }
            if (keys['ArrowDown']) {
                setOffset((prev) => ({ ...prev, y: prev.y - step }));
            }
            if (keys['ArrowLeft']) {
                setOffset((prev) => ({ ...prev, x: prev.x + step }));
            }
            if (keys['ArrowRight']) {
                setOffset((prev) => ({ ...prev, x: prev.x - step }));
            }
        }
        const interval = setInterval(handleMoveBackground, 15);
        return () => clearInterval(interval);
    }, [keys]);

    // 3) 우주선 내부 플레이어 이동
    useEffect(() => {
        const movePlayer = () => {
            const step = 3;
            let newX = playerPos.x;
            let newY = playerPos.y;

            // 간단 예: WASD로 플레이어를 움직이도록 해봄
            if (keys["w"] || keys["W"]) {
                newY -= step;
            }
            if (keys["s"] || keys["S"]) {
                newY += step;
            }
            if (keys["a"] || keys["A"]) {
                newX -= step;
            }
            if (keys["d"] || keys["D"]) {
                newX += step;
            }

            // 우주선 내부 제한 (SHIP_RADIUS - PLAYER_RADIUS)
            // 원점(0,0)으로부터의 거리 계산
            const dist = Math.sqrt(newX * newX + newY * newY);
            const maxDist = SHIP_RADIUS - PLAYER_RADIUS;

            if (dist > maxDist) {
                // 원 밖으로 나가려 할 때, 원 경계 위로만 위치시킴
                const scale = maxDist / dist;
                newX *= scale;
                newY *= scale;
            }

            setPlayerPos({ x: newX, y: newY });
        };

        // 일정 간격(프레임)으로 플레이어 이동 갱신
        const interval = setInterval(movePlayer, 15);
        return () => clearInterval(interval);
    }, [keys, playerPos]);

    // (4) 마우스 움직임에 따라 무기 각도 계산
    useEffect(() => {
        const handleMouseMove = (e) => {
            // (1) 화면(우주선) 중심 = (centerX, centerY)
            //     (우주선이 화면 정중앙에 고정이라 가정)
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
      
            // (2) 마우스와 중심 사이의 벡터 (dx, dy)
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
      
            // (3) 각도(라디안) 계산
            const angleInRadians = Math.atan2(dy, dx);
      
            // (4) 도(deg) 단위로 변환
            const angleInDegrees = (angleInRadians * 180) / Math.PI;
      
            setWeaponAngle(angleInDegrees);
          };
      
          window.addEventListener("mousemove", handleMouseMove);
          return () => {
            window.removeEventListener("mousemove", handleMouseMove);
          };
    }, []);

    // 실제 렌더링
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                // 배경 이미지 설정
                backgroundImage: 'url("https://static.vecteezy.com/system/resources/thumbnails/050/286/592/small_2x/a-starry-night-sky-with-a-long-line-of-stars-photo.jpg")',
                // 배경 이미지를 가로세로로 반복
                backgroundRepeat: "repeat",
                // offset.x, offset.y 값을 사용하여 배경 위치를 이동
                backgroundPosition: `${offset.x}px ${offset.y}px`,
                // 우주선이 보이는 영역은 화면 전체
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* 우주선(큰 원) 컨테이너 */}
            <div
                style={{
                    width: SHIP_RADIUS * 2,
                    height: SHIP_RADIUS * 2,
                    backgroundColor: "rgba(0, 255, 0, 0.2)", // 보기 쉽게 연녹색 반투명
                    borderRadius: "50%",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    // 우주선 경계 확인용 보더
                    border: "2px solid green",
                }}
            >
                {/* 우주선 내부 플레이어(작은 원) */}
                <div
                    style={{
                        width: PLAYER_RADIUS * 2,
                        height: PLAYER_RADIUS * 2,
                        borderRadius: "50%",
                        backgroundColor: "red",
                        position: "absolute",
                        // 우주선 중심(0, 0)에서 playerPos.x, playerPos.y만큼 이동
                        top: "50%",
                        left: "50%",
                        transform: `translate(
                            calc(-50% + ${playerPos.x}px),
                            calc(-50% + ${playerPos.y}px)
                        )`,
                    }}
                />

                {/* 우주선 표면 포탑 */}
                <Turret angle={weaponAngle} shipRadius={SHIP_RADIUS} />
            </div>
            <GameMap offset={offset}/>
        </div>
    );
}

/** 별도 컴포넌트로 추출: 우주선 표면 포탑 */
function Turret({ angle, shipRadius }) {
    // (1) angle(도 단위)를 라디안으로 변환
    const angleInRad = (angle * Math.PI) / 180;
  
    // (2) 우주선 표면 위(x, y) 좌표
    //     - shipRadius만큼 떨어진 위치 = (r*cosθ, r*sinθ)
    //     - 조금 더 크게(바깥쪽)에 배치하고 싶다면 shipRadius + n
    //       조금 안쪽에 배치하고 싶다면 shipRadius - n
    const turretWidth = 50;
    const turretHeight = 20;
    const turretDist = shipRadius+turretWidth/2; // 우주선 둘레 위
    const turretX = turretDist * Math.cos(angleInRad);
    const turretY = turretDist * Math.sin(angleInRad);
  
    // (3) 포탑 스타일
    //     - 위치: 우주선 중심부터 (turretX, turretY)만큼 이동
    //     - 회전: angle(도 단위)
    //     - transformOrigin 등을 적절히 조정
    const turretStyle = {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: `${turretWidth}px`,   // 포탑 두께
      height: `${turretHeight}px`,  // 포탑 길이
      backgroundColor: "blue",
      //transformOrigin: "50% 90%", 
      transform: `
        translate(
          calc(-50% + ${turretX}px),
          calc(-50% + ${turretY}px)
        )
        rotate(${angle}deg)
      `,
      // 포탑 끝이 원 둘레 '바깥쪽'을 향하도록 설정
    };
  
    return <div style={turretStyle} />;
  }

export default Combine;
