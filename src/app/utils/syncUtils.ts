import { GlobalState } from "../types/character";
import { loadGlobalState, saveGlobalState, getDefaultState } from "./storageUtils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

function isDataDifferent(localData: GlobalState, serverData: GlobalState): boolean {
  console.log("Comparing data:", {
    localData,
    serverData,
  });

  // ローカルデータが存在しない場合はtrueを返す（同期確認ダイアログを表示）
  if (!localData || !localData.characters || localData.characters.length === 0) {
    console.log("Local data is empty");
    return true;
  }

  // 基本的なプロパティの比較
  if (localData.guildRank !== serverData.guildRank) {
    console.log("Guild rank is different:", {
      local: localData.guildRank,
      server: serverData.guildRank,
    });
    return true;
  }
  if (localData.currentCharacterId !== serverData.currentCharacterId) {
    console.log("Current character ID is different:", {
      local: localData.currentCharacterId,
      server: serverData.currentCharacterId,
    });
    return true;
  }

  // キャラクターの比較
  if (localData.characters.length !== serverData.characters.length) {
    console.log("Number of characters is different:", {
      local: localData.characters.length,
      server: serverData.characters.length,
    });
    return true;
  }

  for (let i = 0; i < localData.characters.length; i++) {
    const localChar = localData.characters[i];
    const serverChar = serverData.characters.find(c => c.id === localChar.id);
    if (!serverChar) {
      console.log("Character not found in server data:", localChar.id);
      return true;
    }

    // createdAt, updatedAtは比較から除外
    if (localChar.name !== serverChar.name) {
      console.log("Character name is different:", {
        local: localChar.name,
        server: serverChar.name,
      });
      return true;
    }

    // スキルツリーの比較
    const localSkills = localChar.skillTree.selectedSkills;
    const serverSkills = serverChar.skillTree.selectedSkills;
    const localAcquired = localChar.skillTree.acquiredSkills;
    const serverAcquired = serverChar.skillTree.acquiredSkills;

    // 選択されたスキルの比較
    if (Object.keys(localSkills).length !== Object.keys(serverSkills).length) {
      console.log("Number of selected skills is different:", {
        local: Object.keys(localSkills).length,
        server: Object.keys(serverSkills).length,
      });
      return true;
    }
    for (const [skillId, level] of Object.entries(localSkills)) {
      if (serverSkills[skillId] !== level) {
        console.log("Selected skill level is different:", {
          skillId,
          local: level,
          server: serverSkills[skillId],
        });
        return true;
      }
    }

    // 取得済みスキルの比較
    if (Object.keys(localAcquired).length !== Object.keys(serverAcquired).length) {
      console.log("Number of acquired skills is different:", {
        local: Object.keys(localAcquired).length,
        server: Object.keys(serverAcquired).length,
      });
      return true;
    }
    for (const [skillId, level] of Object.entries(localAcquired)) {
      if (serverAcquired[skillId] !== level) {
        console.log("Acquired skill level is different:", {
          skillId,
          local: level,
          server: serverAcquired[skillId],
        });
        return true;
      }
    }
  }

  console.log("Data is identical");
  return false;
}

type SyncResult =
  | { type: "local-to-server"; data: GlobalState }
  | { type: "server-to-local"; data: GlobalState }
  | { type: "conflict"; localData: GlobalState; serverData: GlobalState }
  | { type: "synced"; data: GlobalState };

export async function syncUserData(userId: string): Promise<SyncResult> {
  try {
    // ログアウト状態の場合は同期を行わない
    const wasLoggedOut = localStorage.getItem("wasLoggedOut") === "true";
    if (wasLoggedOut) {
      return { type: "synced", data: getDefaultState() };
    }

    // ローカルデータの取得
    const localData = loadGlobalState();

    // サーバーデータの取得
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const serverData = userDoc.exists() ? userDoc.data().globalState : null;

    // 新規アドレスの場合
    if (!serverData) {
      // 新規アドレスの場合は常にデフォルト状態を使用
        const defaultState = getDefaultState();
        await setDoc(userRef, { globalState: defaultState }, { merge: true });
        saveGlobalState(defaultState); // ローカルストレージを更新
        return { type: "local-to-server", data: defaultState };
    }

    // 既存アドレスの場合
    if (!localData) {
      // ローカルデータがない場合は、サーバーデータをそのまま使用
      saveGlobalState(serverData); // ローカルストレージを更新
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
