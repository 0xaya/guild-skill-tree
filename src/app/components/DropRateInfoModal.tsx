import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icons, PlusIcon } from './ui/Icons';

// ROND鉱石ドロップ率データ
const ROND_DROP_RATES = {
  N: { base: 0.1, perLevel: (0.4 - 0.1) / 20, maxLevel: 20 },
  R: { base: 0.4, perLevel: (1.2 - 0.4) / 30, maxLevel: 30 },
  SR: { base: 1.5, perLevel: (3 - 1.5) / 45, maxLevel: 45 },
  'SR (setup)': { base: 10.5, perLevel: (21 - 10.5) / 45, maxLevel: 45 },
  LR: { base: 5.0, perLevel: (8.5 - 5) / 80, maxLevel: 80 },
};

// ランク閾値データ
const RANK_THRESHOLDS = [
  { rank: 1, lower: 0, upper: 0.4, display: '0.0% ～ 0.4%未満' },
  { rank: 2, lower: 0.4, upper: 1.0, display: '0.4% ～ 1.0%未満' },
  { rank: 3, lower: 1.0, upper: 2.4, display: '1.0% ～ 2.4%未満' },
  { rank: 4, lower: 2.4, upper: 4.8, display: '2.4% ～ 4.8%未満' },
  { rank: 5, lower: 4.8, upper: 13.0, display: '4.8% ～ 13.0%未満' },
  { rank: 6, lower: 13.0, upper: 17.0, display: '13.0% ～ 17.0%未満' },
  { rank: 7, lower: 17.0, upper: 21.0, display: '17.0% ～ 21.0%未満' },
  { rank: 8, lower: 21.0, upper: 47.0, display: '21.0% ～ 47.0%未満' },
  { rank: 9, lower: 47.0, upper: Infinity, display: '47.0%以上' },
];

// 宝箱のドロップ率データ
const CHEST_DROP_RATES = {
  gold: {
    title: '防衛戦宝箱 (金)',
    titleColor: 'text-yellow-400',
    items: [
      { item: 'いずれかインクⅠ', ranks: ['高', '高', '高', '高', '高', '高', '中', '中', '中'] },
      { item: 'いずれかインクⅡ', ranks: ['低', '低', '中', '中', '中', '中', '中', '中', '中'] },
      { item: 'いずれかインクⅢ', ranks: ['稀', '低', '低', '低', '低', '中', '高', '高', '高'] },
      { item: '記憶の書', ranks: ['高', '高', '高', '高', '高', '高', '高', '高', '高'] },
      { item: 'ギルドコイン', ranks: ['高', '高', '高', '高', '高', '高', '高', '高', '高'] },
      { item: '高濃度コンパクトポーション', ranks: ['-', '-', '-', '-', '-', '-', '-', '-', '-'] },
      {
        item: '高濃度コンパクトマナポーション',
        ranks: ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
      },
    ],
  },
  silver: {
    title: '防衛戦宝箱 (銀)',
    titleColor: 'text-gray-200',
    items: [
      { item: 'いずれかインクⅠ', ranks: ['中', '高', '高', '高', '高', '高', '高', '中', '中'] },
      {
        item: 'いずれかインクⅡ',
        ranks: ['低', '中', '中', '中', '中', '高', '中', 'やや高', 'やや高'],
      },
      {
        item: 'いずれかインクⅢ',
        ranks: ['稀', '稀', '稀', '稀', '稀', '低', '中', '中', 'やや高'],
      },
      { item: '記憶の書', ranks: ['高', '高', '高', '高', '高', '高', '高', '高', '高'] },
      { item: 'ギルドコイン', ranks: ['高', '高', '高', '高', '高', '高', '高', '高', '高'] },
      { item: '高濃度コンパクトポーション', ranks: ['-', '-', '-', '-', '-', '-', '-', '-', '-'] },
      {
        item: '高濃度コンパクトマナポーション',
        ranks: ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
      },
    ],
  },
  bronze: {
    title: '防衛戦宝箱 (銅)',
    titleColor: 'text-amber-600',
    items: [
      { item: 'いずれかインクⅠ', ranks: ['中', '中', '高', '高', '高', '高', '高', '高', '高'] },
      { item: 'いずれかインクⅡ', ranks: ['稀', '低', '低', '低', '低', '中', '中', '中', '中'] },
      { item: 'いずれかインクⅢ', ranks: ['稀', '稀', '稀', '稀', '稀', '低', '低', '低', '中'] },
      { item: '記憶の書', ranks: ['低', '中', '高', '高', '高', '高', '高', '高', '高'] },
      { item: 'ギルドコイン', ranks: ['低', '中', '高', '高', '高', '高', '高', '高', '高'] },
      {
        item: '高濃度コンパクトポーション',
        ranks: ['高', '高', '高', '中', '中', '中', '低', '低', '低'],
      },
      {
        item: '高濃度コンパクトマナポーション',
        ranks: ['高', '高', '高', '中', '中', '中', '低', '低', '低'],
      },
    ],
  },
} as const;

// 装備部位の定義
const EQUIPMENT_SLOTS = [
  { id: 'right_hand', name: '右手' },
  { id: 'left_hand', name: '左手' },
  { id: 'body', name: '体' },
  { id: 'legs', name: '脚' },
  { id: 'head', name: '頭' },
  { id: 'back', name: '背中' },
  { id: 'shoulder', name: '肩' },
  { id: 'setup', name: 'Setup' },
] as const;

interface DropRateInfoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface Equipment {
  id: string;
  rarity?: keyof typeof ROND_DROP_RATES;
  level: number;
}

interface DropRateTableProps {
  title: string;
  titleColor: string;
  items: ReadonlyArray<{
    readonly item: string;
    readonly ranks: ReadonlyArray<string>;
  }>;
  currentRank: number;
}

const DropRateTable: React.FC<DropRateTableProps> = ({ title, titleColor, items, currentRank }) => {
  const tableRef = React.useRef<HTMLDivElement>(null);

  // ランクが変更された時にスクロール
  React.useEffect(() => {
    if (tableRef.current) {
      const table = tableRef.current;
      const columnWidth = 50; // ランク列の幅（w-[50px]）
      const scrollPosition = columnWidth * (currentRank - 1); // 0-based indexなので-1

      // スムーズスクロール
      table.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentRank]);

  return (
    <div className="pt-2">
      <h4 className={`text-md font-bold mb-2 ${titleColor}`}>{title}</h4>
      <div ref={tableRef} className="relative overflow-x-auto rounded">
        <table className="w-full text-left table-fixed text-sm bg-gray-800">
          <thead>
            <tr className="bg-gray-700">
              <th className="sticky left-0 z-10 w-32 px-4 py-2 border-b border-gray-600 bg-gray-700">
                アイテム名
              </th>
              {[...Array(9)].map((_, i) => (
                <th
                  key={i}
                  className={`w-[50px] px-4 py-2 border-b border-gray-600 ${
                    i + 1 === currentRank ? 'bg-primary/70' : ''
                  } whitespace-nowrap align-bottom [writing-mode:vertical-rl] [text-orientation:upright]`}
                >
                  ランク{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                <td className="sticky left-0 z-10 px-4 py-2 font-bold bg-gray-800 border-r border-gray-700">
                  {row.item}
                </td>
                {row.ranks.map((rate, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 text-center ${
                      colIndex + 1 === currentRank ? 'bg-primary/70' : ''
                    }`}
                  >
                    {rate}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DropRateInfoModal: React.FC<DropRateInfoModalProps> = ({ isOpen, onOpenChange }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(() =>
    EQUIPMENT_SLOTS.map((slot) => ({
      id: slot.id,
      level: 0,
    }))
  );
  const [showDetails, setShowDetails] = useState(false);

  // 装備1点あたりのRONDドロップ率を計算する関数
  const calculateSingleEquipmentDropRate = (equipment: Equipment) => {
    if (!equipment.rarity) return 0;
    const data = ROND_DROP_RATES[equipment.rarity];
    if (!data) return 0;
    const actualLevel = Math.min(equipment.level, data.maxLevel);
    return data.base + actualLevel * data.perLevel;
  };

  // 合計RONDドロップ率を計算する関数
  const calculateTotalRondDropRate = () => {
    return equipmentList.reduce((total, eq) => total + calculateSingleEquipmentDropRate(eq), 0);
  };

  // 合計ドロップ率に基づいてランクを決定する関数
  const getRank = (totalDropRate: number) => {
    for (const threshold of RANK_THRESHOLDS) {
      if (totalDropRate >= threshold.lower && totalDropRate < threshold.upper) {
        return threshold.rank;
      }
    }
    return '不明';
  };

  // 装備のレアリティやレベルが変更されたときのハンドラ
  const handleEquipmentChange = (
    id: string,
    key: keyof Equipment,
    value: string | number | undefined
  ) => {
    setEquipmentList((prevList) =>
      prevList.map((eq) =>
        eq.id === id
          ? {
              ...eq,
              [key]: key === 'level' ? Math.max(0, parseInt(value as string) || 0) : value,
            }
          : eq
      )
    );
  };

  const totalRondDropRate = calculateTotalRondDropRate();
  const currentRank =
    typeof getRank(totalRondDropRate) === 'number' ? (getRank(totalRondDropRate) as number) : 1;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title=""
      className="max-w-[350px] md:max-w-2xl"
      description={
        <div className="p-4 text-white max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-text-muted mb-4">
            オシャレ装備のレアリティと強化レベルからランクを計算します。
          </p>

          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold">ドロップ率計算</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary rounded-full transition-colors hover:bg-primary/10"
                aria-label={showDetails ? '仕様を閉じる' : '仕様を表示'}
              >
                {showDetails ? (
                  <>
                    <Icons.X className="w-4 h-4" />
                    <span>閉じる</span>
                  </>
                ) : (
                  <>
                    <Icons.Info className="w-4 h-4" />
                    <span>仕様を見る</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="relative mb-6">
              <div className="absolute -top-[7px] left-[calc(8rem+1rem)] w-4 h-4 bg-background-dark border-t border-l border-primary/80 rotate-45"></div>
              <div className="p-4 bg-background-dark rounded-lg border border-primary/80 shadow-lg">
                <div className="relative space-y-6">
                  {/* RONDドロップ率テーブル */}
                  <div>
                    <h4 className="font-bold text-primary/80 mb-3">鉱石ドロップ率仕様</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs md:text-sm">
                        <thead>
                          <tr className="border-b border-primary/20">
                            <th className="py-2 font-bold text-primary/80">レアリティ</th>
                            <th className="px-4 py-2 font-bold text-primary/80">装備1点あたり</th>
                            <th className="px-4 py-2 font-bold text-primary/80">Lv1で上昇</th>
                            <th className="px-4 py-2 font-bold text-primary/80">最大Lv</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {Object.entries(ROND_DROP_RATES).map(([rarity, data]) => (
                            <tr key={rarity} className="hover:bg-primary/5 transition-colors">
                              <td className="py-2 font-medium">{rarity}</td>
                              <td className="px-4 py-2">{data.base}%</td>
                              <td className="px-4 py-2">{data.perLevel.toFixed(5)}%</td>
                              <td className="px-4 py-2">
                                {data.base + data.perLevel * data.maxLevel}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ランク閾値テーブル */}
                  <div>
                    <h4 className="font-bold text-primary/80 mb-3">宝箱ランク閾値</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left table-auto text-xs md:text-sm">
                        <thead>
                          <tr className="border-b border-primary/20">
                            <th className="py-2 font-bold text-primary/80">ランク</th>
                            <th className="px-4 py-2 font-bold text-primary/80">ドロップ率</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {RANK_THRESHOLDS.map((threshold) => (
                            <tr
                              key={threshold.rank}
                              className="hover:bg-primary/5 transition-colors"
                            >
                              <td className="py-2 font-medium">{threshold.rank}</td>
                              <td className="px-4 py-2">{threshold.display}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-w-[400px]">
            {EQUIPMENT_SLOTS.map((slot) => {
              const equipment = equipmentList.find((eq) => eq.id === slot.id);
              if (!equipment) return null;

              return (
                <div key={slot.id} className="flex items-center space-x-2">
                  <div className="w-[20%] text-xs med:text-sm text-gray-300 whitespace-nowrap">
                    {slot.name}
                  </div>
                  <select
                    value={equipment.rarity || ''}
                    onChange={(e) =>
                      handleEquipmentChange(equipment.id, 'rarity', e.target.value || undefined)
                    }
                    className={`w-[60%] bg-gray-700 border border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                      !equipment.rarity ? 'text-gray-300/90' : 'text-white'
                    }`}
                  >
                    <option value="">レアリティを選択</option>
                    {Object.keys(ROND_DROP_RATES).map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={equipment.level}
                    onChange={(e) =>
                      handleEquipmentChange(equipment.id, 'level', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    max={equipment.rarity ? ROND_DROP_RATES[equipment.rarity].maxLevel : 0}
                    className="w-[20%] bg-gray-700 border border-gray-600 rounded p-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-gray-300">Lv</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p>
              <span className="">合計ドロップ率: </span>
              {totalRondDropRate.toFixed(2)}%
            </p>
            <p className="mt-2 font-bold">現在のランク: {currentRank}</p>
          </div>

          <div className="mt-8 space-y-6">
            {Object.entries(CHEST_DROP_RATES).map(([key, data]) => (
              <DropRateTable
                key={key}
                title={data.title}
                titleColor={data.titleColor}
                items={data.items}
                currentRank={currentRank}
              />
            ))}
          </div>
        </div>
      }
    />
  );
};
