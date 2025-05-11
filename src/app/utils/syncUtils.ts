import { db } from "../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { loadGlobalState, saveGlobalState, getDefaultState } from "./storageUtils";
import { Character, GlobalState } from "../types/character";

// データの比較関数
const isDataDifferent = (localData: GlobalState, serverData: GlobalState): boolean => {
  // ローカルデータが存在しない場合はtrueを返す（同期確認ダイアログを表示）
  if (!localData || !localData.characters || localData.characters.length === 0) {
    return true;
  }

  // 基本的なプロパティの比較
  if (localData.currentCharacterId !== serverData.currentCharacterId) {
    return true;
  }

  // キャラクターの比較
  if (localData.characters.length !== serverData.characters.length) {
    return true;
  }

  for (let i = 0; i < localData.characters.length; i++) {
    const localChar = localData.characters[i];
    const serverChar = serverData.characters.find(c => c.id === localChar.id);
    if (!serverChar) {
      return true;
    }

    // createdAt, updatedAtは比較から除外
    if (localChar.name !== serverChar.name) {
      return true;
    }

    // スキルツリーの比較
    const localSkills = localChar.skillTree.selectedSkills;
    const serverSkills = serverChar.skillTree.selectedSkills;
    const localAcquired = localChar.skillTree.acquiredSkills;
    const serverAcquired = serverChar.skillTree.acquiredSkills;

    // 選択されたスキルの比較
    if (Object.keys(localSkills).length !== Object.keys(serverSkills).length) {
      return true;
    }
    for (const [skillId, level] of Object.entries(localSkills)) {
      if (serverSkills[skillId] !== level) {
        return true;
      }
    }

    // 取得済みスキルの比較
    if (Object.keys(localAcquired).length !== Object.keys(serverAcquired).length) {
      return true;
    }
    for (const [skillId, level] of Object.entries(localAcquired)) {
      if (serverAcquired[skillId] !== level) {
        return true;
      }
    }
  }

  return false;
};

// DateオブジェクトをFirestore用に変換する関数
const convertDatesForFirestore = (data: any): any => {
  // nullやundefinedの場合はそのまま返す
  if (data == null) {
    return data;
  }

  // Dateオブジェクトの場合
  if (data instanceof Date && !isNaN(data.getTime())) {
    try {
      return data.toISOString();
    } catch (error) {
      console.error("Invalid date:", data);
      return new Date().toISOString();
    }
  }

  // 配列の場合
  if (Array.isArray(data)) {
    return data.map(item => convertDatesForFirestore(item));
  }

  // オブジェクトの場合（Dateオブジェクトは除外）
  if (data && typeof data === "object" && !(data instanceof Date)) {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertDatesForFirestore(value);
    }
    return converted;
  }

  // その他の値はそのまま返す
  return data;
};

// バッチ処理用の変数
let pendingUpdate: { characterId: string; data: any; userId: string } | null = null;
let updateTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY = 10000; // 10秒

// データを保存する関数
const saveCharacterData = async (characterId: string, data: any, userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);

    // データの検証
    if (!data || typeof data !== "object") {
      console.error("Invalid data format:", data);
      return;
    }

    const convertedData = convertDatesForFirestore(data);
    await setDoc(userRef, convertedData, { merge: true });
  } catch (error) {
    console.error("Error saving character data:", error);
    return;
  }
};

// バッチ処理でデータを保存
export const batchSaveCharacterData = async (characterId: string, data: any, userId: string): Promise<void> => {
  // 保留中の更新をキャンセル
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }

  // 新しい更新を保留
  pendingUpdate = { characterId, data, userId };

  // タイムアウトを設定
  updateTimeout = setTimeout(async () => {
    if (pendingUpdate) {
      try {
        await saveCharacterData(pendingUpdate.characterId, pendingUpdate.data, pendingUpdate.userId);
        pendingUpdate = null;
        updateTimeout = null;
      } catch (error) {
        console.error("Error in batch save:", error);
        pendingUpdate = null;
        updateTimeout = null;
      }
    }
  }, BATCH_DELAY);
};

// 保留中の更新を即時保存
export const flushPendingUpdates = async (): Promise<void> => {
  if (pendingUpdate && updateTimeout) {
    clearTimeout(updateTimeout);
    try {
      await saveCharacterData(pendingUpdate.characterId, pendingUpdate.data, pendingUpdate.userId);
      pendingUpdate = null;
      updateTimeout = null;
    } catch (error) {
      console.error("Error in flush pending updates:", error);
      pendingUpdate = null;
      updateTimeout = null;
    }
  }
};

type SyncResult =
  | { type: "local-to-server"; data: GlobalState }
  | { type: "server-to-local"; data: GlobalState }
  | { type: "conflict"; localData: GlobalState; serverData: GlobalState }
  | { type: "synced"; data: GlobalState };

// ユーザーデータの同期
export const syncUserData = async (userId: string): Promise<SyncResult> => {
  try {
    // ローカルデータの取得
    const localData = loadGlobalState();

    // サーバーデータの取得
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const serverData = userDoc.exists() ? userDoc.data().globalState : null;

    // 新規アドレスの場合
    if (!serverData) {
      if (localData) {
        // ローカルデータがある場合は、そのデータをサーバーに保存
        await setDoc(userRef, { globalState: localData }, { merge: true });
        return { type: "local-to-server", data: localData };
      } else {
        // ローカルデータもない場合はデフォルト状態を使用
        const defaultState = getDefaultState();
        await setDoc(userRef, { globalState: defaultState }, { merge: true });
        saveGlobalState(defaultState);
        return { type: "local-to-server", data: defaultState };
      }
    }

    // 既存アドレスの場合
    if (!localData) {
      // ローカルデータがない場合は、サーバーデータをそのまま使用
      saveGlobalState(serverData);
      return { type: "server-to-local", data: serverData };
    }

    // データの比較
    const isDifferent = isDataDifferent(localData, serverData);

    if (isDifferent) {
      // データが異なる場合は競合として扱う
      return { type: "conflict", localData, serverData };
    }

    // データが同じ場合は同期済みとして扱う
    return { type: "synced", data: serverData };
  } catch (error) {
    console.error("Failed to sync user data:", error);
    throw error;
  }
};

// 同期の競合を解決
export const resolveSyncConflict = async (userId: string, useLocalData: boolean, localData: any, serverData: any) => {
  try {
    const userRef = doc(db, "users", userId);
    const dataToUse = useLocalData ? localData : serverData;

    // 選択されたデータをサーバーに保存
    await setDoc(userRef, { globalState: dataToUse }, { merge: true });

    // ローカルストレージも更新
    saveGlobalState(dataToUse);

    return dataToUse;
  } catch (error) {
    console.error("Failed to resolve sync conflict:", error);
    throw error;
  }
};
