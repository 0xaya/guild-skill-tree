import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icons, PlusIcon } from './ui/Icons';
import { fetchCSV, RondDropRate, ChestDropRate, RankThreshold } from '../utils/csvUtils';

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
  rarity?: string;
  level: number;
}

interface DropRateTableProps {
  title: string;
  titleStyle?: string;
  items: ReadonlyArray<{
    readonly item: string;
    readonly ranks: ReadonlyArray<string>;
  }>;
  currentRank: number;
  chestType?: string;
}

const DropRateTable: React.FC<DropRateTableProps> = ({
  title,
  titleStyle,
  items,
  currentRank,
  chestType,
}) => {
  const tableRef = React.useRef<HTMLDivElement>(null);

  // ランクが変更された時にスクロール
  React.useEffect(() => {
    if (tableRef.current && items.length > 0) {
      const table = tableRef.current;
      const columnWidth = 40; // ランク列の幅（w-[40px]）
      const maxRank = items[0].ranks.length;
      const scrollPosition = columnWidth * Math.min(currentRank - 1, maxRank - 1); // 0-based indexなので-1

      // スムーズスクロール
      table.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentRank, items]);

  // 画像パスをchestTypeに応じて組み立て
  const getChestImagePath = (type?: string) => {
    if (!type) return undefined;
    return `/images/defencebattle_box-${type}.png`;
  };

  return (
    <div className="pt-2">
      <h4
        className="text-md font-bold mb-2 flex items-center"
        style={{
          color: titleStyle ? titleStyle.replace('color: ', '').replace(';', '') : '#ffffff',
        }}
      >
        {chestType && (
          <img
            src={getChestImagePath(chestType)}
            alt={title}
            className="inline-block w-6 h-6 mr-2 align-middle"
            style={{ objectFit: 'contain' }}
          />
        )}
        {title}
      </h4>
      <div ref={tableRef} className="relative overflow-x-auto rounded">
        <table className="w-full text-left table-fixed text-xs bg-gray-800">
          <thead>
            <tr className="bg-gray-700">
              <th className="sticky left-0 z-10 w-32 px-4 py-2 border-b border-gray-600 bg-gray-700 text-xs">
                アイテム名
              </th>
              {items.length > 0 &&
                items[0].ranks.map((_, i) => (
                  <th
                    key={i}
                    className={`w-[40px] px-2 py-2 border-b border-gray-600 text-xs content-center ${
                      i + 1 === currentRank ? 'bg-primary/70' : ''
                    } whitespace-nowrap align-bottom [writing-mode:vertical-rl] [text-orientation:upright]`}
                  >
                    {i + 1 === 10 ? (
                      <>
                        <span className="[writing-mode:vertical-rl] [text-orientation:upright]">
                          ランク
                        </span>
                        <span className="[writing-mode:horizontal-tb] [text-orientation:upright]">
                          10
                        </span>
                      </>
                    ) : (
                      `ランク${i + 1}`
                    )}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                <td className="sticky left-0 z-10 px-4 py-2 font-bold bg-gray-800 border-r border-gray-700 text-xs">
                  {row.item}
                </td>
                {row.ranks.map((rate, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 text-center text-xs ${
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
  const [rondDropRates, setRondDropRates] = useState<Record<string, RondDropRate>>({});
  const [chestDropRates, setChestDropRates] = useState<Record<string, any>>({});
  const [rankThresholds, setRankThresholds] = useState<RankThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CSVファイルからデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // キャッシュを無効化するためのタイムスタンプ
        const timestamp = Date.now();

        // 鉱石ドロップ率データを読み込み
        const rondData = await fetchCSV<RondDropRate>(`/data/rond-drop-rates.csv?t=${timestamp}`);
        const rondRatesMap: Record<string, RondDropRate> = {};
        rondData.forEach((item) => {
          rondRatesMap[item.rarity] = item;
        });
        setRondDropRates(rondRatesMap);

        // 宝箱ドロップ率データを読み込み
        const chestData = await fetchCSV<ChestDropRate>(
          `/data/chest-drop-rates.csv?t=${timestamp}`
        );
        const chestRatesMap: Record<string, any> = {};

        chestData.forEach((item) => {
          if (!chestRatesMap[item.chest_type]) {
            // 色クラスをインラインスタイルに変換
            let titleStyle = '';
            switch (item.title_color) {
              case 'text-yellow-400':
                titleStyle = 'color: #fbbf24;'; // yellow-400
                break;
              case 'text-gray-200':
                titleStyle = 'color: #e5e7eb;'; // gray-200
                break;
              case 'text-amber-600':
                titleStyle = 'color: #d97706;'; // amber-600
                break;
              default:
                titleStyle = 'color: #ffffff;'; // デフォルトは白
            }

            chestRatesMap[item.chest_type] = {
              title: item.title,
              titleColor: item.title_color,
              titleStyle: titleStyle,
              items: [],
            };
          }

          chestRatesMap[item.chest_type].items.push({
            item: item.item,
            ranks: [
              item.rank1,
              item.rank2,
              item.rank3,
              item.rank4,
              item.rank5,
              item.rank6,
              item.rank7,
              item.rank8,
              item.rank9,
              item.rank10 || '',
            ],
          });
        });

        setChestDropRates(chestRatesMap);

        // ランク閾値データを読み込み
        const rankData = await fetchCSV<RankThreshold>(`/data/rank-thresholds.csv?t=${timestamp}`);
        console.log('Loaded rank thresholds:', rankData); // デバッグ用ログ
        setRankThresholds(rankData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 装備1点あたりのRONDドロップ率を計算する関数
  const calculateSingleEquipmentDropRate = (equipment: Equipment) => {
    if (!equipment.rarity || !rondDropRates[equipment.rarity]) return 0;
    const data = rondDropRates[equipment.rarity];
    const actualLevel = Math.min(equipment.level, data.maxLevel);
    return Math.round((data.base + actualLevel * data.perLevel) * 100) / 100;
  };

  // 合計RONDドロップ率を計算する関数
  const calculateTotalRondDropRate = () => {
    return equipmentList.reduce((total, eq) => total + calculateSingleEquipmentDropRate(eq), 0);
  };

  // 合計ドロップ率に基づいてランクを決定する関数
  const getRank = (totalDropRate: number) => {
    for (const threshold of rankThresholds) {
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

  if (isLoading) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={onOpenChange}
        title=""
        className="max-w-[350px] md:max-w-2xl"
        description={
          <div className="p-4 text-white">
            <p>データを読み込み中...</p>
          </div>
        }
      />
    );
  }

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
                          {Object.entries(rondDropRates).map(([rarity, data]) => (
                            <tr key={rarity} className="hover:bg-primary/5 transition-colors">
                              <td className="py-2 font-medium">{rarity}</td>
                              <td className="px-4 py-2">{data.base}%</td>
                              <td className="px-4 py-2">{data.perLevel.toFixed(5)}%</td>
                              <td className="px-4 py-2">
                                {Math.round((data.base + data.perLevel * data.maxLevel) * 100) /
                                  100}
                                %
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
                          {rankThresholds.map((threshold) => {
                            console.log('Rendering threshold:', threshold); // デバッグ用ログ
                            return (
                              <tr
                                key={threshold.rank}
                                className="hover:bg-primary/5 transition-colors"
                              >
                                <td className="py-2 font-medium">{threshold.rank}</td>
                                <td className="px-4 py-2">{threshold.display}</td>
                              </tr>
                            );
                          })}
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
                    {Object.keys(rondDropRates).map((rarity) => (
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
                    max={
                      equipment.rarity && rondDropRates[equipment.rarity]
                        ? rondDropRates[equipment.rarity].maxLevel
                        : 0
                    }
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
            {Object.entries(chestDropRates).map(([key, data]) => (
              <DropRateTable
                key={key}
                title={data.title}
                titleStyle={data.titleStyle}
                items={data.items}
                currentRank={currentRank}
                chestType={key}
              />
            ))}
          </div>
        </div>
      }
    />
  );
};
