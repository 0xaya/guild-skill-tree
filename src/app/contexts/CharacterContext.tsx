"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

interface Character {
  id: string;
  name: string;
  skillTree: any; // スキルツリーの型は後で定義
  createdAt: any;
  updatedAt: any;
}

interface CharacterContextType {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  error: string | null;
  addCharacter: (name: string) => Promise<void>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "guild-skill-tree-characters";

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LocalStorageからデータを読み込む
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const { characters: savedCharacters, currentCharacterId } = JSON.parse(savedData);
        setCharacters(savedCharacters);
        const current = savedCharacters.find((c: Character) => c.id === currentCharacterId) || savedCharacters[0];
        setCurrentCharacter(current);
      } else {
        // 初回アクセス時はデフォルトキャラクターを作成
        const defaultCharacter = {
          id: "default",
          name: "キャラクター1",
          skillTree: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Character;
        setCharacters([defaultCharacter]);
        setCurrentCharacter(defaultCharacter);
        // LocalStorageに保存
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            characters: [defaultCharacter],
            currentCharacterId: defaultCharacter.id,
          })
        );
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
      setError("データの読み込みに失敗しました");
    }
  };

  // LocalStorageにデータを保存
  const saveToLocalStorage = (newCharacters: Character[], currentId: string) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          characters: newCharacters,
          currentCharacterId: currentId,
        })
      );
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
      setError("データの保存に失敗しました");
    }
  };

  // デフォルトキャラクターの作成
  const createDefaultCharacter = async (uid: string) => {
    try {
      const charactersRef = collection(db, "users", uid, "characters");
      const newCharacter = {
        name: "キャラクター1",
        skillTree: {}, // 初期状態
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(charactersRef, newCharacter);
      const character = {
        id: docRef.id,
        ...newCharacter,
      } as Character;

      setCharacters([character]);
      setCurrentCharacter(character);
    } catch (err) {
      console.error("Failed to create default character:", err);
      setError("デフォルトキャラクターの作成に失敗しました");
    }
  };

  // キャラクター一覧の取得
  const fetchCharacters = async () => {
    if (!user || !isAuthenticated) {
      loadFromLocalStorage();
      setLoading(false);
      return;
    }

    try {
      const uid = "address" in user ? user.address : user.uid;
      const charactersRef = collection(db, "users", uid, "characters");
      const snapshot = await getDocs(charactersRef);
      const charactersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Character[];

      if (charactersList.length === 0) {
        // キャラクターが存在しない場合はデフォルトキャラクターを作成
        await createDefaultCharacter(uid);
      } else {
        setCharacters(charactersList);
        setCurrentCharacter(charactersList[0]);
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
      setError("キャラクターの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // キャラクターの追加
  const addCharacter = async (name: string) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageに保存
      const newCharacter = {
        id: `local-${Date.now()}`,
        name,
        skillTree: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Character;

      const newCharacters = [...characters, newCharacter];
      setCharacters(newCharacters);
      setCurrentCharacter(newCharacter);
      saveToLocalStorage(newCharacters, newCharacter.id);
      return;
    }

    try {
      const uid = "address" in user ? user.address : user.uid;
      const charactersRef = collection(db, "users", uid, "characters");
      const newCharacter = {
        name,
        skillTree: {}, // 初期状態
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(charactersRef, newCharacter);
      const character = {
        id: docRef.id,
        ...newCharacter,
      } as Character;

      setCharacters(prev => [...prev, character]);
      setCurrentCharacter(character);
    } catch (err) {
      console.error("Failed to add character:", err);
      setError("キャラクターの追加に失敗しました");
    }
  };

  // キャラクターの更新
  const updateCharacter = async (id: string, data: Partial<Character>) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageを更新
      const newCharacters = characters.map(char =>
        char.id === id ? { ...char, ...data, updatedAt: new Date() } : char
      );
      setCharacters(newCharacters);
      if (currentCharacter?.id === id) {
        setCurrentCharacter(prev => (prev ? { ...prev, ...data, updatedAt: new Date() } : null));
      }
      saveToLocalStorage(newCharacters, currentCharacter?.id || "");
      return;
    }

    try {
      const uid = "address" in user ? user.address : user.uid;
      const characterRef = doc(db, "users", uid, "characters", id);
      await updateDoc(characterRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      setCharacters(prev => prev.map(char => (char.id === id ? { ...char, ...data, updatedAt: new Date() } : char)));

      if (currentCharacter?.id === id) {
        setCurrentCharacter(prev => (prev ? { ...prev, ...data, updatedAt: new Date() } : null));
      }
    } catch (err) {
      console.error("Failed to update character:", err);
      setError("キャラクターの更新に失敗しました");
    }
  };

  // キャラクターの削除
  const deleteCharacter = async (id: string) => {
    if (!user || !isAuthenticated) {
      // 未ログイン時はLocalStorageから削除
      const newCharacters = characters.filter(char => char.id !== id);
      setCharacters(newCharacters);
      if (currentCharacter?.id === id) {
        setCurrentCharacter(newCharacters.length > 0 ? newCharacters[0] : null);
      }
      saveToLocalStorage(newCharacters, newCharacters.length > 0 ? newCharacters[0].id : "");
      return;
    }

    try {
      const uid = "address" in user ? user.address : user.uid;
      const characterRef = doc(db, "users", uid, "characters", id);
      await deleteDoc(characterRef);

      setCharacters(prev => prev.filter(char => char.id !== id));
      if (currentCharacter?.id === id) {
        const remainingCharacters = characters.filter(char => char.id !== id);
        setCurrentCharacter(remainingCharacters.length > 0 ? remainingCharacters[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete character:", err);
      setError("キャラクターの削除に失敗しました");
    }
  };

  // 認証状態が変更されたときにキャラクター一覧を取得
  useEffect(() => {
    fetchCharacters();
  }, [user, isAuthenticated]);

  const value = {
    characters,
    currentCharacter,
    loading,
    error,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setCurrentCharacter,
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
