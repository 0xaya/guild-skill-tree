import { GlobalState } from "../types/character";
import { loadGlobalState, saveGlobalState } from "./storageUtils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

function isDataDifferent(localData: GlobalState, serverData: GlobalState): boolean {
  // 基本的なプロパティの比較
  if (localData.guildRank !== serverData.guildRank) return true;
  if (localData.currentCharacterId !== serverData.currentCharacterId) return true;

  // キャラクターの比較
  if (localData.characters.length !== serverData.characters.length) return true;

  for (let i = 0; i < localData.characters.length; i++) {
    const localChar = localData.characters[i];
    const serverChar = serverData.characters.find(c => c.id === localChar.id);
    if (!serverChar) return true;

    // createdAt, updatedAtは比較から除外
    if (localChar.name !== serverChar.name) return true;

    // スキルツリーの比較
    const localSkills = localChar.skillTree.selectedSkills;
    const serverSkills = serverChar.skillTree.selectedSkills;
    const localAcquired = localChar.skillTree.acquiredSkills;
    const serverAcquired = serverChar.skillTree.acquiredSkills;

    // 選択されたスキルの比較
    if (Object.keys(localSkills).length !== Object.keys(serverSkills).length) return true;
    for (const [skillId, level] of Object.entries(localSkills)) {
      if (serverSkills[skillId] !== level) return true;
    }

    // 取得済みスキルの比較
    if (Object.keys(localAcquired).length !== Object.keys(serverAcquired).length) return true;
    for (const [skillId, level] of Object.entries(localAcquired)) {
      if (serverAcquired[skillId] !== level) return true;
    }
  }

  return false;
}

export async function syncUserData(userId: string) {
  try {
    // ローカルデータの取得
    const localData = loadGlobalState();

    // サーバーデータの取得
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const serverData = userDoc.exists() ? userDoc.data().globalState : null;

    if (!serverData) {
      // サーバーにデータが存在しない場合、ローカルデータを保存
      await setDoc(userRef, { globalState: localData }, { merge: true });
      return { type: "local-to-server" as const, data: localData };
    }

    // データの比較
    const isDifferent = isDataDifferent(localData, serverData);
    if (isDifferent) {
      return { type: "conflict" as const, localData, serverData };
    }

    return { type: "synced" as const, data: serverData };
  } catch (error) {
    console.error("Failed to sync user data:", error);
    throw error;
  }
}

export async function resolveSyncConflict(
  userId: string,
  useLocalData: boolean,
  localData: GlobalState,
  serverData: GlobalState
) {
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
}
