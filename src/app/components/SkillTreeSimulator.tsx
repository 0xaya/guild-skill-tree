"use client";

import React, { useState, useEffect } from "react";
import { Skill } from "../types/skill";
import { Character, GlobalState } from "../types/character";
import { SkillNode } from "./SkillNode";
import { SkillConnection } from "./SkillConnection";
import {
  loadSkillsFromCSV,
  isSkillUnlocked,
  calculateTotalCost,
  calculateRemainingMaterials,
  SKILL_POSITIONS,
} from "../utils/skillUtils";
import { loadGlobalState, saveGlobalState } from "../utils/storageUtils";
import { useCharacter } from "../contexts/CharacterContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "./ui/Icons";
import { Dialog } from "./ui/Dialog";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { batchSaveCharacterData } from "../utils/syncUtils";

export function SkillTreeSimulator() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [totalCost, setTotalCost] = useState<{ coins: number; materials: { [key: string]: number } }>({
    coins: 0,
    materials: {},
  });
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
  const [rankChangeDialogOpen, setRankChangeDialogOpen] = useState(false);
  const [pendingRankChange, setPendingRankChange] = useState<number | null>(null);
  const [affectedSkills, setAffectedSkills] = useState<
    { id: string; name: string; currentLevel: number; newLevel: number }[]
  >([]);
  const [displayRank, setDisplayRank] = useState<number>(5);
  const [originalRank, setOriginalRank] = useState<number>(5);
  const [isRankChanging, setIsRankChanging] = useState<boolean>(false);
  const [tempRank, setTempRank] = useState<number | null>(null);

  const { currentCharacter, updateCharacter } = useCharacter();
  const { user, isAuthenticated } = useAuth();
  const selectedSkills = currentCharacter?.skillTree.selectedSkills || { core: 1 };
  const acquiredSkills = currentCharacter?.skillTree.acquiredSkills || {};

  // 残り必要素材を計算
  const remainingMaterials = calculateRemainingMaterials(skills, selectedSkills, acquiredSkills);

  // スキルデータの読み込み
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

  // コストとステータスの計算
  useEffect(() => {
    const cost = calculateTotalCost(skills, selectedSkills);
    setTotalCost(cost);
    const stats = calculateTotalStats();
    setTotalStats(stats);
  }, [skills, selectedSkills]);

  // 初期スケールの自動調整
  useEffect(() => {
    if (!containerRef || !skills.length) return;

    const adjustInitialScale = () => {
      const containerWidth = containerRef.clientWidth;
      const containerHeight = containerRef.clientHeight;
      const treeWidth = 800; // スキルツリーの基本サイズ
      const treeHeight = 800;

      // モバイルデバイスの場合は画面幅の90%に合わせる
      const isMobile = window.innerWidth < 768;
      const targetWidth = isMobile ? containerWidth * 0.9 : containerWidth;
      const targetHeight = isMobile ? containerHeight * 0.9 : containerHeight;

      // コンテナのサイズに基づいて適切なスケールを計算
      const scaleX = targetWidth / treeWidth;
      const scaleY = targetHeight / treeHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // 1を超えないように制限

      setScale(newScale);
      setPosition({ x: 0, y: 0 });
    };

    adjustInitialScale();
    window.addEventListener("resize", adjustInitialScale);

    return () => {
      window.removeEventListener("resize", adjustInitialScale);
    };
  }, [containerRef, skills]);

  // 現在のキャラクターのギルドランクを表示用の状態に反映
  useEffect(() => {
    console.log("useEffect guildRank changed:", {
      newGuildRank: currentCharacter?.guildRank,
      displayRank,
      originalRank,
      isRankChanging,
      tempRank,
    });
    if (currentCharacter?.guildRank) {
      setDisplayRank(currentCharacter.guildRank);
      if (!isRankChanging) {
        setOriginalRank(currentCharacter.guildRank);
      }
    }
  }, [currentCharacter?.guildRank, isRankChanging]);

  const handleSkillClick = (skillId: string) => {
    if (skillId === "core") return;

    const skill = skills.find((s: Skill) => s.id === skillId);
    if (!skill) return;

    const currentLevel = selectedSkills[skillId] || 0;
    const maxLevel = skill.levels.length;

    if (currentLevel >= maxLevel) return;

    if (!isSkillUnlocked(skill, selectedSkills, currentCharacter?.guildRank || 5)) {
      const parentNames = skill.parentIds?.map(pId => skills.find(s => s.id === pId)?.name || pId).join(", ") || "なし";
      setError(
        `スキル「${skill.name}」はロックされています。必要ランク: ${skill.requiredRank}, 前提スキル: ${parentNames}`
      );
      return;
    }

    const nextLevelIndex = currentLevel;
    if (skill.levels[nextLevelIndex] && skill.requiredRank > (currentCharacter?.guildRank || 5)) {
      setError(`スキル「${skill.name}」Lv${nextLevelIndex + 1} にはギルドランク ${skill.requiredRank} が必要です。`);
      return;
    }

    if (currentCharacter) {
      const updatedCharacter = {
        ...currentCharacter,
        skillTree: {
          ...currentCharacter.skillTree,
          selectedSkills: {
            ...selectedSkills,
            [skillId]: currentLevel + 1,
          },
        },
      };
      updateCharacter(currentCharacter.id, updatedCharacter);
    }
    setError(null);
  };

  const handleSkillRightClick = (skillId: string) => {
    if (skillId === "core") return;

    const currentLevel = selectedSkills[skillId] || 0;
    if (currentLevel <= 0) return;

    const acquiredLevel = acquiredSkills[skillId] || 0;
    // acquiredLevel > currentLevel - 1 の場合は両方下げる
    if (acquiredLevel > currentLevel - 1) {
      if (currentCharacter) {
        const updatedCharacter = {
          ...currentCharacter,
          skillTree: {
            ...currentCharacter.skillTree,
            selectedSkills: {
              ...selectedSkills,
              [skillId]: currentLevel - 1,
            },
            acquiredSkills: {
              ...acquiredSkills,
              [skillId]: currentLevel - 1,
            },
          },
        };
        updateCharacter(currentCharacter.id, updatedCharacter);
      }
      setError(null);
      return;
    }

    // レベル1から0に下げる場合のみ依存関係を確認
    if (currentLevel === 1) {
      const hasActiveChildren = skills.some(
        (s: Skill) => s.parentIds?.includes(skillId) && (selectedSkills[s.id] || 0) > 0
      );
      if (hasActiveChildren) {
        setError("このスキルを未取得にするには、先に依存する子スキルを未取得状態にしてください。");
        return;
      }
    }

    // 通常のレベルダウン（selectedSkillsのみ下げる）
    if (currentCharacter) {
      const updatedCharacter = {
        ...currentCharacter,
        skillTree: {
          ...currentCharacter.skillTree,
          selectedSkills: {
            ...selectedSkills,
            [skillId]: currentLevel - 1,
          },
          acquiredSkills: {
            ...acquiredSkills,
          },
        },
      };
      updateCharacter(currentCharacter.id, updatedCharacter);
    }
    setError(null);
  };

  const handleReset = () => {
    if (currentCharacter) {
      const updatedCharacter: Character = {
        ...currentCharacter,
        skillTree: {
          selectedSkills: { core: 1 },
          acquiredSkills: { core: 1 },
        },
      };
      updateCharacter(currentCharacter.id, updatedCharacter);
    }
    setError(null);
  };

  // ランク条件を満たさないスキルを特定する関数
  const findAffectedSkills = (newRank: number) => {
    if (!currentCharacter) return [];

    const affected: { id: string; name: string; currentLevel: number; newLevel: number }[] = [];
    skills.forEach(skill => {
      const currentLevel = selectedSkills[skill.id] || 0;
      if (currentLevel > 0) {
        // 現在のレベルで必要なランクを確認
        const levelData = skill.levels[currentLevel - 1];
        if (levelData && levelData.requiredRank > newRank) {
          // 新しいランクで取得可能な最大レベルを計算
          let maxAllowedLevel = 0;
          for (let i = 0; i < skill.levels.length; i++) {
            if (skill.levels[i].requiredRank <= newRank) {
              maxAllowedLevel = i + 1;
            } else {
              break;
            }
          }

          affected.push({
            id: skill.id,
            name: skill.name,
            currentLevel: currentLevel,
            newLevel: maxAllowedLevel,
          });
        }
      }
    });
    return affected;
  };

  const handleRankChange = (newRank: number) => {
    console.log("handleRankChange called with:", { newRank, currentRank: currentCharacter?.guildRank });
    // 表示用の状態を即時更新
    setDisplayRank(newRank);

    const currentRank = currentCharacter?.guildRank || 5;
    if (newRank < currentRank) {
      // 最初のランク変更時にoriginalRankを設定
      if (!isRankChanging) {
        setOriginalRank(currentRank);
        setIsRankChanging(true);
      }
      const affected = findAffectedSkills(newRank);
      if (affected.length > 0) {
        setAffectedSkills(affected);
        setPendingRankChange(newRank);
        setRankChangeDialogOpen(true);
        return;
      }
    }
    applyRankChange(newRank);
  };

  const handleRankChangeCancel = () => {
    console.log("handleRankChangeCancel called:", {
      currentGuildRank: currentCharacter?.guildRank,
      displayRank,
      originalRank,
      isRankChanging,
      tempRank,
    });
    // キャンセル時は元のランクに戻す
    setDisplayRank(originalRank);
    setRankChangeDialogOpen(false);
    setAffectedSkills([]);
    setPendingRankChange(null);
    setIsRankChanging(false);
    setTempRank(null);
  };

  const applyRankChange = (newRank: number) => {
    console.log("applyRankChange called with:", {
      newRank,
      currentGuildRank: currentCharacter?.guildRank,
      isRankChanging,
      tempRank,
    });
    if (!currentCharacter) return;

    // 影響を受けるスキルのレベルを調整
    const updatedSelectedSkills = { ...selectedSkills };
    affectedSkills.forEach(skill => {
      updatedSelectedSkills[skill.id] = skill.newLevel;
    });

    const updatedCharacter = {
      ...currentCharacter,
      guildRank: newRank,
      skillTree: {
        ...currentCharacter.skillTree,
        selectedSkills: updatedSelectedSkills,
      },
      updatedAt: new Date(),
    };

    updateCharacter(currentCharacter.id, updatedCharacter);
    setRankChangeDialogOpen(false);
    setAffectedSkills([]);
    setPendingRankChange(null);
    setIsRankChanging(false);
    setTempRank(null);
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

  // タッチデバイス用
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX - position.x;
    const startY = touch.clientY - position.y;

    const handleTouchMove = (e: TouchEvent) => {
      const moveTouch = e.touches[0];
      setPosition({
        x: moveTouch.clientX - startX,
        y: moveTouch.clientY - startY,
      });
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
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

  const handleAcquiredLevelChange = (skillId: string, level: number) => {
    if (currentCharacter) {
      const updatedCharacter: Character = {
        ...currentCharacter,
        skillTree: {
          ...currentCharacter.skillTree,
          acquiredSkills: {
            ...acquiredSkills,
            [skillId]: level,
          },
        },
      };
      updateCharacter(currentCharacter.id, updatedCharacter);
    }
  };

  const handleSelectedLevelDown = (skillId: string) => {
    if (currentCharacter) {
      const currentLevel = selectedSkills[skillId] || 0;
      if (currentLevel <= 0) return;
      const updatedCharacter = {
        ...currentCharacter,
        skillTree: {
          ...currentCharacter.skillTree,
          selectedSkills: {
            ...selectedSkills,
            [skillId]: currentLevel - 1,
          },
          acquiredSkills: {
            ...acquiredSkills,
          },
        },
      };
      updateCharacter(currentCharacter.id, updatedCharacter);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-2 w-full h-full">
      {/* コントロールパネル */}
      <div className="w-full lg:w-1/5 rounded-lg p-12 lg:p-4 overflow-y-auto max-h-[800px]">
        <div className="flex flex-col gap-y-10">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">ギルドランク {tempRank ?? displayRank}</h3>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-background-light rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{
                    width: `${(((tempRank ?? displayRank) - 1) / 13) * 100}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={tempRank ?? displayRank}
                onChange={e => {
                  const newRank = parseInt(e.target.value);
                  setDisplayRank(newRank);
                  setTempRank(newRank);
                }}
                onMouseUp={e => {
                  if (tempRank !== null) {
                    handleRankChange(tempRank);
                  }
                }}
                onTouchEnd={e => {
                  if (tempRank !== null) {
                    handleRankChange(tempRank);
                  }
                }}
                className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:relative"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-2">必要コスト</h3>
            <div className="space-y-2 text-sm">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-3 gap-2 text-text-primary/70 text-xs mb-1">
                <div>素材名</div>
                <div className="text-right">残り</div>
                <div className="text-right">累計</div>
              </div>

              {/* ギルドコイン */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-text-primary">ギルドコイン</div>
                <div className="text-right text-text-primary">
                  {remainingMaterials.coins > 0 && `×${remainingMaterials.coins.toLocaleString()}`}
                </div>
                <div className="text-right text-text-primary">
                  {totalCost.coins > 0 && `×${totalCost.coins.toLocaleString()}`}
                </div>
              </div>

              {/* 各素材 */}
              {Object.entries(totalCost.materials)
                .filter(([_, count]) => count > 0 || (remainingMaterials.materials[_] || 0) > 0)
                .map(([material, count]: [string, number]) => (
                  <div key={material} className="grid grid-cols-3 gap-2 items-center">
                    <div className="text-text-primary">{material}</div>
                    <div className="text-right text-text-primary">
                      {(remainingMaterials.materials[material] || 0) > 0 &&
                        `×${(remainingMaterials.materials[material] || 0).toLocaleString()}`}
                    </div>
                    <div className="text-right text-text-primary">{count > 0 && `×${count.toLocaleString()}`}</div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-2 whitespace-nowrap">パッシブスキル上昇値</h3>
            <div className="space-y-2 text-sm">
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
                  <span className="text-text-primary">+{totalStats.atkSpd}</span>
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
      <div
        ref={setContainerRef}
        className="relative w-full lg:top-[-100px] lg:w-2/3 h-[450px] md:h-[600px] lg:h-[800px] rounded-lg flex items-center justify-center overflow-hidden lg:overflow-visible"
      >
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[70%] bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm  text-center">
              {error}
            </div>
          )}

          {/* モバイル用の操作説明 */}
          <div className="lg:hidden absolute px-4 top-0 md:top-4 left-1/2 transform -translate-x-1/2 w-[90%] text-text-primary/70 text-xs text-center">
            スマホ、タブレットではスキルを長押しすると詳細を表示できます
          </div>

          <div
            className="absolute flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center",
              width: "800px",
              height: "800px",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                position: "relative",
                width: "100%",
                height: "100%",
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
                  acquiredLevel={acquiredSkills[skill.id] || 0}
                  maxLevel={skill.levels.length}
                  isUnlocked={isSkillUnlocked(skill, selectedSkills, currentCharacter?.guildRank || 5)}
                  guildRank={currentCharacter?.guildRank || 5}
                  onClick={handleSkillClick}
                  onRightClick={handleSkillRightClick}
                  onAcquiredLevelChange={handleAcquiredLevelChange}
                  onSelectedLevelDown={handleSelectedLevelDown}
                  onCheckDependencies={(skillId: string) => {
                    const hasActiveChildren = skills.some(
                      (s: Skill) => s.parentIds?.includes(skillId) && (selectedSkills[s.id] || 0) > 0
                    );
                    if (hasActiveChildren) {
                      setError("このスキルを未取得にするには、先に依存する子スキルを未取得状態にしてください。");
                      return false;
                    }
                    return true;
                  }}
                  isConfirmDialogOpen={isConfirmDialogOpen}
                  onConfirmDialogOpenChange={setIsConfirmDialogOpen}
                />
              ))}
            </div>
          </div>

          {/* ズームコントロール */}
          <div className="absolute bottom-0 lg:bottom-4 right-12 flex gap-2">
            <Button onClick={handleZoomIn} icon={<ZoomInIcon />} isIconOnly />
            <Button onClick={handleZoomOut} icon={<ZoomOutIcon />} isIconOnly />
            <Button onClick={handleZoomReset} icon={<ResetIcon />} isIconOnly />
          </div>
        </div>
      </div>

      {/* ランク変更確認ダイアログ */}
      <Dialog
        open={rankChangeDialogOpen}
        onOpenChange={open => {
          if (!open) {
            handleRankChangeCancel();
          }
        }}
        title="ランク変更の確認"
        description={
          <>
            <p className="text-text-secondary mb-4">
              ランクを{currentCharacter?.guildRank || 5}から{pendingRankChange}
              に下げると、以下のスキルに影響があります：
            </p>
            <div className="max-h-40 overflow-y-auto mb-4">
              {affectedSkills.map(skill => (
                <div key={skill.id} className="mb-2">
                  <p className="text-text-primary">
                    {skill.name}:
                    {skill.newLevel === 0 ? (
                      <span className="text-red-500"> 選択解除</span>
                    ) : (
                      <span className="text-yellow-500">
                        {" "}
                        Lv{skill.currentLevel} → Lv{skill.newLevel}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
        }
        confirmText="OK"
        cancelText="キャンセル"
        onConfirm={() => pendingRankChange && applyRankChange(pendingRankChange)}
      />
    </div>
  );
}
