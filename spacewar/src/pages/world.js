import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

import monster1 from "./spacemonster1.png";
import monster2 from "./spacemonster2.png";
import monster3 from "./spacemonster3.png";
import monster4 from "./spacemonster4.png";
import monster5 from "./spacemonster5.png";
import monster6 from "./spacemonster6.png";
import monster7 from "./spacemonster7.png";

import { useLocation, useNavigate } from "react-router-dom";

function World() {
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    //0) 우주선 월드 좌표
    const [ship, setShip] = useState({ x: 0, y: 0, hp: 10, radius: 150 });
    const shipRef = useRef(ship);
    // 우주선 피격 이펙트 상태
    const [shipHit, setShipHit] = useState([]);

    // ---------------------------
    // 1) 플레이어 (우주선 로컬 좌표계)
    // ---------------------------
    // 초기에 (0,0)을 사용
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const playerPosRef = useRef(playerPos);
    // 모든 플레이어
    const [players, setPlayers] = useState({});

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
    const [missileAngle, setMissileAngle] = useState(180);
    const [shieldAngle, setShieldAngle]=useState(90);

    // ---------------------------
    // 4) 총알 목록(각 총알의 글로벌 좌표)
    // ---------------------------
    const [bullets, setBullets] = useState([]);
    const lastBulletFireRef = useRef(0);

    // ---------------------------
    //  미사일 목록(글로벌 좌표)
    // ---------------------------
    const [missiles, setMissiles] = useState([]);
    // 미사일 마지막 발사 시점(타임스탬프) 저장용
    const lastMissileFireRef = useRef(0);

    // 몬스터 목록
    // const [monsters, setMonsters] = useState([]);
    // 몬스터 이미지 목록
    const [monsterImagesLoaded,setMonsterImagesLoaded]=useState([]);

    //컨트롤 룸
    const CONTROL_ROOMS = [
        { type: "spaceship", x: 0, y: 50, radius: 40 },
        { type: "gun", x: 100, y: 0, radius: 30 },
        { type: "missile", x: -100, y: 0, radius: 30 },
        { type: "shield", x: 0, y:-100, radius: 30},
    ];

    // 클라이언트가 잡고 있는 조종석
    const [currentControl, setCurrentControl] = useState(null);
    const currentControlRef = useRef(currentControl);

    //컨트롤 이펙트(조종석에 닿았을 때 뜨는 on/off 이펙트)
    //(on : on/off 글씨, visible: 보이게 할지)
    const [switchStates, setSwitchStates] = useState({
        spaceship: { on: false, visible: false },
        gun: { on: false, visible: false },
        missile: { on: false, visible: false },
        shield: {on: false, visible: false},
    });

    //자리 색깔
    const [seatStates, setSeatStates] = useState({
        spaceship: { occupant: null, color: "#ffffff" },
        gun: { occupant: null, color: "#ffffff" },
        missile: { occupant: null, color: "#ffffff" },
    });


    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }


    // 몬스터 목록(각 몬스터들의 글로벌 좌표)
    const [monsters, setMonsters] = useState([]);
    // 몬스터 처치 이펙트 상태
    const [monsterBulletHit, setMonsterBulletHit] = useState([]);
    // 몬스터 처치 이펙트 상태
    const [missileEffect, setMissileEffect] = useState([]);
    const [monsterDead, setMonsterDead] = useState([]);

    // ---------------------------
    // 5) 우주선, 플레이어 크기
    // ---------------------------
    const SHIP_RADIUS = ship.radius;   // 우주선 반지름
    const PLAYER_RADIUS = 15;  // 내부 원 플레이어 반지름
    const TURRET_WIDTH = 40;  //포탑 길이
    const TURRET_HEIGHT = 20; //포탑 두께
    const M_TURRET_WIDTH = 20; //포탑 길이
    const M_TURRET_HEIGHT = 30; //포탑 두께
    const BULLET_SPEED = 30;  //총알 속도
    const BULLET_RADIUS = 5;  //총알 반지름
    const BULLET_COOLDOWN = 200;    //총알 쿨다운 시간
    const MISSILE_BLAST_RADIUS = 70; //미사일 폭발 반경
    const MISSILE_COOLDOWN = 1000;  // 미사일 쿨다운 시간 (ms 단위)

    // 화면 중앙(정중앙 픽셀 좌표)
    const [screenCenter, setScreenCenter] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    });

    const canvasRef = useRef(null);


    const location = useLocation();
    // 메인 페이지에서 넘어온 name, color
    const { name, color } = location.state || { name: "Unknown", color: "#ff0000" };

    //점수
    const [score, setScore] = useState(0);

    const monsterImages = [monster1, monster2, monster3, monster4, monster5, monster6, monster7];

    useEffect(()=>{
        const loadImages=()=>{
            const images=monsterImages.map((src)=>{
                const img=new Image();
                img.src=src;
                return img;
            });
            setMonsterImagesLoaded(images);
        };
        loadImages();
    },[]);

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
        shipRef.current = ship;
    }, [ship]);
    useEffect(() => {
        if (!socket) return; // socket이 null이면 return
        const interval = setInterval(() => {
            // spaceship 조종석을 잡고 있지 않으면 이동시키지 않도록
            if(currentControlRef.current !== "spaceship") return;

            const keys = keysRef.current;
            // let { x, y } = shipRef.current || { x: 0, y: 0 };
            // const step = 10;
            // // WASD
            // if (keys["w"] || keys["W"]) y -= step;
            // if (keys["s"] || keys["S"]) y += step;
            // if (keys["a"] || keys["A"]) x -= step;
            // if (keys["d"] || keys["D"]) x += step;

            let x = 0;
            let y = 0;
            const step = 10;
            if (keys["w"] || keys["W"]) y -= step;
            if (keys["s"] || keys["S"]) y += step;
            if (keys["a"] || keys["A"]) x -= step;
            if (keys["d"] || keys["D"]) x += step;
            

            if(socket) {
                socket.emit("spaceShipMove", { x, y });
            }
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
            // 무언가 잡고 있으면 플레이어 이동이 일어나지 않도록
            if(currentControlRef.current) return;

            const keys = keysRef.current;
            // let { x, y } = playerPosRef.current || { x: 0, y: 0 };
            // const step = 5;
            // // WASD
            // if (keys["w"] || keys["W"]) y -= step;
            // if (keys["s"] || keys["S"]) y += step;
            // if (keys["a"] || keys["A"]) x -= step;
            // if (keys["d"] || keys["D"]) x += step;

            let x = 0;
            let y = 0;
            const step = 5;
            if (keys["w"] || keys["W"]) y -= step;
            if (keys["s"] || keys["S"]) y += step;
            if (keys["a"] || keys["A"]) x -= step;
            if (keys["d"] || keys["D"]) x += step;

            // 우주선 경계 내부 플레이어 제한
            // (우주선 반지름 150 - 플레이어 반지름 25 = 125까지 가능)
            // const dist = Math.sqrt(x * x + y * y);
            // const maxDist = ship.radius - PLAYER_RADIUS;
            // if (dist > maxDist) {
            //     const scale = maxDist / dist;
            //     x *= scale;
            //     y *= scale;
            // }

            //setPlayerPos({ x, y });
            if (socket) {
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
            x: ship.x - screenCenter.x,
            y: ship.y - screenCenter.y,
        });
    }, [ship, screenCenter]);

    // ---------------------------------------------------------
    // (F) 마우스 움직임에 따라 무기(포탑) 각도 계산
    // ---------------------------------------------------------
    useEffect(() => {
        const handleMouseMove = (e) => {
            if(currentControlRef.current !== "gun" && currentControlRef.current !== "missile" && currentControlRef.current!=="shield") return;

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

            if (socket) {
                socket.emit("turretMove", {
                    type: currentControlRef.current,
                    angle: angleInDegrees,
                });
            }
            // socket.emit("turretMove", angleInDegrees);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [socket]);

    //우클릭 시 정보창 노출 방지
    useEffect(() => {
        const disableContextMenu = (e) => e.preventDefault();
        window.addEventListener("contextmenu", disableContextMenu);
        return () => window.removeEventListener("contextmenu", disableContextMenu);
    }, []);

    // ---------------------------------------------------------
    // (G) 마우스 클릭 -> 총알 또는 미사일 발사 (월드 좌표)
    // ---------------------------------------------------------
    useEffect(() => {
        const handleMouseDown = (e) => {
            const angleRad = (weaponAngle * Math.PI) / 180;
            const angleRadm = (missileAngle * Math.PI) / 180;

            // 포탑 끝에서 발사한다고 가정
            const turretDist = ship.radius + TURRET_HEIGHT; // 우주선 표면보다 조금 바깥
            const bulletX = turretDist * Math.cos(angleRad);
            const bulletY = turretDist * Math.sin(angleRad);

            const missileX = turretDist * Math.cos(angleRadm);
            const missileY = turretDist * Math.sin(angleRadm);

            // bulletX, bulletY는 "우주선 중심 (0,0) 기준"
            // 우주선 월드 좌표가 (uwx, uwy)라면:
            const worldX = ship.x + bulletX;
            const worldY = ship.y + bulletY;

            const worldmX = ship.x + missileX;
            const worldmY = ship.y + missileY;

            // 발사 시점(쿨다운 계산용)
            const now = Date.now();
            // 투사체 발사 당시 글로벌 좌표 계산
            switch (currentControlRef.current) {
                case "gun":
                    // 이전 발사 시점으로부터 COOLDOWN(ms) 미만이면 발사 안 함
                    if (now - lastBulletFireRef.current < BULLET_COOLDOWN) {
                        // 쿨다운 중이므로 무시
                        return;
                    }

                    // 쿨다운 해제 -> 발사 처리
                    lastBulletFireRef.current = now;

                    const newBullet = {
                        x: worldX,
                        y: worldY,
                        angleRad,
                        speed: BULLET_SPEED,
                        radius: BULLET_RADIUS,
                        mileage: 0,
                    };
                    if (socket) {
                        socket.emit("shootBullet", newBullet);
                    }
                    //console.log("fired bullet from gun control");
                    break;
                case "missile":
                    // 이전 발사 시점으로부터 COOLDOWN(ms) 미만이면 발사 안 함
                    if (now - lastMissileFireRef.current < MISSILE_COOLDOWN) {
                        // 쿨다운 중이므로 무시
                        return;
                    }

                    // 쿨다운 해제 -> 발사 처리
                    lastMissileFireRef.current = now;

                    const newMissile = {
                        x: worldmX,
                        y: worldmY,
                        angleRadm,
                        speed: BULLET_SPEED / 3,
                        radius: BULLET_RADIUS * 2,
                        mileage: 0,
                        exploded: false,
                        explodeRadius: MISSILE_BLAST_RADIUS,
                    };
                    if (socket) {
                        socket.emit("launchMissile", newMissile);
                    }
                    //console.log("fired missile from missiel control");
                    break;
            }
        };

        window.addEventListener("mousedown", handleMouseDown);
        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
        };
    }, [weaponAngle, missileAngle, ship, socket]);

    //서버와 연결하고 매 프레임마다 객체들의 좌표 정보 받아오기
    useEffect(() => {
        // 1) 서버에 소켓 연결
        const newSocket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
            transports: ["websocket"], // 옵션
        });
        setSocket(newSocket);

        // 2) 연결되면 이름, 색상 정보를 서버에 보냄
        newSocket.on("connect", () => {
            newSocket.emit("joinGame", { name, color });
        });

        // 3) 매 프레임마다 서버가 보내주는 'updateGameState' 이벤트 수신
        newSocket.on("updateGameState", (data) => {
            const monstersWithImages = data.monsters.map((monster) => {
                return {
                    ...monster,
                    imageIndex: monster.imageIndex ?? Math.floor(Math.random() * monsterImagesLoaded.length),
                };
            });
        
            setMonsters(monstersWithImages);
            setShip(data.ship);
            const currentPlayerPos = data.players[newSocket.id] || { x: 0, y: 0 };
            setPlayerPos(currentPlayerPos);
            setPlayers(data.players);
            setWeaponAngle(data.weaponAngle);
            setMissileAngle(data.missileAngle);
            setShieldAngle(data.shieldAngle);
            setBullets(data.bullets);
            setMissiles(data.missiles);
            setMonsters(data.monsters);
            setScore(data.score);
            setSeatStates(data.seatStates);
        });

        // 몬스터 피격 이벤트 수신
        newSocket.on("monsterBulletHit", (monsterBulletHitEffect) => {
            const newEffect = {
                x: monsterBulletHitEffect.x,
                y: monsterBulletHitEffect.y,
                startTime: Date.now(),
                duration: 300, // 피격 이펙트 지속 시간 (밀리초 단위)
                radius: monsterBulletHitEffect.radius,
            };
            setMonsterBulletHit((prev) => [...prev, newEffect]);
        });

        newSocket.on("missileExplode", (explodedMissile) => {
            const newEffect = {
                x: explodedMissile.x,
                y: explodedMissile.y,
                startTime: Date.now(),
                duration: 700,
                radius: explodedMissile.radius,
            };
            setMissileEffect((prev) => [...prev, newEffect]);
        })

        // 몬스터 폭발 이벤트 수신
        newSocket.on("monsterDead", (monsterDeadEffect) => {
            const newEffect = {
                x: monsterDeadEffect.x,
                y: monsterDeadEffect.y,
                startTime: Date.now(),
                duration: 500, // 폭발 이펙트 지속 시간 (밀리초 단위)
                radius: monsterDeadEffect.radius,
            };
            setMonsterDead((prev) => [...prev, newEffect]);
        });

        // 우주선 피격 이벤트 수신
        newSocket.on("shipHit", () => {
            const newEffect = {
                x: ship.x,
                y: ship.y,
                startTime: Date.now(),
                duration: 200, // 데미지 이펙트 지속 시간 (밀리초 단위)
                radius: ship.radius,
            };
            setShipHit((prev) => [...prev, newEffect]);
        });

        // 게임오버 이벤트 수신
        newSocket.on("gameover", (finalScore) => {
            navigate("/gameover", { state: { score: finalScore } });
        })

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // 수명이 다한 이펙트 제거
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setMonsterBulletHit((prev) =>
                prev.filter((monsterBulletHitEffect) => now - monsterBulletHitEffect.startTime < monsterBulletHitEffect.duration)
            );
            setMissileEffect((prev) =>
                prev.filter((missileEffect) => now - missileEffect.startTime < missileEffect.duration)
            );
            setMonsterDead((prev) =>
                prev.filter((monsterDeadEffect) => now - monsterDeadEffect.startTime < monsterDeadEffect.duration)
            );
            setShipHit((prev) =>
                prev.filter((shipHitEffect) => now - shipHitEffect.startTime < shipHitEffect.duration)
            );
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------------
    // (H) Canvas 드로잉 로직
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

            //2-1) 미사일 그리기
            missiles.forEach((missile) => {
                //화면상의 로컬 좌표계로 변경
                const drawX = missile.x - cameraOffset.x;
                const drawY = missile.y - cameraOffset.y;

                ctx.beginPath();
                ctx.arc(drawX, drawY, missile.radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = "rgba(255, 100, 0, 1)";
                ctx.fill();
            });

            // 3) 몬스터 그리기
            monsters.forEach((monster) => {
                const drawX = monster.x - cameraOffset.x - monster.radius;
                const drawY = monster.y - cameraOffset.y - monster.radius;

                const imageIndex = monster.imageIndex ?? 0;
                const monsterImage = monsterImagesLoaded[imageIndex];

                if (monsterImage instanceof HTMLImageElement) {
                    ctx.drawImage(
                        monsterImage,
                        drawX,
                        drawY,
                        monster.radius * 2,
                        monster.radius * 2
                    );
                } else {
                        // Fallback: Draw a green square if the image is not loaded
                    ctx.fillStyle = "green";
                    ctx.fillRect(drawX, drawY, monster.radius * 2, monster.radius * 2);
                }
                //몬스터 hp바
                ctx.fillStyle = "red";
                const hpBarWidth = (monster.hp / 3) * (monster.radius * 2);
                ctx.fillRect(drawX, drawY - 10, hpBarWidth, 5);
            });

            //4) 조종석 그리기
            CONTROL_ROOMS.forEach(room => {
                const globalX = ship.x + room.x;
                const globalY = ship.y + room.y;

                const drawX = globalX - cameraOffset.x;
                const drawY = globalY - cameraOffset.y;

                // on/off 글씨 그리기
                if (switchStates[room.type]?.visible) {
                    const isOn = switchStates[room.type].on;

                    const switchX = drawX;
                    const switchY = drawY - (room.radius + 20);

                    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                    ctx.fillRect(switchX - 35, switchY - 15, 70, 20);

                    ctx.fillStyle = "white";
                    ctx.font = "14px Arial";
                    ctx.fillText(isOn ? "Press E" : "Press Q", switchX - 25, switchY);
                }

                const seatColor = seatStates[room.type]?.color || "#ffffff";
                const dx = playerPos.x - room.x;
                const dy = playerPos.y - room.y;

                const dist = Math.sqrt(dx * dx + dy * dy);
                let seatAlpha = 0.4;
                if (dist <= room.radius && seatColor === "#ffffff") {
                    // 조종석에 닿으면 진해지도록
                    seatAlpha = 0.7;
                } else {
                    seatAlpha = 0.4;
                }

                const seatColorWithAlpha = hexToRGBA(seatColor, seatAlpha);

                ctx.beginPath();
                ctx.arc(drawX, drawY, room.radius, 0, 2 * Math.PI);
                ctx.fillStyle = seatColorWithAlpha;
                ctx.fill();

                ctx.fillStyle = "yellow";
                ctx.font = "12px Orbitron, sans-serif"; // 커스텀 폰트 사용
                ctx.fillText(room.type, drawX - 10, drawY - room.radius - 5);
            });

            // 몬스터 피격 이펙트 그리기
            monsterBulletHit.forEach((monsterBulletHitEffect) => {
                const drawX = monsterBulletHitEffect.x - cameraOffset.x;
                const drawY = monsterBulletHitEffect.y - cameraOffset.y;
                const progress = (Date.now() - monsterBulletHitEffect.startTime) / monsterBulletHitEffect.duration;
                if (progress < 1) {
                    const alpha = (1 - progress) * 0.5; // 점점 투명해짐
                    const size = monsterBulletHitEffect.radius + progress * 10; // 점점 커짐

                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`; // 빨간색
                    ctx.arc(drawX, drawY, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });

            //미사일 폭발 이펙트 그리기
            missileEffect.forEach((missileEffect) => {
                const drawX = missileEffect.x - cameraOffset.x;
                const drawY = missileEffect.y - cameraOffset.y;
                const progress = (Date.now() - missileEffect.startTime) / missileEffect.duration;
                if (progress < 1) {
                    const alpha = (1 - progress) * 0.6;
                    const size = missileEffect.radius + progress * 20;

                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                    ctx.arc(drawX, drawY, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            })

            // 몬스터 처치 이펙트 그리기
            monsterDead.forEach((monsterDeadEffect) => {
                const drawX = monsterDeadEffect.x - cameraOffset.x;
                const drawY = monsterDeadEffect.y - cameraOffset.y;
                const progress = (Date.now() - monsterDeadEffect.startTime) / monsterDeadEffect.duration;
                if (progress < 1) {
                    const alpha = (1 - progress) * 0.7; // 점점 투명해짐
                    const size = monsterDeadEffect.radius + progress * 15; // 점점 커짐

                    ctx.beginPath();
                    ctx.fillStyle = `rgba(100, 255, 0, ${alpha})`; // 연두색
                    ctx.arc(drawX, drawY, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });

            // 4) 플레이어 그리기
            Object.values(players).forEach((player) => {
                const drawX = player.x + ship.x - cameraOffset.x;
                const drawY = player.y + ship.y - cameraOffset.y;

                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(drawX, drawY, PLAYER_RADIUS, 0, 2 * Math.PI);
                ctx.fill();

                // 이름 표시
                ctx.fillStyle = "#fff";
                ctx.font = "14px Arial";
                ctx.fillText(player.name, drawX - 10, drawY - 20);
            });

            // 5) 우주선 그리기
            const drawShipX = ship.x - cameraOffset.x;
            const drawShipY = ship.y - cameraOffset.y;

            //   ctx.fillStyle = "rgba(0,255,0,0.2)";
            //   ctx.beginPath();
            //   ctx.arc(drawShipX, drawShipY, SHIP_RADIUS, 0, 2*Math.PI);
            //   ctx.fill();

            // 6) 우주선 hp
            ctx.fillStyle = "red";
            const hpBarWidth = (ship.hp / 10) * (ship.radius * 2);
            ctx.fillRect(drawShipX - ship.radius, drawShipY + ship.radius + 10, hpBarWidth, 10);

            // 우주선 피격 이펙트 그리기
            shipHit.forEach((shipHitEffect) => {
                const drawX = ship.x - cameraOffset.x;
                const drawY = ship.y - cameraOffset.y;
                const progress = (Date.now() - shipHitEffect.startTime) / shipHitEffect.duration;
                if (progress < 1) {
                    const alpha = (1 - progress) * 0.6; // 점점 투명해짐
                    const size = shipHitEffect.radius; // 크기 고정

                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;  //빨간색
                    ctx.arc(drawX, drawY, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });

            // ctx.beginPath();
            // ctx.arc(
            //     drawShipX,
            //     drawShipY,
            //     ship.radius + 10,
            //     shieldAngle,
            //     shieldAngle,
            // );
            // ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
            // ctx.lineWidth = 8;
            // ctx.stroke();

            // 7) Score 표시 (왼쪽 위)
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // 반투명 배경
            ctx.fillRect(20, 20, 150, 40); // 배경 사각형

            ctx.fillStyle = "white"; // 텍스트 색상
            ctx.font = "20px Orbitron, sans-serif"; // 커스텀 폰트 사용
            ctx.fillText(`Score: ${score}`, 30, 45); // 텍스트 위치

            // (추가) 필요하다면 우주선, 플레이어도 여기서 그림
            // 우주선을 캔버스에 그리려면, 우주선 중심/반지름 정보를 사용:
            // - ctx.arc(shipX, shipY, SHIP_RADIUS, ...)

            // 8) 다음 프레임 요청
            animationId = requestAnimationFrame(draw);
        };

        draw();

        // cleanup
        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [bullets, missiles, monsters, cameraOffset]);

    // ---------------------------------------------------------
    // 컨트롤 다가가기
    // ---------------------------------------------------------
    useEffect(() => {
        const checkProximity = () => {
            let { x, y } = playerPosRef.current || { x: 0, y: 0 };
            CONTROL_ROOMS.forEach((room) => {
                const dx = x - room.x;
                const dy = y - room.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= room.radius && !currentControlRef.current) {
                    setSwitchStates((prev) => {
                        if (prev[room.type].visible && !prev[room.type].on) {
                            return prev;
                        }
                        return {
                            ...prev,
                            [room.type]: { ...prev[room.type], on: false, visible: true },
                        };
                    });
                } else if (dist > room.radius) {
                    setSwitchStates((prev) => {
                        if (!prev[room.type].visible) { return prev; }
                        return {
                            ...prev,
                            [room.type]: { ...prev[room.type], visible: false },
                        };
                    });
                }
            });
        };

        const interval = setInterval(checkProximity, 15);
        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------------
    // 컨트롤 잡기
    // ---------------------------------------------------------
    useEffect(() => {
        currentControlRef.current = currentControl;
    }, [currentControl]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            let { x, y } = playerPosRef.current || { x: 0, y: 0 };
            // 잡기
            if (event.key === "q" && !currentControlRef.current) {
                CONTROL_ROOMS.forEach((room) => {
                    const dx = x - room.x;
                    const dy = y - room.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // 플레이어가 조종실 반경 내에 있으면
                    if (dist <= room.radius) {
                        setCurrentControl(room.type);
                        //console.log(`Entered the ${room.type} control room`);
                        setSwitchStates((prev) => ({
                            ...prev,
                            [room.type]: { on: true, visible: true },
                        }));

                        setTimeout(() => {
                            setSwitchStates((prev) => ({
                                ...prev,
                                [room.type]: { on: true, visible: false },
                            }));
                        }, 500);

                        if (socket) {
                            socket.emit("acquireControl", { controlType: room.type });
                        }
                    }
                });
            }
            // 놓기
            else if (event.key === "e" && currentControlRef.current) {
                setSwitchStates((prev) => ({
                    ...prev,
                    [currentControlRef.current]: { on: false, visible: true },
                }));

                setTimeout(() => {
                    setSwitchStates((prev) => ({
                        ...prev,
                        [currentControlRef.current]: { ...prev[currentControlRef.current], visible: false },
                    }));
                }, 500);

                setCurrentControl(null);
                if (socket) {
                    socket.emit("releaseControl");
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [socket]);


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
                // style={{
                //     position: "absolute",
                //     width: ship.radius * 2,
                //     height: ship.radius * 2,
                //     borderRadius: "50%",
                //     backgroundColor: "rgba(0,255,0,0.2)",
                //     border: "2px solid green",
                //     left: 0,
                //     top: 0,
                //     transform: `translate(
                //         ${ship.x - cameraOffset.x - ship.radius}px,
                //         ${ship.y - cameraOffset.y - ship.radius}px
                //     )`,
                // }}
                style={{
                position: "absolute",
                width: ship.radius * 2,
                height: ship.radius * 2,
                borderRadius: "50%",
                background: `
                    radial-gradient(circle at center, rgba(0, 255, 85, 0.14), rgba(0, 255, 85, 0.25) 70%)
                `,
                border: "4px solid rgb(0, 255, 85)", // Neon border
                boxShadow: "0 0 20px rgb(43, 255, 0), 0 0 40px rgba(9, 255, 0, 0.4)", // Neon glow
                left: 0,
                top: 0,
                transform: `translate(
                    ${ship.x - cameraOffset.x - ship.radius}px,
                    ${ship.y - cameraOffset.y - ship.radius}px
                )`,
                animation: "pulse 2s infinite alternate", // Pulse effect
                }}
            >
                {/* (2) 우주선 내부 플레이어(빨간 원) */}

                {/* (3) 우주선 표면 포탑 */}
                <MissileTurret angle={missileAngle} shipRadius={SHIP_RADIUS} turretWidth={M_TURRET_WIDTH} turretHeight={M_TURRET_HEIGHT} />
                <Turret angle={weaponAngle} shipRadius={ship.radius} turretWidth={TURRET_WIDTH} turretHeight={TURRET_HEIGHT} />
                <ShieldTurret angle={shieldAngle} shipRadius={SHIP_RADIUS} turretLength={10} turretThickness={100}/>
            </div>

            {/* 기존 총알 그리던 부분 */}
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
                backgroundColor: "rgb(100, 100, 100)",
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
function MissileTurret({ angle, shipRadius, turretWidth, turretHeight }) {
    // 도 -> 라디안
    const angleRadm = (angle * Math.PI) / 180;
    // 포탑 위치(우주선 중심 기준)

    // 포탑이 우주선 바깥으로 약간 나가도록
    const turretDist = shipRadius + turretWidth / 2;

    const turretX = turretDist * Math.cos(angleRadm);
    const turretY = turretDist * Math.sin(angleRadm);

    return (
        <div
            style={{
                position: "absolute",
                width: `${turretWidth}px`,
                height: `${turretHeight}px`,
                backgroundColor: "rgb(150, 150, 150)",
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

function ShieldTurret({ angle, shipRadius, turretLength, turretThickness }) {
    // Convert angle to radians
    const angleRads = (angle * Math.PI) / 180;

    // Turret distance from the center of the spaceship
    const turretDist = shipRadius + turretThickness / 4;

    // Calculate the turret's position
    const turretX = turretDist * Math.cos(angleRads);
    const turretY = turretDist * Math.sin(angleRads);

    return (
        <div
            style={{
                position: "absolute",
                width: `${turretLength}px`,
                height: `${turretThickness}px`,
                backgroundColor: "cyan",
                borderRadius: `${turretThickness / 2}px`,
                left: 0,
                top: 0,
                transform: `
                    translate(
                        ${shipRadius - turretLength / 2 + turretX}px,
                        ${shipRadius - turretThickness / 2 + turretY}px
                    )
                    rotate(${angle}deg)
                `,
                transformOrigin: "center center",
            }}
        />
    );
}


export default World;
