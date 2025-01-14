// Gameover.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // 또는 다른 라우팅 방식
import Game from "../testing/testingClient";

function Gameover() {
    const navigate = useNavigate();
    const location = useLocation();
    const { score } = location.state || { score: 10 };
    console.log('score: ', location.state);

    const handleReStart = () => {
        navigate("/main");
    };

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // 배경 이미지를 보여주고 싶다면 아래처럼,
                // cameraOffset에 따라 backgroundPosition을 조정할 수 있음.
                backgroundImage:
                    'url("https://static.vecteezy.com/system/resources/thumbnails/050/286/592/small_2x/a-starry-night-sky-with-a-long-line-of-stars-photo.jpg")',
                backgroundRepeat: "repeat",
                // 예: 배경 위치에 cameraOffset 반영 (원하는 로직에 맞춰 조정)
                backgroundPosition: `${window.innerWidth / 2}px ${window.innerHeight / 2}px`,
            }}
        >
            <h1
                style={{
                    fontStyle: "bord",
                    color: "white",
                }}
            >
                score: {score}
            </h1>
            <button
                onClick={handleReStart}
                style={{
                    width: "200px",
                    height: "30px",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: "10px",
                    cursor: "pointer",
                }}
            >
                게임 시작
            </button>
        </div>
    );
}

export default Gameover;
