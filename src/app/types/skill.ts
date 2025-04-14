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
  guildCoins: number;
  materials: {
    [key: string]: number;
  };
  description: string;
  requiredRank: number;
  str?: number; // 腕力
  vit?: number; // 体力
  agi?: number; // 速さ
  int?: number; // 知力
  dex?: number; // 器用
  mnd?: number; // 精神
  def?: number; // 防御力
  mp?: number; // MP
  hp?: number; // HP
  atkSpd?: number; // 攻撃速度
  magicPower?: number; // 魔法スキル威力
  physicalPower?: number; // 物理スキル威力
  expGetRate?: number; // EXP獲得率
  castSpd?: number; // 詠唱速度
  magicCri?: number; // 魔法CRI発動率
  physicalCri?: number; // 物理CRI発動率
  magicCriMulti?: number; // 魔法CRI倍率
  physicalCriMulti?: number; // 物理CRI倍率
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
