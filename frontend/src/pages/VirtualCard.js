import React, { useState } from "react";
import "./VirtualCard.css"; // optional if you want separate styles

export default function VirtualCard({ card }) {
  const [showBack, setShowBack] = useState(false);

  return (
    <div
      className={`virtual-card ${showBack ? "back" : "front"}`}
      onClick={() => setShowBack(!showBack)}
      style={{
        width: "300px",
        height: "180px",
        borderRadius: "15px",
        color: "#fff",
        fontFamily: "sans-serif",
        margin: "10px",
        padding: "20px",
        cursor: "pointer",
        backgroundColor: showBack ? "#333" : "#004d99",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        transition: "transform 0.6s",
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {!showBack ? (
        // Front side
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "14px", marginBottom: "10px" }}>VulnBank</div>
          <div style={{ fontSize: "18px", letterSpacing: "2px", marginBottom: "20px" }}>
            {card.card_no}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              Valid Thru
              <br />
              12/25
            </div>
            <div>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                alt="Visa"
                style={{ width: "50px" }}
              />
            </div>
          </div>
        </div>
      ) : (
        // Back side
        <div style={{ position: "relative" }}>
          <div
            style={{
              backgroundColor: "#000",
              height: "40px",
              marginBottom: "20px",
            }}
          ></div>
          <div
            style={{
              backgroundColor: "#fff",
              color: "#000",
              padding: "5px",
              width: "80%",
              margin: "0 auto",
              marginBottom: "20px",
            }}
          >
            CVV: {card.cvv}
          </div>
          <div style={{ fontSize: "12px", textAlign: "center" }}>
            Customer Service: 1800-123-456
          </div>
        </div>
      )}
    </div>
  );
}
