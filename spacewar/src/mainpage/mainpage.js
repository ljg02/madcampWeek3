// MainPage.jsx (예시)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 또는 다른 라우팅 방식

function MainPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [color, setColor] = useState("#ff0000");

    const handleStart = () => {
        // /world 라우트로 이동하면서 name, color를 query나 state로 전달
        navigate("/world", { state: { name, color } });
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
                SPACEWAR
            </h1>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                }}
            >
                <input
                    type="text"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: "500px",
                        height: "30px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                        width: "50px",
                        height: "50px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                />
            </div>
            <button
                onClick={handleStart}
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

export default MainPage;
