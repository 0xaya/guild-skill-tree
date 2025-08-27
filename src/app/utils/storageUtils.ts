import { GlobalState, Character, Equipment, EquipmentConfig } from '../types/character';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY = 'guild-skill-tree-simulator-state';
const EQUIPMENT_STORAGE_KEY = 'guild-skill-tree-equipment-config';

const createDefaultCharacter = (): Character => ({
  id: '1',
  name: 'キャラクター1',
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
  currentCharacterId: '1',
});

// 現在の状態を取得
export const loadGlobalState = (): GlobalState | null => {
  if (typeof window === 'undefined') {
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
    console.error('Error loading global state:', error);
  }

  return null;
};

// 状態を保存
export const saveGlobalState = (state: GlobalState): void => {
  if (typeof window === 'undefined') return;

  try {
    // 状態の整合性を確認
    if (!Array.isArray(state.characters) || !state.currentCharacterId) {
      console.error('Invalid state structure:', state);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving global state:', error);
  }
};

// 現在のキャラクターを取得
export const getCurrentCharacter = (state: GlobalState): Character | null => {
  if (!state.currentCharacterId) return null;
  return state.characters.find((char) => char.id === state.currentCharacterId) || null;
};

// キャラクターを更新
export const updateCharacter = (state: GlobalState, character: Character): GlobalState => {
  const characters = state.characters.map((char) => (char.id === character.id ? character : char));
  return { ...state, characters };
};

// キャラクターを追加
export const addCharacter = (state: GlobalState, character: Character): GlobalState => {
  // 既存のキャラクターIDと重複しないように確認
  if (state.characters.some((char) => char.id === character.id)) {
    console.error('Character with this ID already exists:', character.id);
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
  const characters = state.characters.filter((char) => char.id !== characterId);
  return {
    ...state,
    characters,
    currentCharacterId: characters.length > 0 ? characters[0].id : null,
  };
};

// スキルツリーの状態を更新
export const updateSkillTree = (
  state: GlobalState,
  characterId: string,
  skillTree: Character['skillTree']
): GlobalState => {
  const characters = state.characters.map((char) =>
    char.id === characterId ? { ...char, skillTree } : char
  );
  return { ...state, characters };
};

// Firestore: 装備設定の保存
const saveEquipmentConfigToDB = async (userId: string, config: EquipmentConfig) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      equipmentConfig: {
        ...config,
        // FirestoreのTimestampに合わせる（保存時はサーバー時刻を使用）
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
};

// Firestore: 装備設定の読み込み
const loadEquipmentConfigFromDB = async (userId: string): Promise<Equipment[] | null> => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const cfg = data?.equipmentConfig;
  if (cfg && Array.isArray(cfg.equipment)) {
    return cfg.equipment as Equipment[];
  }
  return null;
};

// 装備設定の保存
export const saveEquipmentConfig = async (equipment: Equipment[], userId?: string) => {
  const config: EquipmentConfig = {
    equipment,
    updatedAt: new Date(),
  };

  // LocalStorageに保存
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save equipment to localStorage:', error);
    }
  }

  // ログイン済みの場合はDBにも保存
  if (userId) {
    try {
      await saveEquipmentConfigToDB(userId, config);
    } catch (error) {
      console.error('Failed to save equipment to DB:', error);
    }
  }
};

// 装備設定の読み込み
export const loadEquipmentConfig = async (userId?: string): Promise<Equipment[]> => {
  // まずログイン済みならDBから読み込みを試みる
  if (userId) {
    try {
      const fromDB = await loadEquipmentConfigFromDB(userId);
      if (fromDB) {
        // DBから取得できたらLocalStorageも更新
        if (typeof window !== 'undefined') {
          const cfg: EquipmentConfig = { equipment: fromDB, updatedAt: new Date() };
          try {
            localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(cfg));
          } catch {}
        }
        return fromDB;
      }
    } catch (error) {
      console.error('Failed to load equipment from DB:', error);
    }
  }

  // LocalStorageから読み込み
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
    if (saved) {
      try {
        const config: EquipmentConfig = JSON.parse(saved);
        if (Array.isArray(config.equipment)) return config.equipment;
      } catch (error) {
        console.error('Failed to parse saved equipment:', error);
      }
    }
  }

  // デフォルトの装備設定を返す
  return [
    { id: 'right_hand', level: 0 },
    { id: 'left_hand', level: 0 },
    { id: 'body', level: 0 },
    { id: 'legs', level: 0 },
    { id: 'head', level: 0 },
    { id: 'back', level: 0 },
    { id: 'shoulder', level: 0 },
    { id: 'setup', level: 0 },
  ];
};

// 現在のユーザーIDを取得（仮実装）
export const getCurrentUserId = (): string | undefined => {
  // TODO: 認証コンテキストからユーザーIDを取得
  // 現在は未実装のため undefined を返す
  return undefined;
};
