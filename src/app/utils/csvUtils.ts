// CSVファイルを読み込んでパースする関数
export async function fetchCSV<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, {
      cache: 'no-cache', // キャッシュを無効化
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV<T>(csvText);
  } catch (error) {
    console.error('Error fetching CSV:', error);
    throw error;
  }
}

// CSVテキストをパースする関数
function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',');
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      // 数値に変換できる場合は数値に変換
      const numValue = parseFloat(value);
      row[header.trim()] = isNaN(numValue) ? value : numValue;
    });

    data.push(row as T);
  }

  return data;
}

// 鉱石ドロップ率データの型定義
export interface RondDropRate {
  rarity: string;
  base: number;
  perLevel: number;
  maxLevel: number;
}

// 宝箱ドロップ率データの型定義
export interface ChestDropRate {
  chest_type: string;
  title: string;
  title_color: string;
  item: string;
  rank1: string;
  rank2: string;
  rank3: string;
  rank4: string;
  rank5: string;
  rank6: string;
  rank7: string;
  rank8: string;
  rank9: string;
  rank10?: string;
}

// ランク閾値データの型定義
export interface RankThreshold {
  rank: number;
  lower: number;
  upper: number;
  display: string;
}
