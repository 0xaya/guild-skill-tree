"use client";

import React, { useState, useEffect } from "react";
import { Skill } from "../types/skill";
import { SkillNode } from "./SkillNode";
import { SkillConnection } from "./SkillConnection";
import { loadSkillsFromCSV, isSkillUnlocked, calculateTotalCost, SKILL_POSITIONS } from "../utils/skillUtils";

export function SkillTreeSimulator() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{ [key: string]: number }>({
    core: 1,
  });
  const [guildRank, setGuildRank] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalCost, setTotalCost] = useState<{ coins: number; materials: { [key: string]: number } }>({
    coins: 0,
    materials: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setIsLoading(true);
        const loadedSkills = await loadSkillsFromCSV();
        setSkills(loadedSkills);
        if (!loadedSkills.find(s => s.id === "core")) {
          console.error("Core skill not found in loaded skills!");
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading skills data:", err);
        setError("スキルデータの読み込みに失敗しました。");
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  useEffect(() => {
    const cost = calculateTotalCost(skills, selectedSkills);
    setTotalCost(cost);
  }, [skills, selectedSkills]);

  const handleSkillClick = (skillId: string) => {
    if (skillId === "core") {
      return;
    }

    const skill = skills.find((s: Skill) => s.id === skillId);
    if (!skill) return;

    const currentLevel = selectedSkills[skillId] || 0;
    const maxLevel = skill.levels.length;

    if (currentLevel >= maxLevel) return;

    if (!isSkillUnlocked(skill, selectedSkills, guildRank)) {
      const parentNames = skill.parentIds?.map(pId => skills.find(s => s.id === pId)?.name || pId).join(", ") || "なし";
      setError(
        `スキル「${skill.name}」はロックされています。必要ランク: ${skill.requiredRank}, 前提スキル: ${parentNames}`
      );
      return;
    }

    const nextLevelIndex = currentLevel;
    if (skill.levels[nextLevelIndex] && skill.requiredRank > guildRank) {
      setError(`スキル「${skill.name}」Lv${nextLevelIndex + 1} にはギルドランク ${skill.requiredRank} が必要です。`);
      return;
    }

    setSelectedSkills((prev: { [key: string]: number }) => ({
      ...prev,
      [skillId]: currentLevel + 1,
    }));
    setError(null);
  };

  const handleSkillRightClick = (skillId: string) => {
    if (skillId === "core") {
      return;
    }

    const currentLevel = selectedSkills[skillId] || 0;
    if (currentLevel <= 0) return;

    const hasActiveChildren = skills.some(
      (s: Skill) => s.parentIds?.includes(skillId) && (selectedSkills[s.id] || 0) > 0
    );

    if (hasActiveChildren) {
      setError("このスキルを下げるには、先に依存する子スキルを下げてください。");
      return;
    }

    setSelectedSkills((prev: { [key: string]: number }) => ({
      ...prev,
      [skillId]: currentLevel - 1,
    }));
    setError(null);
  };

  const handleReset = () => {
    setSelectedSkills({ core: 1 });
    setError(null);
  };

  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRank = parseInt(e.target.value, 10);
    if (!isNaN(newRank) && newRank >= 1 && newRank <= 15) {
      setGuildRank(newRank);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          gap: "1rem",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: "2",
            minHeight: "600px",
            backgroundColor: "rgba(30, 30, 40, 0.8)",
            borderRadius: "0.5rem",
            overflow: "hidden",
            border: "1px solid #444",
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: "0.5rem",
              }}
            >
              <p>読み込み中...</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "1rem",
                  zIndex: 50,
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <button
                  onClick={handleZoomIn}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: "rgba(50, 50, 60, 0.9)",
                    border: "1px solid #666",
                    borderRadius: "0.25rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: "1.25rem",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: "rgba(50, 50, 60, 0.9)",
                    border: "1px solid #666",
                    borderRadius: "0.25rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: "1.25rem",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
                <button
                  onClick={handleZoomReset}
                  style={{
                    padding: "0 0.75rem",
                    height: "2.5rem",
                    backgroundColor: "rgba(50, 50, 60, 0.9)",
                    border: "1px solid #666",
                    borderRadius: "0.25rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>

              <div
                style={{
                  position: "absolute",
                  width: "800px",
                  height: "800px",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease-out",
                }}
              >
                {skills.map(skill =>
                  (skill.parentIds || []).map(parentId => {
                    const parent = skills.find(s => s.id === parentId);
                    if (!parent || !skill) return null;

                    const isActive = (selectedSkills[skill.id] || 0) > 0 && (selectedSkills[parentId] || 0) > 0;

                    return (
                      <SkillConnection
                        key={`${parentId}-${skill.id}`}
                        parent={parent}
                        child={skill}
                        isActive={isActive}
                      />
                    );
                  })
                )}

                {skills.map(skill => (
                  <SkillNode
                    key={skill.id}
                    skill={skill}
                    selectedLevel={selectedSkills[skill.id] || 0}
                    maxLevel={skill.levels.length}
                    isUnlocked={isSkillUnlocked(skill, selectedSkills, guildRank)}
                    onClick={handleSkillClick}
                    onRightClick={handleSkillRightClick}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            flex: "1",
            backgroundColor: "rgba(30, 30, 40, 0.8)",
            borderRadius: "0.5rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            border: "1px solid #444",
            maxHeight: "calc(100vh - 4rem)",
            overflowY: "auto",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#e879f9", marginBottom: "0.5rem" }}>
            スキルシミュレーション
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              padding: "0.75rem",
              borderRadius: "0.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#f9a8d4",
                }}
              >
                ギルドランク
              </h3>
              <span
                style={{
                  backgroundColor: "#f9a8d4",
                  color: "black",
                  borderRadius: "9999px",
                  padding: "0.1rem 0.6rem",
                  fontWeight: "bold",
                  minWidth: "2rem",
                  fontSize: "0.875rem",
                  textAlign: "center",
                }}
              >
                {guildRank}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={guildRank}
              onChange={handleRankChange}
              style={{
                width: "100%",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "#9ca3af",
                padding: "0 0.25rem",
              }}
            >
              <span>1</span>
              <span>15</span>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.3)",
                color: "#fecaca",
                padding: "0.75rem",
                borderRadius: "0.25rem",
                fontSize: "0.875rem",
                border: "1px solid rgba(239, 68, 68, 0.5)",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              padding: "0.75rem",
              borderRadius: "0.25rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                color: "#86efac",
              }}
            >
              必要素材合計
            </h3>
            <div
              style={{
                borderRadius: "0.25rem",
                padding: "0.25rem 0",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              {Object.keys(totalCost.materials).length > 0 ? (
                <ul
                  style={{
                    paddingLeft: "0.25rem",
                    fontSize: "0.875rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "0.25rem 0.75rem",
                  }}
                >
                  {Object.entries(totalCost.materials).map(([material, quantity]) => (
                    <li key={material} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#d1d5db" }}>{material}:</span>
                      <span style={{ color: "#86efac", fontWeight: "500" }}>x{quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#9ca3af", paddingLeft: "0.25rem" }}>なし</p>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "0.6rem",
              borderRadius: "0.25rem",
              fontWeight: "bold",
              textAlign: "center",
              marginTop: "0.5rem",
              border: "1px solid #f87171",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = "#ef4444")}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = "#dc2626")}
          >
            リセット
          </button>

          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "0.25rem",
              padding: "0.75rem",
              fontSize: "0.875rem",
              marginTop: "auto",
              border: "1px solid #444",
            }}
          >
            <h4
              style={{
                fontWeight: "bold",
                marginBottom: "0.5rem",
                color: "#f9a8d4",
                fontSize: "1rem",
              }}
            >
              操作方法
            </h4>
            <ul
              style={{
                listStyleType: "disc",
                paddingLeft: "1.25rem",
                color: "#d1d5db",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <li>左クリック: スキルレベルアップ</li>
              <li>右クリック: スキルレベルダウン</li>
              <li>マウスホバー: スキル詳細表示</li>
              <li>ズームボタン/ホイール: 拡大縮小</li>
              <li>ギルドランク変更: スキル解放条件の変更</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
