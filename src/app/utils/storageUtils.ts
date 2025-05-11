import { GlobalState, Character } from "../types/character";

const STORAGE_KEY = "guild-skill-tree-simulator-state";

const createDefaultCharacter = (): Character => ({
  id: "1",
  name: "キャラクター1",
  skillTree: {
    selectedSkills: { core: 1 },
    acquiredSkills: {},
  },
  guildRank: 5,
  updatedAt: new Date(),
});

// デフォルトの状態を取得
export const getDefaultState = (): GlobalState => ({
  characters: [createDefaultCharacter()],
  currentCharacterId: "1",
});

// 現在の状態を取得
export const loadGlobalState = (): GlobalState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 必要なプロパティが存在することを確認
      if (Array.isArray(parsed.characters) && parsed.currentCharacterId) {
        // updatedAtをDateオブジェクトに変換
        parsed.characters = parsed.characters.map((char: any) => ({
          ...char,
          updatedAt: new Date(char.updatedAt),
          // 古いデータの場合はデフォルトのギルドランクを設定
          guildRank: char.guildRank || 5,
        }));
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading global state:", error);
  }

  return null;
};

// 状態を保存
export const saveGlobalState = (state: GlobalState): void => {
  if (typeof window === "undefined") return;

  try {
    // 状態の整合性を確認
    if (!Array.isArray(state.characters) || !state.currentCharacterId) {
      console.error("Invalid state structure:", state);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving global state:", error);
  }
};

// 現在のキャラクターを取得
export const getCurrentCharacter = (state: GlobalState): Character | null => {
  if (!state.currentCharacterId) return null;
  return state.characters.find(char => char.id === state.currentCharacterId) || null;
};

// キャラクターを更新
export const updateCharacter = (state: GlobalState, character: Character): GlobalState => {
  const characters = state.characters.map(char => (char.id === character.id ? character : char));
  return { ...state, characters };
};

// キャラクターを追加
export const addCharacter = (state: GlobalState, character: Character): GlobalState => {
  // 既存のキャラクターIDと重複しないように確認
  if (state.characters.some(char => char.id === character.id)) {
    console.error("Character with this ID already exists:", character.id);
    return state;
  }

  return {
    ...state,
    characters: [...state.characters, character],
    currentCharacterId: character.id,
  };
};

// キャラクターを削除
export const deleteCharacter = (state: GlobalState, characterId: string): GlobalState => {
  const characters = state.characters.filter(char => char.id !== characterId);
  return {
    ...state,
    characters,
    currentCharacterId: characters.length > 0 ? characters[0].id : null,
  };
};

// スキルツリーの状態を更新
export const updateSkillTree = (state: GlobalState, characterId: string, skillTree: Character["skillTree"]): GlobalState => {
  const characters = state.characters.map(char =>
    char.id === characterId
      ? { ...char, skillTree }
      : char
  );
  return { ...state, characters };
};
