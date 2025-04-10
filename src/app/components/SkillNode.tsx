"use client";

import React, { useState } from "react";
import { Skill, CATEGORY_COLORS } from "../types/skill";

interface SkillNodeProps {
  skill: Skill;
  selectedLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  onClick: (id: string) => void;
  onRightClick: (id: string) => void;
}

// 16進数カラーコードをRGBAに変換するヘルパー関数
const hexToRgba = (hex: string, alpha: number): string => {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    // Ensure it's a valid hex color
    return `rgba(102, 102, 102, ${alpha})`; // Return a default gray if invalid
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 星アイコンを生成するヘルパー関数
const renderStars = (currentLevel: number, maxLevel: number) => {
  const stars = [];
  for (let i = 1; i <= maxLevel; i++) {
    stars.push(
      <span key={i} className={`mr-px ${i <= currentLevel ? "text-yellow-400" : "text-gray-500"}`}>
        {i <= currentLevel ? "★" : "☆"} {/* Use ☆ for unfilled */}
      </span>
    );
  }
  // 最大レベルが0または不明な場合は何も表示しない
  if (maxLevel <= 0) return null;
  // 星のサイズをさらに小さくする
  return <div className="flex text-[8px] mt-0.5 justify-center">{stars}</div>;
};

export const SkillNode: React.FC<SkillNodeProps> = ({
  skill,
  selectedLevel,
  maxLevel,
  isUnlocked,
  onClick,
  onRightClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const categoryColorHex = CATEGORY_COLORS[skill.category as keyof typeof CATEGORY_COLORS] || "#666666";
  const isActive = selectedLevel > 0;
  const isCore = skill.id === "core";

  // 背景色の透明度を全体的に下げる（未選択時0.15→0.12、選択時0.4→0.3）
  const nodeBgColor = isActive
    ? hexToRgba(categoryColorHex, 0.3) // アクティブ時の透明度を下げる
    : hexToRgba(categoryColorHex, 0.12); // 未取得時の透明度を下げる
  const nodeBorderColor = isActive ? categoryColorHex : "rgba(120, 120, 140, 0.4)";

  // ノードのスタイルを設定
  const nodeWidth = isCore ? 60 : 90; // コアは小さく、それ以外は幅広く
  const nodeHeight = isCore ? 60 : 45; // コアは正円に
  const nodeStyle: React.CSSProperties = {
    width: `${nodeWidth}px`,
    height: `${nodeHeight}px`,
    padding: isCore ? "0px" : "2px", // コアはパディングなし
    borderRadius: isCore ? "50%" : "6px", // コアは円形、それ以外は角丸
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    cursor: isUnlocked ? "pointer" : "not-allowed",
    position: "absolute",
    // 位置調整: 各ノードの幅に合わせてオフセット調整
    left: `-${nodeWidth / 2}px`,
    top: `-${nodeHeight / 2}px`,
    backgroundColor: nodeBgColor,
    opacity: isUnlocked ? 1 : 0.5,
    border: `${isCore ? "2px" : "1.5px"} solid ${nodeBorderColor}`,
    color: "#ffffff",
    fontSize: isCore ? "12px" : "10px", // コアは少し大きいフォント
    fontWeight: isCore ? "bold" : "normal",
    boxShadow: isActive
      ? `0 0 ${isCore ? "15px" : "8px"} ${categoryColorHex}70, 0 0 ${isCore ? "8px" : "4px"} ${categoryColorHex}50`
      : "none", // コアはより強いグロー効果
    transition: "all 0.2s ease-in-out",
    zIndex: isCore ? 15 : 10, // コアを少し前面に
    overflow: "hidden",
  };

  // ツールチップスタイル
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: `${nodeHeight / 2 + 5}px`, // topオフセットに合わせて調整
    left: "0",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(30, 30, 40, 0.95)",
    border: `1px solid ${categoryColorHex}80`,
    borderRadius: "8px",
    padding: "10px",
    zIndex: 100,
    width: "240px",
    color: "#ffffff",
    fontSize: "12px",
    display: showTooltip ? "block" : "none",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(2px)",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnlocked) {
      onClick(skill.id);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnlocked && selectedLevel > 0) {
      onRightClick(skill.id);
    }
  };

  // スキル名略称処理
  const skillNameDisplay = skill.name.replace(/クリティカル/g, "CRI");

  return (
    <div
      style={{
        position: "absolute",
        left: `${skill.x || 0}px`,
        top: `${skill.y || 0}px`,
        zIndex: showTooltip ? 20 : 10,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={nodeStyle} onClick={handleClick} onContextMenu={handleRightClick}>
        {/* スキル名表示 - コアは空にする */}
        {!isCore && <span className="leading-tight">{skillNameDisplay}</span>}

        {/* レベル表示 - コア以外でレベル1以上のスキルのみ表示 */}
        {!isCore && selectedLevel > 0 && <span className="text-[9px] opacity-70 ml-1">Lv{selectedLevel}</span>}

        {/* 星アイコン表示 - コア以外のスキルのみ */}
        {!isCore && renderStars(selectedLevel, maxLevel)}
      </div>

      {/* ツールチップ - コアにも表示するが内容を調整 */}
      {showTooltip && (
        <div style={tooltipStyle}>
          <div className="font-bold mb-1 text-[14px] text-pink-200">{skill.name}</div>
          <div className="text-xs mb-2 text-gray-300">{skill.description}</div>

          {/* コア以外のスキルのみレベル情報を表示 */}
          {!isCore && selectedLevel > 0 && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="text-xs font-bold text-green-300">現在: Lv{selectedLevel}</div>
              {/* 必要素材 */}
              {Object.keys(skill.levels[selectedLevel - 1]?.materials || {}).length > 0 && (
                <div className="mt-1">
                  <div className="text-xs text-gray-400">必要素材:</div>
                  <div className="grid grid-cols-2 gap-x-1 text-xs mt-1">
                    {Object.entries(skill.levels[selectedLevel - 1]?.materials || {}).map(([name, amount]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-gray-300">{name}</span>
                        <span className="text-green-300">x{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* コイン消費 */}
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-300">ギルドコイン:</span>
                <span className="text-yellow-300">{skill.levels[selectedLevel - 1]?.guildCoins || 0}</span>
              </div>
            </div>
          )}

          {/* 次のレベル情報 - コア以外で最大レベルに達していないスキルのみ */}
          {!isCore && selectedLevel < maxLevel && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="text-xs font-bold text-blue-300">次のレベル: Lv{selectedLevel + 1}</div>
              {/* 必要素材 */}
              {Object.keys(skill.levels[selectedLevel]?.materials || {}).length > 0 && (
                <div className="mt-1">
                  <div className="text-xs text-gray-400">必要素材:</div>
                  <div className="grid grid-cols-2 gap-x-1 text-xs mt-1">
                    {Object.entries(skill.levels[selectedLevel]?.materials || {}).map(([name, amount]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-gray-300">{name}</span>
                        <span className="text-blue-300">x{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* コイン消費 */}
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-300">ギルドコイン:</span>
                <span className="text-yellow-300">{skill.levels[selectedLevel]?.guildCoins || 0}</span>
              </div>
            </div>
          )}

          {/* ランク要件 - コア以外のスキルのみ */}
          {!isCore && (
            <div className="mt-2 text-xs flex justify-between">
              <span className="text-gray-400">必要ランク:</span>
              <span className={skill.requiredRank > 0 ? "text-orange-300" : "text-green-300"}>
                {skill.requiredRank}
              </span>
            </div>
          )}

          {/* 操作ガイド - コア以外のスキルのみ */}
          {!isCore && (
            <div className="text-[10px] mt-2 text-gray-500 text-center">
              左クリック: レベルアップ / 右クリック: レベルダウン
            </div>
          )}

          {/* コアスキル用の特別メッセージ */}
          {isCore && (
            <div className="text-[10px] mt-2 text-blue-300 text-center">
              ギルドスキルツリーの中心です。6つの基本スキルが拡がっています。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
