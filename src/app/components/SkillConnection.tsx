"use client";

import React from "react";
import { Skill } from "../types/skill";

interface SkillConnectionProps {
  parent: Skill;
  child: Skill;
  isActive: boolean;
}

export const SkillConnection: React.FC<SkillConnectionProps> = ({ parent, child, isActive }) => {
  if (!parent.x || !parent.y || !child.x || !child.y) {
    return null;
  }

  // 線の太さと色を調整
  const lineWidth = isActive ? 2 : 1.5; // 少し太くする
  const lineColor = isActive
    ? "rgba(170, 210, 255, 0.6)" // アクティブ: 明るい水色（不透明度調整）
    : "rgba(120, 130, 150, 0.35)"; // 非アクティブ: 明るめのグレー

  // グラデーション色（線をより美しく見せる）
  const gradientStart = isActive ? "rgba(190, 230, 255, 0.5)" : "rgba(140, 150, 170, 0.25)";
  const gradientEnd = isActive ? "rgba(130, 180, 255, 0.5)" : "rgba(100, 110, 140, 0.25)";

  // ノードの半径を計算（コアとそれ以外で異なる）
  const isParentCore = parent.id === "core";
  const isChildCore = child.id === "core";
  const parentRadius = isParentCore ? 30 : 45; // コア: 60px / 2, 通常: 90px / 2
  const childRadius = isChildCore ? 30 : 45; // コア: 60px / 2, 通常: 90px / 2

  // 点間の距離とベクトルを計算
  const dx = child.x - parent.x;
  const dy = child.y - parent.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 正規化された方向ベクトル
  const nx = dx / distance;
  const ny = dy / distance;

  // ノードの端の座標を計算
  const startX = parent.x + nx * (isParentCore ? 30 : 40); // オフセット微調整
  const startY = parent.y + ny * (isParentCore ? 30 : 22); // オフセット微調整

  const endX = child.x - nx * (isChildCore ? 30 : 40); // オフセット微調整
  const endY = child.y - ny * (isChildCore ? 30 : 22); // オフセット微調整

  // 新しい線の長さと角度を計算
  const newDx = endX - startX;
  const newDy = endY - startY;
  const newLength = Math.sqrt(newDx * newDx + newDy * newDy);
  const angle = Math.atan2(newDy, newDx) * (180 / Math.PI);

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${newLength}px`,
    height: `${lineWidth}px`,
    background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`, // グラデーション
    transform: `rotate(${angle}deg)`,
    transformOrigin: "0 50%",
    zIndex: 1,
    boxShadow: isActive ? "0 0 4px rgba(170, 210, 255, 0.4)" : "none", // 影も調整
    borderRadius: "2px", // 線の端を丸める
  };

  return <div style={lineStyle} />;
};
