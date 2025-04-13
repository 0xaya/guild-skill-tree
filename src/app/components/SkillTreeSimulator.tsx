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
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [totalStats, setTotalStats] = useState({
    str: 0,
    vit: 0,
    agi: 0,
    int: 0,
    dex: 0,
    mnd: 0,
    def: 0,
    mp: 0,
    hp: 0,
    atkSpd: 0,
    magicPower: 0,
    physicalPower: 0,
    expGetRate: 0,
    castSpd: 0,
    magicCri: 0,
    physicalCri: 0,
    magicCriMulti: 0,
    physicalCriMulti: 0,
  });

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
    const stats = calculateTotalStats();
    setTotalStats(stats);
  }, [skills, selectedSkills]);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === "undefined") return;

    const updateScale = () => {
      if (window.innerWidth < 640) {
        setScale(0.5);
      } else if (window.innerWidth < 768) {
        setScale(0.6);
      } else {
        setScale(1);
      }
    };

    const updatePosition = () => {
      const containerWidth = window.innerWidth < 640 ? window.innerWidth : window.innerWidth * 0.67;
      const containerHeight = window.innerWidth < 768 ? 500 : 800;
      const treeWidth = 800 * scale;
      const treeHeight = 800 * scale;

      if (window.innerWidth < 640) {
        setPosition({
          x: (containerWidth - treeWidth) / 2 - 220,
          y: -50,
        });
      } else {
        setPosition({
          x: 0,
          y: (containerHeight - treeHeight) / 2,
        });
      }
    };

    // 初期値の設定
    updateScale();
    updatePosition();

    // リサイズイベントのリスナーを設定
    window.addEventListener("resize", () => {
      updateScale();
      updatePosition();
    });

    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

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

    // レベル2以上を下げる場合は依存関係の確認をスキップ
    if (currentLevel > 1) {
      setSelectedSkills((prev: { [key: string]: number }) => ({
        ...prev,
        [skillId]: currentLevel - 1,
      }));
      setError(null);
      return;
    }

    // レベル1から0に下げる場合のみ依存関係を確認
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
    const newRank = parseInt(e.target.value);
    setGuildRank(newRank);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
    // ズームイン時に中心を維持
    const container = document.querySelector(".relative");
    if (container) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPosition(prev => ({
        x: prev.x + (centerX - prev.x) * 0.1,
        y: prev.y + (centerY - prev.y) * 0.1,
      }));
    }
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
    // ズームアウト時に中心を維持
    const container = document.querySelector(".relative");
    if (container) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPosition(prev => ({
        x: prev.x - (centerX - prev.x) * 0.1,
        y: prev.y - (centerY - prev.y) * 0.1,
      }));
    }
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

  // ステータス上昇の累計を計算する関数
  const calculateTotalStats = () => {
    const stats = {
      str: 0, // 腕力
      vit: 0, // 体力
      agi: 0, // 速さ
      int: 0, // 知力
      dex: 0, // 器用
      mnd: 0, // 精神
      def: 0, // 防御力
      mp: 0, // MP
      hp: 0, // HP
      atkSpd: 0, // 攻撃速度
      magicPower: 0, // 魔法スキル威力
      physicalPower: 0, // 物理スキル威力
      expGetRate: 0, // EXP獲得率
      castSpd: 0, // 詠唱速度
      magicCri: 0, // 魔法CRI発動率
      physicalCri: 0, // 物理CRI発動率
      magicCriMulti: 0, // 魔法CRI倍率
      physicalCriMulti: 0, // 物理CRI倍率
    };

    skills.forEach(skill => {
      const level = selectedSkills[skill.id] || 0;
      if (level > 0) {
        const levelData = skill.levels[level - 1];
        if (levelData) {
          stats.str += levelData.str || 0;
          stats.vit += levelData.vit || 0;
          stats.agi += levelData.agi || 0;
          stats.int += levelData.int || 0;
          stats.dex += levelData.dex || 0;
          stats.mnd += levelData.mnd || 0;
          stats.def += levelData.def || 0;
          stats.mp += levelData.mp || 0;
          stats.hp += levelData.hp || 0;
          stats.atkSpd += levelData.atkSpd || 0;
          stats.magicPower += levelData.magicPower || 0;
          stats.physicalPower += levelData.physicalPower || 0;
          stats.expGetRate += levelData.expGetRate || 0;
          stats.castSpd += levelData.castSpd || 0;
          stats.magicCri += levelData.magicCri || 0;
          stats.physicalCri += levelData.physicalCri || 0;
          stats.magicCriMulti += levelData.magicCriMulti || 0;
          stats.physicalCriMulti += levelData.physicalCriMulti || 0;
        }
      }
    });

    return stats;
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
              <div className="absolute inset-0 bg-background-light rounded-lg overflow-hidden">
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

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-2">パッシブスキル上昇率</h3>
            <div className="space-y-2">
              {totalStats.str > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">腕力</span>
                  <span className="text-text-primary">+{totalStats.str}%</span>
                </div>
              )}
              {totalStats.vit > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">体力</span>
                  <span className="text-text-primary">+{totalStats.vit}%</span>
                </div>
              )}
              {totalStats.agi > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">速さ</span>
                  <span className="text-text-primary">+{totalStats.agi}%</span>
                </div>
              )}
              {totalStats.int > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">知力</span>
                  <span className="text-text-primary">+{totalStats.int}%</span>
                </div>
              )}
              {totalStats.dex > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">器用</span>
                  <span className="text-text-primary">+{totalStats.dex}%</span>
                </div>
              )}
              {totalStats.mnd > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">精神</span>
                  <span className="text-text-primary">+{totalStats.mnd}%</span>
                </div>
              )}
              {totalStats.def > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">防御力</span>
                  <span className="text-text-primary">+{totalStats.def}%</span>
                </div>
              )}
              {totalStats.mp > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">MP</span>
                  <span className="text-text-primary">+{totalStats.mp}%</span>
                </div>
              )}
              {totalStats.hp > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">HP</span>
                  <span className="text-text-primary">+{totalStats.hp}%</span>
                </div>
              )}
              {totalStats.atkSpd > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">攻撃速度</span>
                  <span className="text-text-primary">+{totalStats.atkSpd}%</span>
                </div>
              )}
              {totalStats.magicPower > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">魔法スキル威力</span>
                  <span className="text-text-primary">+{totalStats.magicPower}%</span>
                </div>
              )}
              {totalStats.physicalPower > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">物理スキル威力</span>
                  <span className="text-text-primary">+{totalStats.physicalPower}%</span>
                </div>
              )}
              {totalStats.expGetRate > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">EXP獲得率</span>
                  <span className="text-text-primary">+{totalStats.expGetRate}%</span>
                </div>
              )}
              {totalStats.castSpd > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">詠唱速度</span>
                  <span className="text-text-primary">+{totalStats.castSpd}%</span>
                </div>
              )}
              {totalStats.magicCri > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">魔法CRI発動率</span>
                  <span className="text-text-primary">+{totalStats.magicCri}%</span>
                </div>
              )}
              {totalStats.physicalCri > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">物理CRI発動率</span>
                  <span className="text-text-primary">+{totalStats.physicalCri}%</span>
                </div>
              )}
              {totalStats.magicCriMulti > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">魔法CRI倍率</span>
                  <span className="text-text-primary">+{totalStats.magicCriMulti}%</span>
                </div>
              )}
              {totalStats.physicalCriMulti > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">物理CRI倍率</span>
                  <span className="text-text-primary">+{totalStats.physicalCriMulti}%</span>
                </div>
              )}
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
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: "center center",
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
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
