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
