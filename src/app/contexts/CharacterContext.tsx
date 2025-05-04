"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Character, GlobalState } from "../types/character";
import {
  loadGlobalState,
  saveGlobalState,
  addCharacter as addCharacterToState,
  updateCharacter as updateCharacterInState,
  deleteCharacter as deleteCharacterFromState,
  getDefaultState,
} from "../utils/storageUtils";
import { batchSaveCharacterData } from "../../utils/syncUtils";

interface CharacterContextType {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  error: string | null;
  addCharacter: (name: string) => Promise<void>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  globalState: GlobalState;
  setGlobalState: (state: GlobalState) => void;
  resetState: () => void;
  refreshGlobalState: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [globalState, setGlobalState] = useState<GlobalState>(() => {
    const loadedState = loadGlobalState();
    return loadedState || getDefaultState();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const characters = globalState.characters;
  const currentCharacter = characters.find(char => char.id === globalState.currentCharacterId) || null;

  // 状態をリセット
  const resetState = React.useCallback(() => {
    console.log("CharacterContext: resetState called");
    const defaultState = getDefaultState();
    console.log("CharacterContext: defaultState", defaultState);
    // LocalStorageをクリア
    localStorage.removeItem("guild-skill-tree-simulator-state");
    // 状態を更新
    setGlobalState(defaultState);
    saveGlobalState(defaultState);
  }, [setGlobalState]);

  // 同期完了イベントをリッスン
  useEffect(() => {
    const handleSyncComplete = (event: CustomEvent) => {
      const newState = event.detail;
      setGlobalState(newState);
    };

    window.addEventListener("syncComplete", handleSyncComplete as EventListener);
    return () => window.removeEventListener("syncComplete", handleSyncComplete as EventListener);
  }, []);

  // 状態リセットイベントをリッスン
  useEffect(() => {
    console.log("CharacterContext: setting up reset-state event listener");
    const handleResetState = () => {
      console.log("CharacterContext: reset-state event received");
      resetState();
    };

    window.addEventListener("reset-state", handleResetState);
    return () => {
      console.log("CharacterContext: removing reset-state event listener");
      window.removeEventListener("reset-state", handleResetState);
    };
  }, [resetState]);

  // グローバルステートをリフレッシュ
  const refreshGlobalState = () => {
    const newState = loadGlobalState();
    setGlobalState(newState || getDefaultState());
  };

  // キャラクターの追加
  const addCharacter = async (name: string) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageに保存
      const newCharacter = {
        id: `local-${Date.now()}`,
        name,
        skillTree: {
          selectedSkills: { core: 1 },
          acquiredSkills: {},
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Character;

      const newState = addCharacterToState(globalState, newCharacter);
      setGlobalState(newState);
      saveGlobalState(newState);
      return;
    }

    try {
      const newCharacter = {
        id: `${Date.now()}`,
        name,
        skillTree: {
          selectedSkills: { core: 1 },
          acquiredSkills: {},
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Character;
      const newState = addCharacterToState(globalState, newCharacter);
      await batchSaveCharacterData(user.uid, { globalState: newState }, user.uid);
      setGlobalState(newState);
      saveGlobalState(newState);
    } catch (err) {
      console.error("Failed to add character:", err);
      setError("キャラクターの追加に失敗しました");
    }
  };

  // キャラクターの更新
  const updateCharacter = async (id: string, data: Partial<Character>) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageを更新
      const character = characters.find(char => char.id === id);
      if (!character) return;

      const updatedCharacter = {
        ...character,
        ...data,
        updatedAt: new Date(),
      };

      const newState = updateCharacterInState(globalState, updatedCharacter);
      setGlobalState(newState);
      saveGlobalState(newState);
      return;
    }

    try {
      const updatedCharacters = globalState.characters.map(char =>
        char.id === id ? { ...char, ...data, updatedAt: new Date() } : char
      );
      const newState = { ...globalState, characters: updatedCharacters };
      await batchSaveCharacterData(user.uid, { globalState: newState }, user.uid);
      setGlobalState(newState);
      saveGlobalState(newState);
    } catch (err) {
      console.error("Failed to update character:", err);
      setError("キャラクターの更新に失敗しました");
    }
  };

  // キャラクターの削除
  const deleteCharacter = async (id: string) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageから削除
      const newState = deleteCharacterFromState(globalState, id);
      setGlobalState(newState);
      saveGlobalState(newState);
      return;
    }

    try {
      const updatedCharacters = globalState.characters.filter(char => char.id !== id);
      const newState = { ...globalState, characters: updatedCharacters };
      await batchSaveCharacterData(user.uid, { globalState: newState }, user.uid);
      setGlobalState(newState);
      saveGlobalState(newState);
    } catch (err) {
      console.error("Failed to delete character:", err);
      setError("キャラクターの削除に失敗しました");
    }
  };

  // 現在のキャラクターを設定
  const setCurrentCharacter = async (character: Character | null) => {
    if (character) {
      const newState = {
        ...globalState,
        currentCharacterId: character.id,
      };
      setGlobalState(newState);
      saveGlobalState(newState);

      // サーバーにも反映
      if (user && isAuthenticated) {
        await batchSaveCharacterData(user.uid, { globalState: newState }, user.uid);
      }
    }
  };

  const value = {
    characters,
    currentCharacter,
    loading,
    error,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setCurrentCharacter,
    globalState,
    setGlobalState,
    resetState,
    refreshGlobalState,
  };

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
}
