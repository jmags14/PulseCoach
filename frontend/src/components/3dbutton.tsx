// 3DButton.tsx
import React, { useState } from "react";
import "../styles/3Dbutton.css";

interface Button3DProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button3D({ children, onClick }: Button3DProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      className={`btn-3d ${hover ? "hover" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <span className="btn-bg"></span>
      <span className="btn-face">{children}</span>
      <span className="btn-shadow"></span>
    </button>
  );
}