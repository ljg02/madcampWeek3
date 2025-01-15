// Key.jsx
import React from "react";

function KeyIcon({ label, icon }) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
        margin: "5px",
        padding: "0",
        border: "2px solid #fff",
        borderRadius: "5px",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "#fff",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "default",
        pointerEvents: "none",
      }}
    >
      {icon && <i className={icon} style={{ marginRight: label ? "5px" : "0" }}></i>}
      {label}
    </button>
  );
}

export default KeyIcon;
