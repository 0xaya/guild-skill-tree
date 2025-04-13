"use client";

import React, { useState, useEffect } from "react";
import { Skill } from "../types/skill";
import { SkillNode } from "./SkillNode";
import { SkillConnection } from "./SkillConnection";
import { loadSkillsFromCSV, isSkillUnlocked, calculateTotalCost, SKILL_POSITIONS } from "../utils/skillUtils";
import { Button } from "./ui/Button";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "./ui/Icons";

export function SkillTreeSimulator() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{ [key: string]: number }>({
    core: 1,
  });
  const [guildRank, setGuildRank] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalCost, setTotalCost] = useState<{ coins: number; materials: { [key: string]: number } }>({
    coins: 0,
    materials: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(() => {
    if (window.innerWidth < 640) return 0.5;
    if (window.innerWidth < 768) return 0.6;
    return 1;
  });
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScale(0.5);
      } else if (window.innerWidth < 768) {
        setScale(0.6);
      } else {
        setScale(1);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const calculateCenterPosition = () => {
      const containerWidth = window.innerWidth < 640 ? window.innerWidth : window.innerWidth * 0.67;
      const containerHeight = window.innerWidth < 768 ? 500 : 800;
      const treeWidth = 800 * scale;
      const treeHeight = 800 * scale;

      if (window.innerWidth < 640) {
        return {
          x: (containerWidth - treeWidth) / 2 - 220,
          y: -50,
        };
      }

      return {
        x: 0,
        y: (containerHeight - treeHeight) / 2,
      };
    };

    setPosition(calculateCenterPosition());
  }, [scale]);

  useEffect(() => {
    const handleResize = () => {
      const calculateCenterPosition = () => {
        const containerWidth = window.innerWidth < 640 ? window.innerWidth : window.innerWidth * 0.67;
        const containerHeight = window.innerWidth < 768 ? 500 : 800;
        const treeWidth = 800 * scale;
        const treeHeight = 800 * scale;

        if (window.innerWidth < 640) {
          return {
            x: (containerWidth - treeWidth) / 2 - 220,
            y: -50,
          };
        }

        return {
          x: 0,
          y: (containerHeight - treeHeight) / 2,
        };
      };

      setPosition(calculateCenterPosition());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scale]);

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

    if (currentLevel === 1) {
      const hasActiveChildren = skills.some(
        (s: Skill) => s.parentIds?.includes(skillId) && (selectedSkills[s.id] || 0) > 0
      );

      if (hasActiveChildren) {
        setError("このスキルを下げるには、先に依存する子スキルを下げてください。");
        return;
      }
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
    const newRank = parseInt(e.target.value);
    setGuildRank(newRank);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 w-full h-full">
      {/* コントロールパネル */}
      <div className="w-full lg:w-1/5 rounded-lg p-4 overflow-y-auto max-h-[800px]">
        <div className="flex flex-col gap-y-10">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">ギルドランク {guildRank}</h3>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-background-dark rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{
                    width: `${((guildRank - 1) / 9) * 100}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={guildRank}
                onChange={handleRankChange}
                className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-10"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-2">必要コスト</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-text-primary">ギルドコイン</span>
                <span className="text-text-primary">×{totalCost.coins.toLocaleString()}</span>
              </div>
              {Object.entries(totalCost.materials).map(([material, count]) => (
                <div key={material} className="flex justify-between items-center">
                  <span className="text-text-primary">{material}</span>
                  <span className="text-text-primary">×{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleReset} fullWidth size="lg">
            リセット
          </Button>
        </div>
      </div>

      {/* スキルツリー表示部分 */}
      <div className="relative w-full lg:w-2/3 h-[450px] md:h-[800px] rounded-lg overflow-hidden lg:overflow-visible">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[70%] bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm  text-center">
            {error}
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              transform: `translate(${window.innerWidth < 640 ? position.x : 0}px, ${position.y}px)`,
              position: "relative",
              width: "800px",
              height: "800px",
            }}
          >
            {/* スキル接続線 */}
            {skills.map(skill => {
              if (!skill.parentIds) return null;
              return skill.parentIds.map(parentId => {
                const parent = skills.find(s => s.id === parentId);
                if (!parent) return null;
                return (
                  <SkillConnection
                    key={`${parentId}-${skill.id}`}
                    parent={parent}
                    child={skill}
                    isActive={selectedSkills[skill.id] > 0 && selectedSkills[parentId] > 0}
                  />
                );
              });
            })}

            {/* スキルノード */}
            {skills.map(skill => (
              <SkillNode
                key={skill.id}
                skill={skill}
                selectedLevel={selectedSkills[skill.id] || 0}
                maxLevel={skill.levels.length}
                isUnlocked={isSkillUnlocked(skill, selectedSkills, guildRank)}
                guildRank={guildRank}
                onClick={handleSkillClick}
                onRightClick={handleSkillRightClick}
              />
            ))}
          </div>
        </div>

        {/* ズームコントロール */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button onClick={handleZoomIn} title="拡大" icon={<ZoomInIcon />} />
          <Button onClick={handleZoomOut} title="縮小" icon={<ZoomOutIcon />} />
          <Button onClick={handleZoomReset} title="リセット" icon={<ResetIcon />} />
        </div>
      </div>
    </div>
  );
}
