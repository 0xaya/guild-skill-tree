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
