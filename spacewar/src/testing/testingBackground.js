import React, { useState, useEffect } from "react";

function InfiniteBackground() {
    // 배경 이미지를 움직이기 위한 오프셋(좌표)
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const [keys, setKeys] = useState({}); // Track pressed keys

    // Handle key press and release
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

    // 방향키 입력에 따른 배경 이동
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

    // 실제 렌더링
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                // 원하는 배경 이미지를 설정하세요.
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
            {/* 화면 중앙에 우주선 역할을 하는 원 */}
            <div
                style={{
                    width: 50,
                    height: 50,
                    backgroundColor: "red",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            />
        </div>
    );
}

export default InfiniteBackground;
