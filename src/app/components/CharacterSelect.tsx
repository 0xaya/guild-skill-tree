"use client";

import { useState } from "react";
import { useCharacter } from "../contexts/CharacterContext";
import { Button } from "./ui/Button";
import { PlusIcon, PencilIcon } from "./ui/Icons";

export function CharacterSelect() {
  const { characters, currentCharacter, setCurrentCharacter, addCharacter, updateCharacter } = useCharacter();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const handleAddCharacter = async () => {
    if (!newCharacterName) return;
    await addCharacter(newCharacterName);
    setNewCharacterName("");
    setShowAddMenu(false);
  };

  const handleEditName = async () => {
    if (!currentCharacter || !editName) return;
    await updateCharacter(currentCharacter.id, { name: editName });
    setIsEditing(false);
  };

  if (characters.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowAddMenu(true)} variant="primary" className="text-sm">
          新規キャラクター作成
        </Button>

        {showAddMenu && (
          <div className="absolute top-full left-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64 z-10">
            <h3 className="text-sm font-bold mb-3">新規キャラクター</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">名前</label>
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={e => setNewCharacterName(e.target.value)}
                  className="w-full bg-background-dark border border-primary/80 rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="キャラクター名"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setShowAddMenu(false)} variant="outline" className="text-sm">
                  キャンセル
                </Button>
                <Button onClick={handleAddCharacter} variant="primary" className="text-sm" disabled={!newCharacterName}>
                  追加
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="bg-background-dark border border-primary/80 rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="キャラクター名"
          />
          <Button onClick={handleEditName} variant="primary" className="text-sm">
            保存
          </Button>
          <Button onClick={() => setIsEditing(false)} variant="outline" className="text-sm">
            キャンセル
          </Button>
        </div>
      ) : (
        <>
          <select
            value={currentCharacter?.id}
            onChange={e => {
              const character = characters.find(c => c.id === e.target.value);
              setCurrentCharacter(character || null);
            }}
            className="bg-background-dark border border-primary/80 rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {characters.map(character => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => {
              setIsEditing(true);
              setEditName(currentCharacter?.name || "");
            }}
            variant="outline"
            className="p-1.5"
          >
            <PencilIcon size={16} />
          </Button>

          <Button onClick={() => setShowAddMenu(!showAddMenu)} variant="outline" className="p-1.5">
            <PlusIcon size={16} />
          </Button>
        </>
      )}

      {showAddMenu && (
        <div className="absolute top-full left-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 className="text-sm font-bold mb-3">新規キャラクター</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">名前</label>
              <input
                type="text"
                value={newCharacterName}
                onChange={e => setNewCharacterName(e.target.value)}
                className="w-full bg-background-dark border border-primary/80 rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="キャラクター名"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowAddMenu(false)} variant="outline" className="text-sm">
                キャンセル
              </Button>
              <Button onClick={handleAddCharacter} variant="primary" className="text-sm" disabled={!newCharacterName}>
                追加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
