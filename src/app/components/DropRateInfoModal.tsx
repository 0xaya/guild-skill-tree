import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

// ROND鉱石ドロップ率データ
const ROND_DROP_RATES = {
  N: { base: 0.1, perLevel: 0.015, maxLevel: 20 },
  R: { base: 0.4, perLevel: 0.02667, maxLevel: 30 },
  SR: { base: 1.5, perLevel: 0.03333, maxLevel: 45 },
  'SR(setup)': { base: 10.5, perLevel: 0.23333, maxLevel: 45 },
  LR: { base: 5.0, perLevel: 0.04375, maxLevel: 80 },
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

interface DropRateInfoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface Equipment {
  id: number;
  rarity: keyof typeof ROND_DROP_RATES;
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
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([
    { id: 1, rarity: 'N', level: 1 },
  ]);
  const [showRondDetails, setShowRondDetails] = useState(false);

  // 装備1点あたりのRONDドロップ率を計算する関数
  const calculateSingleEquipmentDropRate = (equipment: Equipment) => {
    const data = ROND_DROP_RATES[equipment.rarity];
    if (!data) return 0;
    const actualLevel = Math.min(equipment.level, data.maxLevel);
    return data.base + (actualLevel - 1) * data.perLevel;
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

  // 装備を追加するハンドラ
  const handleAddEquipment = () => {
    setEquipmentList((prevList) => [
      ...prevList,
      {
        id: prevList.length > 0 ? Math.max(...prevList.map((e) => e.id)) + 1 : 1,
        rarity: 'N',
        level: 1,
      },
    ]);
  };

  // 装備を削除するハンドラ
  const handleRemoveEquipment = (id: number) => {
    setEquipmentList((prevList) => prevList.filter((eq) => eq.id !== id));
  };

  // 装備のレアリティやレベルが変更されたときのハンドラ
  const handleEquipmentChange = (id: number, key: keyof Equipment, value: string | number) => {
    setEquipmentList((prevList) =>
      prevList.map((eq) =>
        eq.id === id
          ? {
              ...eq,
              [key]: key === 'level' ? Math.max(1, parseInt(value as string) || 1) : value,
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
      title="素材ドロップ率計算ツール"
      className="max-w-3xl"
      description={
        <div className="p-4 text-white max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-text-muted mb-4">
            オシャレ装備のレアリティと強化レベルからランクを計算します。
          </p>
          <h3 className="font-bold mb-3 text-primary">ドロップ率計算</h3>

          <div className="space-y-4">
            {equipmentList.map((equipment, index) => (
              <div key={equipment.id} className="flex items-center space-x-2">
                <div className="w-40 text-xs text-gray-300 whitespace-nowrap">装備{index + 1}</div>
                <select
                  value={equipment.rarity}
                  onChange={(e) =>
                    handleEquipmentChange(
                      equipment.id,
                      'rarity',
                      e.target.value as keyof typeof ROND_DROP_RATES
                    )
                  }
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
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
                    handleEquipmentChange(equipment.id, 'level', parseInt(e.target.value) || 1)
                  }
                  min="1"
                  max={ROND_DROP_RATES[equipment.rarity].maxLevel}
                  className="w-16 bg-gray-700 border border-gray-600 rounded p-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-gray-300">Lv</span>
                {equipmentList.length > 1 && (
                  <button
                    onClick={() => handleRemoveEquipment(equipment.id)}
                    className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            onClick={handleAddEquipment}
            className="mt-4 font-bold py-2 px-4 rounded transition-colors"
          >
            装備を追加
          </Button>

          <div className="mt-6">
            <p>
              <span className="">合計ドロップ率: </span>
              {totalRondDropRate}%
            </p>
            <p className="text-primary mt-2 font-bold">現在のランク: {currentRank}</p>
          </div>

          <h3
            className="font-bold mt-8 mb-3 text-primary cursor-pointer flex items-center justify-between"
            onClick={() => setShowRondDetails(!showRondDetails)}
          >
            ドロップ率仕様
            <span className="text-sm text-text-muted ml-2">
              {showRondDetails ? '▲ 閉じる' : '▼ 開く'}
            </span>
          </h3>
          {showRondDetails && (
            <table className="w-full text-left table-auto text-sm bg-gray-800 rounded">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 border-b border-gray-600">レアリティ</th>
                  <th className="px-4 py-2 border-b border-gray-600">装備1点あたり</th>
                  <th className="px-4 py-2 border-b border-gray-600">Lv1で上昇</th>
                  <th className="px-4 py-2 border-b border-gray-600">最大Lv</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {Object.entries(ROND_DROP_RATES).map(([rarity, data]) => (
                  <tr key={rarity} className="border-b border-gray-700 last:border-b-0">
                    <td className="px-4 py-2">{rarity}</td>
                    <td className="px-4 py-2">{data.base.toFixed(2)}%</td>
                    <td className="px-4 py-2">{data.perLevel.toFixed(3)}%</td>
                    <td className="px-4 py-2">{data.maxLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="font-bold mt-8 mb-3 text-primary">ランク閾値</h3>
          <table className="w-full text-left table-auto text-sm bg-gray-800 rounded">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-2 border-b border-gray-600">ランク</th>
                <th className="px-4 py-2 border-b border-gray-600">ドロップ率</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {RANK_THRESHOLDS.map((threshold) => (
                <tr key={threshold.rank} className="border-b border-gray-700 last:border-b-0">
                  <td className="px-4 py-2">{threshold.rank}</td>
                  <td className="px-4 py-2">{threshold.display}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
