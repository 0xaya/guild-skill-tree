import { db } from "../app/config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { loadGlobalState } from "../app/utils/storageUtils";
import { Character } from "../app/types/character";

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
    console.log(`Saving data for user ${userId}`);
  } catch (error) {
    console.error("Error saving character data:", error);
    return;
  }
};

// バッチ処理でデータを保存
export const batchSaveCharacterData = async (characterId: string, data: any, userId: string): Promise<void> => {
  console.log("batchSaveCharacterData called:", { characterId, data, userId });

  // 保留中の更新をキャンセル
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }

  // 新しい更新を保留
  pendingUpdate = { characterId, data, userId };
  console.log("Pending update set:", pendingUpdate);

  // タイムアウトを設定
  updateTimeout = setTimeout(async () => {
    console.log("Timeout triggered, pendingUpdate:", pendingUpdate);
    if (pendingUpdate) {
      try {
        await saveCharacterData(pendingUpdate.characterId, pendingUpdate.data, pendingUpdate.userId);
        console.log("Save completed successfully");
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

// ユーザーデータの同期
export const syncUserData = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const localData = loadGlobalState();
    const serverData = userDoc.data()?.globalState;

    if (!serverData) {
      // サーバーにデータがない場合はローカルデータを保存
      const convertedLocalData = convertDatesForFirestore(localData);
      await setDoc(userRef, { globalState: convertedLocalData }, { merge: true });
      return { type: "local-to-server", data: localData };
    }

    if (!localData) {
      // ローカルにデータがない場合はサーバーデータを使用
      // サーバーデータのupdatedAtをDateオブジェクトに変換
      const convertedServerData = {
        ...serverData,
        characters: serverData.characters.map((char: any) => ({
          ...char,
          updatedAt: new Date(char.updatedAt),
        })),
      };
      return { type: "server-to-local", data: convertedServerData };
    }

    // サーバーデータのupdatedAtをDateオブジェクトに変換
    const convertedServerData = {
      ...serverData,
      characters: serverData.characters.map((char: any) => ({
        ...char,
        updatedAt: new Date(char.updatedAt),
      })),
    };

    // キャラクターの更新日時を比較
    const localLatestUpdate = Math.max(...localData.characters.map((char: Character) => char.updatedAt.getTime()));
    const serverLatestUpdate = Math.max(
      ...convertedServerData.characters.map((char: Character) => char.updatedAt.getTime())
    );

    if (localLatestUpdate > serverLatestUpdate) {
      // ローカルデータが新しい場合はサーバーを更新
      const convertedLocalData = convertDatesForFirestore(localData);
      await setDoc(userRef, { globalState: convertedLocalData }, { merge: true });
      return { type: "local-to-server", data: localData };
    } else if (serverLatestUpdate > localLatestUpdate) {
      // サーバーデータが新しい場合はローカルを更新
      return { type: "server-to-local", data: convertedServerData };
    }

    // データが同じ場合は同期済み
    return { type: "synced", data: localData };
  } catch (error) {
    console.error("Error syncing user data:", error);
    throw error;
  }
};

// 同期の競合を解決
export const resolveSyncConflict = async (userId: string, useLocalData: boolean, localData: any, serverData: any) => {
  try {
    const userRef = doc(db, "users", userId);
    const dataToUse = useLocalData ? localData : serverData;
    await setDoc(userRef, { globalState: dataToUse }, { merge: true });
    return dataToUse;
  } catch (error) {
    console.error("Error resolving sync conflict:", error);
    throw error;
  }
};
