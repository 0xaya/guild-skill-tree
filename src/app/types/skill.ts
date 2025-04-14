export interface Skill {
  id: string;
  name: string;
  category: string;
  type: "パッシブ" | "アクティブ";
  description: string;
  requiredRank: number;
  levels: SkillLevel[];
  x?: number;
  y?: number;
  parentIds?: string[];
  isPassive: boolean;
  radius?: number;
  color?: string;
}

export interface SkillLevel {
  level: number;
  description: string;
  guildCoins: number;
  materials: {
    [key: string]: number;
  };
  requiredRank: number;
  str?: number;
  vit?: number;
  agi?: number;
  int?: number;
  dex?: number;
  mnd?: number;
  def?: number;
  mp?: number;
  hp?: number;
  atkSpd?: number;
  magicPower?: number;
  physicalPower?: number;
  expGetRate?: number;
  castSpd?: number;
  magicCri?: number;
  physicalCri?: number;
  magicCriMulti?: number;
  physicalCriMulti?: number;
}

// スキル系統のカラーマッピング
export const CATEGORY_COLORS: { [key: string]: string } = {
  腕力系統: "#ff0000", // 赤
  体力系統: "#ff6600", // オレンジ
  速さ系統: "#ffcc00", // 黄色
  知力系統: "#00ccff", // 水色
  器用系統: "#cc66ff", // 紫
  精神系統: "#ff66cc", // ピンク
  コア: "#0066cc", // 青（中心ノード用）
};
