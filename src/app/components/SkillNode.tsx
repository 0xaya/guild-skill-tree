"use client";

import React, { useState, useEffect } from "react";
import { Skill } from "../types/skill";
import { SKILL_COLORS, CATEGORY_MAPPING } from "../utils/skillUtils";
import { Dialog } from "./ui/Dialog";
import { Tooltip } from "./ui/Tooltip";
import { CloseIcon } from './ui/Icons';

interface SkillNodeProps {
  skill: Skill;
  selectedLevel: number;
  acquiredLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  guildRank: number;
  onClick: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onRightClick: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onAcquiredLevelChange: (id: string, level: number) => void;
  onSelectedLevelDown: (id: string) => void;
  onCheckDependencies: (id: string) => boolean;
  isConfirmDialogOpen: boolean;
  onConfirmDialogOpenChange: (isOpen: boolean) => void;
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
      <span key={i} className={`mr-px ${i <= currentLevel ? 'text-yellow-400' : 'text-white-500'}`}>
        {i <= currentLevel ? '★' : '☆'} {/* Use ☆ for unfilled */}
      </span>
    );
  }
  // 最大レベルが0または不明な場合は何も表示しない
  if (maxLevel <= 0) return null;
  // 星のサイズをさらに小さくする
  return <div className="flex text-[8px] justify-center">{stars}</div>;
};

// パッシブスキルの効果範囲を計算する関数
const calculatePassiveSkillRange = (skill: Skill) => {
  const effects: { [key: string]: { min: number; max: number } } = {};

  skill.levels.forEach((level) => {
    Object.entries(level).forEach(([key, value]) => {
      if (
        typeof value === 'number' &&
        value !== 0 &&
        [
          'str',
          'vit',
          'agi',
          'int',
          'dex',
          'mnd',
          'def',
          'mp',
          'hp',
          'atkSpd',
          'magicPower',
          'physicalPower',
          'expGetRate',
          'castSpd',
          'magicCri',
          'physicalCri',
          'magicCriMulti',
          'physicalCriMulti',
        ].includes(key)
      ) {
        if (!effects[key]) {
          effects[key] = { min: value, max: value };
        } else {
          effects[key].min = Math.min(effects[key].min, value);
          effects[key].max = Math.max(effects[key].max, value);
        }
      }
    });
  });

  return effects;
};

// 効果の表示名を取得する関数
const getEffectDisplayName = (key: string): string => {
  const effectNames: { [key: string]: string } = {
    str: '腕力',
    vit: '体力',
    agi: '速さ',
    int: '知力',
    dex: '器用',
    mnd: '精神',
    def: '防御力',
    mp: 'MP',
    hp: 'HP',
    atkSpd: '攻撃速度',
    magicPower: '魔法スキル威力',
    physicalPower: '物理スキル威力',
    expGetRate: 'EXP獲得率',
    castSpd: '詠唱速度',
    magicCri: '魔法CRI発動率',
    physicalCri: '物理CRI発動率',
    magicCriMulti: '魔法CRI倍率',
    physicalCriMulti: '物理CRI倍率',
  };
  return effectNames[key] || key;
};

// 効果の表示形式を取得する関数
const getEffectDisplay = (key: string, value: number): string => {
  const isPercentage = [
    'str',
    'vit',
    'agi',
    'int',
    'dex',
    'mnd',
    'def',
    'mp',
    'hp',
    'magicPower',
    'physicalPower',
    'expGetRate',
    'castSpd',
    'magicCri',
    'physicalCri',
    'magicCriMulti',
    'physicalCriMulti',
  ].includes(key);
  return `${value}${isPercentage ? '%' : ''}`;
};

export const SkillNode: React.FC<SkillNodeProps> = ({
  skill,
  selectedLevel,
  acquiredLevel,
  maxLevel,
  isUnlocked,
  guildRank,
  onClick,
  onRightClick,
  onAcquiredLevelChange,
  onSelectedLevelDown,
  onCheckDependencies,
  isConfirmDialogOpen,
  onConfirmDialogOpenChange,
}) => {
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const [showSkillDetails, setShowSkillDetails] = useState(false);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 取得済レベルが選択済みレベルより高い場合は、選択済みレベルを更新
  useEffect(() => {
    if (acquiredLevel > selectedLevel) {
      for (let i = selectedLevel; i < acquiredLevel; i++) {
        onClick(skill.id, {} as React.MouseEvent | React.TouchEvent);
      }
    }
  }, [acquiredLevel, selectedLevel, onClick, skill.id]);

  useEffect(() => {
    if (isConfirmDialogOpen) {
      setShowSkillDetails(true);
    } else {
      setShowSkillDetails(false);
    }
  }, [isConfirmDialogOpen]);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowSkillDetails(true);
    }, 500); // 500msの長押しで表示
    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    setShowSkillDetails(false);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLevelPopup(true);
    setShowSkillDetails(false);
  };

  const handleAcquiredLevelChange = (level: number) => {
    onAcquiredLevelChange(skill.id, level);
    setShowLevelPopup(false);
    setShowSkillDetails(false);
  };

  const handleLevelDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // レベル1から0に下げる場合は依存関係を先にチェック
    if (selectedLevel === 1) {
      const canLevelDown = onCheckDependencies(skill.id);
      if (!canLevelDown) {
        setShowSkillDetails(false);
        return;
      }
    }

    // 取得済みレベルが選択レベル-1より大きい場合は確認ダイアログを表示
    if (acquiredLevel > selectedLevel - 1) {
      setIsDialogOpen(true);
      setShowSkillDetails(false);
    } else {
      onRightClick(skill.id, e);
    }
  };

  const handleConfirmLevelDown = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onRightClick(skill.id, e || ({} as React.MouseEvent | React.TouchEvent));
    setIsDialogOpen(false);
    setShowSkillDetails(false);
  };

  const handleCancelLevelDown = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDialogOpen(false);
    setShowSkillDetails(false);
  };

  const categoryColor = SKILL_COLORS[CATEGORY_MAPPING[skill.category] || 'strength'];
  const isActive = selectedLevel > 0;
  const isCore = skill.id === 'core';
  const isRankMet = guildRank >= skill.requiredRank;

  // 背景色の透明度を全体的に下げる
  const nodeBgColor = isActive
    ? `${categoryColor}99` // alpha: 1 (取得済み)
    : isRankMet
    ? `${categoryColor}30` // alpha: 0.3 (ランク条件を満たしている)
    : `${categoryColor}8`; // alpha: 0.08 (ランク条件を満たしていない)
  const nodeBorderColor = isActive
    ? categoryColor
    : isRankMet
    ? 'rgba(120, 120, 140, 0.9)' // ランク条件を満たしている
    : 'rgba(120, 120, 140, 0.3)'; // ランク条件を満たしていない

  // ノードのスタイルを設定
  const nodeWidth = isCore ? 60 : 90;
  const nodeHeight = isCore ? 60 : 45;
  const nodeStyle: React.CSSProperties = {
    width: `${nodeWidth}px`,
    height: `${nodeHeight}px`,
    borderRadius: isCore ? '50%' : '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    position: 'absolute',
    left: `-${nodeWidth / 2}px`,
    top: `-${nodeHeight / 2}px`,
    backgroundColor: isRankMet ? nodeBgColor : 'rgba(120, 120, 140, 0.1)',
    opacity: isRankMet ? (isUnlocked ? 1 : 0.5) : 0.2,
    border: `${
      isCore
        ? '2px solid'
        : skill.type === 'パッシブ'
        ? acquiredLevel > 0
          ? '2px solid'
          : '1px solid'
        : acquiredLevel > 0
        ? '5px double'
        : '3px double'
    } ${nodeBorderColor}`,
    color: '#ffffff',
    fontSize: isCore ? '12px' : '10px',
    fontWeight: isCore ? 'bold' : 'normal',
    boxShadow: isActive
      ? `0 0 ${isCore ? '15px' : '8px'} ${categoryColor}70, 0 0 ${
          isCore ? '8px' : '4px'
        } ${categoryColor}50`
      : 'none',
    transition: 'all 0.2s ease-in-out',
    zIndex: isCore ? 15 : 10,
    cursor: !isCore && isUnlocked && isRankMet && selectedLevel === 0 ? 'pointer' : 'default',
  };

  // レベルアップ/レベルダウンボタンのスタイル
  const levelButtonStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: `2px solid ${categoryColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isUnlocked && isRankMet ? 'pointer' : 'not-allowed',
    fontSize: '13px',
    fontWeight: '700',
    color: `${categoryColor}`,
    opacity: isUnlocked && isRankMet ? 1 : 0.3,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    top: '6px',
  };

  // スキル詳細表示スタイル
  const skillDetailsStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${nodeHeight / 2 + 5}px`, // topオフセットに合わせて調整
    left: '0',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    border: `1px solid ${categoryColor}80`,
    borderRadius: '8px',
    padding: '10px',
    zIndex: 100,
    width: '240px',
    color: '#ffffff',
    fontSize: '12px',
    fontFamily: 'var(--font-inter)',
    display: showSkillDetails ? 'block' : 'none',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(3px)',
  };

  // スキル名略称処理
  const skillNameDisplay = skill.name.replace(/クリティカル/g, 'CRI');

  return (
    <div
      style={{
        position: 'absolute',
        left: `${skill.x || 0}px`,
        top: `${skill.y || 0}px`,
        zIndex: showSkillDetails || showLevelPopup || isDialogOpen ? 20 : 10,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onMouseEnter={() => {
        if (window.innerWidth >= 768 && !isDialogOpen && !isCore) {
          setShowSkillDetails(true);
        }
      }}
      onMouseLeave={() => setShowSkillDetails(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      <div
        style={{
          ...nodeStyle,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        onClick={(e) => {
          if (!isCore && isUnlocked && isRankMet) {
            if (selectedLevel < maxLevel) {
              onClick(skill.id, e);
            }
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isCore && isUnlocked && isRankMet && selectedLevel > 0) {
            handleLevelDown(e);
          }
        }}
        className={!isCore && isUnlocked && isRankMet ? 'cursor-pointer' : ''}
      >
        {/* チェックボックス */}
        {!isCore && selectedLevel > 0 && (
          <div
            className="absolute top-[-5px] right-[-8px] w-4 h-4 rounded-md border-2 cursor-pointer flex items-center justify-center group transition-all duration-200 hover:scale-110 hover:shadow-lg z-10"
            style={{
              border: `1.5px solid ${categoryColor}`,
              backgroundColor: acquiredLevel > 0 ? categoryColor : 'black',
              opacity: isUnlocked && isRankMet ? 0.8 : 0.3,
              cursor: isUnlocked && isRankMet ? 'pointer' : 'not-allowed',
              boxShadow: '0 0 0 0 rgba(0,0,0,0)',
            }}
            onClick={handleCheckboxClick}
          >
            {acquiredLevel > 0 ? (
              <span
                className="text-[10px] text-white font-heavy group-hover:text-yellow-200 transition-colors duration-200"
                style={{
                  filter: `drop-shadow(${categoryColor}FF 1px 2px 2px) drop-shadow(rgba(0, 0, 0, 0.3) 0px 0px 2px)`,
                }}
              >
                {acquiredLevel}
              </span>
            ) : (
              <span className="text-[9px] text-gray-400 group-hover:text-white transition-colors duration-200 font-heavy">
                ?
              </span>
            )}
            {/* ホバー時のツールチップ */}
            <Tooltip text="実際の取得済みレベルを設定" position="top">
              <div className="w-full h-full" />
            </Tooltip>
          </div>
        )}

        {/* スキル名表示 - コアは空にする */}
        {!isCore && <span className="leading-tight">{skillNameDisplay}</span>}

        {/* レベル表示とボタン - コア以外でレベル1以上のスキルのみ表示 */}
        {!isCore && selectedLevel > 0 && (
          <div className="flex items-center justify-center gap-[1rem] mb-[-3px]">
            <button
              className="minus-button"
              style={levelButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleLevelDown(e);
              }}
              disabled={!isUnlocked || !isRankMet}
            >
              -
            </button>
            <span className="text-[9px] opacity-70">Lv{selectedLevel}</span>
            <button
              className="plus-button"
              style={levelButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onClick(skill.id, e);
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

      {/* レベル選択ポップアップ */}
      {showLevelPopup && (
        <div
          className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 bg-background-dark/80 border border-primary/20 rounded-lg p-2 shadow-lg"
          style={{ zIndex: 30 }}
        >
          <div className="relative">
            <button
              className="absolute -top-1 -right-1 w-5 h-5 hover:bg-primary/10 rounded-full transition-colors"
              onClick={() => setShowLevelPopup(false)}
            >
              <CloseIcon size={14} className="text-primary" />
            </button>
            <div className="text-xs text-text-primary mb-2 pr-6">
              実際の取得済レベルを選択
              <span className="text-xs inline-block">（未取得は未を選択）</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              className={`w-8 h-8 rounded text-xs ${
                acquiredLevel === 0
                  ? 'bg-primary text-white'
                  : 'border border-primary/80 text-text-primary'
              }`}
              onClick={() => handleAcquiredLevelChange(0)}
            >
              未
            </button>
            {[...Array(maxLevel)].map((_, level) => (
              <button
                key={level + 1}
                className={`w-8 h-8 rounded text-xs ${
                  level + 1 === acquiredLevel
                    ? 'bg-primary text-white'
                    : 'border border-primary/80 text-text-primary'
                }`}
                onClick={() => handleAcquiredLevelChange(level + 1)}
              >
                {level + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="レベル変更の確認"
        description={
          selectedLevel - 1 === 0
            ? `現在Lv${acquiredLevel}取得済みになっていますが、未取得状態になります。\nよろしいですか？`
            : `取得済みレベルが${acquiredLevel}のため、選択レベルを下げると取得済みレベルも${
                selectedLevel - 1
              }に下がります。\nよろしいですか？`
        }
        confirmText="OK"
        cancelText="キャンセル"
        onConfirm={handleConfirmLevelDown}
      />

      {/* スキル詳細表示 */}
      {showSkillDetails && (
        <div style={skillDetailsStyle}>
          {!isCore && <div className="font-bold mb-1 text-[16px] text-primary">{skill.name}</div>}

          {/* パッシブスキルの場合、全レベルの効果範囲を表示 */}
          {!isCore && skill.type === 'パッシブ' && (
            <div className="text-sm mb-2 text-gray-300">
              {Object.entries(calculatePassiveSkillRange(skill)).map(([key, range]) => {
                const isPercentage = [
                  'str',
                  'vit',
                  'agi',
                  'int',
                  'dex',
                  'mnd',
                  'def',
                  'mp',
                  'hp',
                  'magicPower',
                  'physicalPower',
                  'expGetRate',
                  'castSpd',
                  'magicCri',
                  'physicalCri',
                  'magicCriMulti',
                  'physicalCriMulti',
                ].includes(key);
                return (
                  <div key={key}>
                    {getEffectDisplayName(key)}を{range.min}～{range.max}
                    {isPercentage ? '%' : ''}増加
                  </div>
                );
              })}
            </div>
          )}

          {/* 取得済みレベル設定の説明を追加 */}
          {!isCore && selectedLevel > 0 && (
            <div className="text-[10px] text-yellow-300 mb-2">
              右上ボックスで実際の取得済みレベルを設定すると残りの必要素材数が計算されます
            </div>
          )}

          {/* 現在のレベル情報 */}
          {!isCore && selectedLevel > 0 && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="mt-1 text-base font-bold text-primary">Lv{selectedLevel}</div>
              {skill.type === 'パッシブ' ? (
                // パッシブスキルの場合、現在の効果のみ表示
                <div className="mt-1">
                  {Object.entries(skill.levels[selectedLevel - 1]).map(([key, value]) => {
                    if (
                      typeof value === 'number' &&
                      value !== 0 &&
                      [
                        'str',
                        'vit',
                        'agi',
                        'int',
                        'dex',
                        'mnd',
                        'def',
                        'mp',
                        'hp',
                        'atkSpd',
                        'magicPower',
                        'physicalPower',
                        'expGetRate',
                        'castSpd',
                        'magicCri',
                        'physicalCri',
                        'magicCriMulti',
                        'physicalCriMulti',
                      ].includes(key)
                    ) {
                      return (
                        <div key={key} className="text-sm font-bold text-gray-300">
                          {getEffectDisplayName(key)}を{value}
                          {[
                            'str',
                            'vit',
                            'agi',
                            'int',
                            'dex',
                            'mnd',
                            'def',
                            'mp',
                            'hp',
                            'magicPower',
                            'physicalPower',
                            'expGetRate',
                            'castSpd',
                            'magicCri',
                            'physicalCri',
                            'magicCriMulti',
                            'physicalCriMulti',
                          ].includes(key)
                            ? '%'
                            : ''}
                          増加
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                // アクティブスキルの場合、従来通りの表示
                <div className="text-xs mb-2 text-gray-300">
                  {skill.levels[selectedLevel - 1].description}
                </div>
              )}
            </div>
          )}

          {/* 次のレベル情報 */}
          {!isCore && selectedLevel < maxLevel && (
            <div className="mt-2 pt-1 border-t border-gray-700">
              <div className="mt-1 text-xs font-bold text-secondary">
                次のレベル: Lv{selectedLevel + 1}
              </div>
              {skill.type === 'パッシブ' ? (
                // パッシブスキルの場合、次のレベルの効果を表示
                <div className="mt-1">
                  {Object.entries(skill.levels[selectedLevel]).map(([key, value]) => {
                    if (
                      typeof value === 'number' &&
                      value !== 0 &&
                      [
                        'str',
                        'vit',
                        'agi',
                        'int',
                        'dex',
                        'mnd',
                        'def',
                        'mp',
                        'hp',
                        'atkSpd',
                        'magicPower',
                        'physicalPower',
                        'expGetRate',
                        'castSpd',
                        'magicCri',
                        'physicalCri',
                        'magicCriMulti',
                        'physicalCriMulti',
                      ].includes(key)
                    ) {
                      return (
                        <div key={key} className="text-xs font-bold text-gray-300">
                          {getEffectDisplayName(key)}を{value}
                          {[
                            'str',
                            'vit',
                            'agi',
                            'int',
                            'dex',
                            'mnd',
                            'def',
                            'mp',
                            'hp',
                            'magicPower',
                            'physicalPower',
                            'expGetRate',
                            'castSpd',
                            'magicCri',
                            'physicalCri',
                            'magicCriMulti',
                            'physicalCriMulti',
                          ].includes(key)
                            ? '%'
                            : ''}
                          増加
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                // アクティブスキルの場合、従来通りの表示
                <div className="text-xs mb-2 text-gray-300">
                  {skill.levels[selectedLevel].description}
                </div>
              )}

              {/* 必要素材情報 */}
              {Object.keys(skill.levels[selectedLevel]?.materials || {}).length > 0 && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-x-8 text-xs mt-1">
                    {Object.entries(skill.levels[selectedLevel]?.materials || {}).map(
                      ([name, amount]) => (
                        <div key={name} className="flex justify-between">
                          <span className="text-gray-300">{name}</span>
                          <span className="text-gray-300">×{amount}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              {/* コイン消費 */}
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-300">ギルドコイン:</span>
                <span className="text-gray-300">
                  ×{skill.levels[selectedLevel]?.guildCoins || 0}
                </span>
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
                      <span
                        className={
                          level.requiredRank > guildRank ? 'text-red-500 font-bold' : 'text-white'
                        }
                      >
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
            <div className="text-[10px] mt-2 text-text-muted">
              {selectedLevel === 0 ? '' : '-/+ ボタン、または左/右クリックでレベルを調整できます'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
