import { GlobalState, Character } from "../types/character";

const STORAGE_KEY = "guild-skill-tree-simulator-state";

const createDefaultCharacter = (): Character => ({
  id: "1",
  name: "キャラクター1",
  skillTree: {
    selectedSkills: { core: 1 },
    acquiredSkills: {},
  },
});

export const loadGlobalState = (): GlobalState => {
  if (typeof window === "undefined") {
    return {
      guildRank: 5,
      characters: [createDefaultCharacter()],
      currentCharacterId: "1",
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading global state:", error);
  }

  // デフォルトの状態を返す
  return {
    guildRank: 5,
    characters: [createDefaultCharacter()],
    currentCharacterId: "1",
  };
};

export const saveGlobalState = (state: GlobalState): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving global state:", error);
  }
};

export const getCurrentCharacter = (state: GlobalState): Character | null => {
  if (!state.currentCharacterId) return null;
  return state.characters.find(char => char.id === state.currentCharacterId) || null;
};

export const updateCharacter = (state: GlobalState, character: Character): GlobalState => {
  const characters = state.characters.map(char => (char.id === character.id ? character : char));
  return { ...state, characters };
};

export const addCharacter = (state: GlobalState, character: Character): GlobalState => {
  return {
    ...state,
    characters: [...state.characters, character],
    currentCharacterId: character.id,
  };
};

export const deleteCharacter = (state: GlobalState, characterId: string): GlobalState => {
  const characters = state.characters.filter(char => char.id !== characterId);
  return {
    ...state,
    characters,
    currentCharacterId: characters.length > 0 ? characters[0].id : null,
  };
};
