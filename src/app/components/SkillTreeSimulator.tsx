"use client";

import React, { useState, useEffect } from "react";
import { Skill } from "../types/skill";
import { SkillNode } from "./SkillNode";
import { SkillConnection } from "./SkillConnection";
import { loadSkillsFromCSV, isSkillUnlocked, calculateTotalCost, SKILL_POSITIONS } from "../utils/skillUtils";
import { THEME_COLORS } from "../styles/theme";

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
    <div className="flex flex-col w-full h-full gap-4 p-4">
      <div className="flex flex-grow gap-4 flex-col">
        <div className="relative flex-[2] min-h-[600px] bg-background-medium rounded-lg overflow-hidden border border-background-light">
          {isLoading ? (
            <div className="flex justify-center items-center w-full h-full bg-background-dark/70 rounded-lg">
              <p>読み込み中...</p>
            </div>
          ) : (
            <>
              <div className="absolute bottom-4 left-4 z-50 flex gap-2">
                <button
                  onClick={handleZoomIn}
                  className="w-10 h-10 bg-background-medium/90 border border-background-light rounded flex justify-center items-center text-text-primary text-xl cursor-pointer"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-10 h-10 bg-background-medium/90 border border-background-light rounded flex justify-center items-center text-text-primary text-xl cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-3 h-10 bg-background-medium/90 border border-background-light rounded flex justify-center items-center text-text-primary text-sm cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div
                className="absolute w-[800px] h-[800px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x}px, ${position.y}px)`,
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

        <div className="flex-1 bg-background-medium rounded-lg p-4 flex flex-col gap-4 border border-background-light max-h-[calc(100vh-4rem)] overflow-y-auto">
          <h2 className="text-xl font-bold text-secondary mb-2">スキルシミュレーション</h2>

          <div className="flex flex-col gap-2 bg-background-light p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-base font-bold text-secondary">ギルドランク</h3>
              <span className="bg-secondary text-black rounded-full px-2.5 py-0.5 font-bold min-w-8 text-sm text-center">
                {guildRank}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={guildRank}
              onChange={handleRankChange}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted px-1">
              <span>1</span>
              <span>15</span>
            </div>
          </div>

          {error && (
            <div className="bg-accent-red/30 text-accent-red/80 p-3 rounded text-sm border border-accent-red">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 bg-background-light p-3 rounded">
            <h3 className="text-base font-bold text-tertiary">必要素材合計</h3>
            <div className="rounded p-1 max-h-[150px] overflow-y-auto">
              {Object.keys(totalCost.materials).length > 0 ? (
                <ul className="pl-1 text-sm grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1 gap-x-3">
                  {Object.entries(totalCost.materials).map(([material, quantity]) => (
                    <li key={material} className="flex justify-between">
                      <span className="text-secondary">{material}:</span>
                      <span className="text-tertiary font-medium">x{quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted pl-1">なし</p>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="bg-accent-red text-white py-2.5 rounded font-bold text-center mt-2 border border-accent-red cursor-pointer transition-colors duration-200 hover:bg-accent-red/90"
          >
            リセット
          </button>

          <div className="bg-background-light rounded p-3 text-sm mt-auto border border-background-light">
            <h4 className="font-bold mb-2 text-secondary text-base">操作方法</h4>
            <ul className="list-disc pl-5 text-text-secondary flex flex-col gap-1">
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
