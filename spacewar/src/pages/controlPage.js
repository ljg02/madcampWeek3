// ControlsPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import KeyIcon from "../components/keyIcon"; // Key 컴포넌트 임포트

function ControlsPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/");
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
        backgroundImage:
          'url("https://static.vecteezy.com/system/resources/thumbnails/050/286/592/small_2x/a-starry-night-sky-with-a-long-line-of-stars-photo.jpg")',
        backgroundRepeat: "repeat",
        backgroundPosition: `center`,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>조작키 설명</h1>

      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "20px",
          borderRadius: "10px",
          textAlign: "left",
          maxWidth: "500px",
        }}
      >
        <h2>우주선 / 플레이어 이동</h2>
        <p>
          <KeyIcon label="W" /> <KeyIcon label="A" /> <KeyIcon label="S" /> <KeyIcon label="D" />
        </p>

        <h2>포탑 조준</h2>
        <p style={{ fontSize: "1.2rem" }}>
          <KeyIcon icon="fas fa-mouse-pointer" /> 마우스를 이동하여 포탑의 각도를 조절
        </p>

        <h2>총알 / 미사일 발사</h2>
        <p style={{ fontSize: "1.2rem" }}>
          <KeyIcon icon="fas fa-hand-pointer" /> 마우스 왼쪽 클릭으로 발사
        </p>

        <h2>조종석 잡기 / 놓기</h2>
        <p>
          <KeyIcon label="Q" /> <span>/</span> <KeyIcon label="E" />
        </p>
      </div>

      <button
        onClick={handleGoBack}
        style={{
          width: "160px",
          height: "40px",
          marginTop: "20px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        돌아가기
      </button>
    </div>
  );
}

export default ControlsPage;
