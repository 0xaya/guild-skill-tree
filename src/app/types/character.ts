export interface Equipment {
  id: string; // 装備部位ID (right_hand, left_hand, etc.)
  rarity?: string; // レアリティ
  level: number; // 強化レベル
}

export interface EquipmentConfig {
  equipment: Equipment[];
  updatedAt: Date;
  userId?: string; // ログインユーザーの場合のみ
}

export interface Character {
  id: string;
  name: string;
  skillTree: {
    selectedSkills: { [key: string]: number };
    acquiredSkills: { [key: string]: number };
  };
  guildRank: number;
  updatedAt: Date;
}

export interface GlobalState {
  characters: Character[];
  currentCharacterId: string | null;
}
