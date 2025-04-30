export interface Character {
  id: string;
  name: string;
  skillTree: {
    selectedSkills: { [key: string]: number };
    acquiredSkills: { [key: string]: number };
  };
  updatedAt: Date;
}

export interface GlobalState {
  guildRank: number;
  characters: Character[];
  currentCharacterId: string | null;
}
