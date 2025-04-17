"use client";

import React, { useState } from "react";
import { Skill } from "../types/skill";
import { SKILL_COLORS, CATEGORY_MAPPING } from "../utils/skillUtils";

interface SkillNodeProps {
  skill: Skill;
  selectedLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  guildRank: number;
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
      <span key={i} className={`mr-px ${i <= currentLevel ? "text-yellow-400" : "text-white-500"}`}>
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
  guildRank,
  onClick,
  onRightClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const categoryColor = SKILL_COLORS[CATEGORY_MAPPING[skill.category] || "strength"];
  const isActive = selectedLevel > 0;
  const isCore = skill.id === "core";
  const isRankMet = guildRank >= skill.requiredRank;

  // 背景色の透明度を全体的に下げる
  const nodeBgColor = isActive
    ? `${categoryColor}80` // alpha: 0.8 (取得済み)
    : isRankMet
    ? `${categoryColor}30` // alpha: 0.3 (ランク条件を満たしている)
    : `${categoryColor}8`; // alpha: 0.08 (ランク条件を満たしていない)
  const nodeBorderColor = isActive
    ? categoryColor
    : isRankMet
    ? "rgba(120, 120, 140, 0.9)" // ランク条件を満たしている
    : "rgba(120, 120, 140, 0.3)"; // ランク条件を満たしていない

  // ノードのスタイルを設定
  const nodeWidth = isCore ? 60 : 90;
  const nodeHeight = isCore ? 60 : 45;
  const nodeStyle: React.CSSProperties = {
    width: `${nodeWidth}px`,
    height: `${nodeHeight}px`,
    padding: isCore ? "0px" : "2px",
    borderRadius: isCore ? "50%" : "6px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    position: "absolute",
    left: `-${nodeWidth / 2}px`,
    top: `-${nodeHeight / 2}px`,
    backgroundColor: nodeBgColor,
    opacity: isRankMet ? (isUnlocked ? 0.85 : 0.45) : 0.3,
    border: `${isCore ? "2px" : skill.type === "パッシブ" ? "1.5px" : "4px"} solid ${nodeBorderColor}`,
    color: "#ffffff",
    fontSize: isCore ? "12px" : "10px",
    fontWeight: isCore ? "bold" : "normal",
    boxShadow: isActive
      ? `0 0 ${isCore ? "15px" : "8px"} ${categoryColor}70, 0 0 ${isCore ? "8px" : "4px"} ${categoryColor}50`
      : "none",
    transition: "all 0.2s ease-in-out",
    zIndex: isCore ? 15 : 10,
    overflow: "hidden",
    cursor: !isCore && isUnlocked && isRankMet && selectedLevel === 0 ? "pointer" : "default",
  };

  // レベルアップ/レベルダウンボタンのスタイル
  const levelButtonStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: `2px solid ${categoryColor}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isUnlocked && isRankMet ? "pointer" : "not-allowed",
    fontSize: "13px",
    fontWeight: "700",
    color: `${categoryColor}`,
    opacity: isUnlocked && isRankMet ? 0.8 : 0.3,
    transition: "all 0.2s ease-in-out",
  };

  // ツールチップスタイル
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: `${nodeHeight / 2 + 5}px`, // topオフセットに合わせて調整
    left: "0",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(30, 30, 40, 0.8)",
    border: `1px solid ${categoryColor}80`,
    borderRadius: "8px",
    padding: "10px",
    zIndex: 100,
    width: "240px",
    color: "#ffffff",
    fontSize: "12px",
    fontFamily: "var(--font-inter)",
    display: showTooltip ? "block" : "none",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(3px)",
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
      <div
        style={nodeStyle}
        onClick={() => {
          if (!isCore && isUnlocked && isRankMet && selectedLevel === 0) {
            onClick(skill.id);
          }
        }}
        className={!isCore && isUnlocked && isRankMet && selectedLevel === 0 ? "cursor-pointer" : ""}
      >
        {/* スキル名表示 - コアは空にする */}
        {!isCore && <span className="leading-tight">{skillNameDisplay}</span>}

        {/* レベル表示とボタン - コア以外でレベル1以上のスキルのみ表示 */}
        {!isCore && selectedLevel > 0 && (
          <div className="flex items-center justify-center gap-[1rem] mb-[-3px]">
            <button
              style={levelButtonStyle}
              onClick={e => {
                e.stopPropagation();
                onRightClick(skill.id);
              }}
              disabled={!isUnlocked || !isRankMet}
            >
              -
            </button>
            <span className="text-[9px] opacity-70">Lv{selectedLevel}</span>
            <button
              style={levelButtonStyle}
              onClick={e => {
                e.stopPropagation();
                onClick(skill.id);
              }}
              disabled={!isUnlocked || !isRankMet || selectedLevel >= maxLevel}
            >
              +
            </button>
          </div>
        )}

        {/* 星アイコン表示 - コア以外のスキルのみ */}
        {!isCore && renderStars(selectedLevel, maxLevel)}
      </div>

      {/* ツールチップ - コアにも表示するが内容を調整 */}
      {showTooltip && (
        <div style={tooltipStyle}>
          {!isCore && <div className="font-bold mb-1 text-[16px] text-primary">{skill.name}</div>}
          <div className="text-xs mb-2 text-gray-300">
            {selectedLevel > 0 ? skill.levels[selectedLevel - 1].description : skill.levels[0].description}
          </div>

          {/* コア以外のスキルのみレベル情報を表示 */}
          {!isCore && selectedLevel > 0 && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="mt-1 text-xs font-bold text-secondary">現在: Lv{selectedLevel}</div>
              {/* 必要素材 */}
              {Object.keys(skill.levels[selectedLevel - 1]?.materials || {}).length > 0 && (
                <div className="mt-1">
                  {/* <div className="text-xs text-secondary">必要素材:</div> */}
                  <div className="grid grid-cols-2 gap-x-8 text-xs mt-1">
                    {Object.entries(skill.levels[selectedLevel - 1]?.materials || {}).map(([name, amount]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-gray-300">{name}</span>
                        <span className="text-gray-300">×{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* コイン消費 */}
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-300">ギルドコイン:</span>
                <span className="text-yellow-300">×{skill.levels[selectedLevel - 1]?.guildCoins || 0}</span>
              </div>
            </div>
          )}

          {/* 次のレベル情報 - コア以外で最大レベルに達していないスキルのみ */}
          {!isCore && selectedLevel < maxLevel && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="mt-1 text-xs font-bold text-secondary">次のレベル: Lv{selectedLevel + 1}</div>
              {/* 必要素材 */}
              {Object.keys(skill.levels[selectedLevel]?.materials || {}).length > 0 && (
                <div className="mt-2">
                  {/* <div className="text-xs text-secondary">必要素材:</div> */}
                  <div className="grid grid-cols-2 gap-x-8 text-xs mt-1">
                    {Object.entries(skill.levels[selectedLevel]?.materials || {}).map(([name, amount]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-gray-300">{name}</span>
                        <span className="text-gray-300">×{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* コイン消費 */}
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-300">ギルドコイン:</span>
                <span className="text-yellow-300">×{skill.levels[selectedLevel]?.guildCoins || 0}</span>
              </div>
            </div>
          )}

          {/* ランク要件 - コア以外のスキルのみ */}
          {!isCore && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="mt-1 text-xs">
                <div className="text-secondary font-bold mt-2">必要ランク:</div>
                <div className="grid grid-cols-5 gap-x-3 mt-1">
                  {skill.levels.map((level, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-300">Lv{index + 1}:</span>
                      <span className={level.requiredRank > guildRank ? "text-red-500 font-bold" : "text-white"}>
                        {level.requiredRank}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 操作ガイドを更新 */}
          {!isCore && (
            <div className="text-[10px] mt-2 text-gray-500">
              {selectedLevel === 0 ? "" : "+/- ボタンでレベルを調整"}
            </div>
          )}

          {/* コアスキル用の特別メッセージ */}
          {isCore && (
            <div className="text-[10px] mt-2 text-primary">
              ギルドスキルツリーの中心です。6つの1次スキルにつながっています。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
