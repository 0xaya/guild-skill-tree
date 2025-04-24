"use client";

import { useState } from "react";
import { useCharacter } from "../contexts/CharacterContext";
import { Button } from "./ui/Button";
import { PlusIcon } from "./ui/Icons";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";

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
          <PlusIcon />
          キャラクター追加
        </Button>

        {showAddMenu && (
          <div className="absolute top-full left-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64 z-10">
            <h3 className="text-sm font-bold mb-3">キャラクターを追加</h3>
            <div className="space-y-3">
              <Input
                value={newCharacterName}
                onChange={e => setNewCharacterName(e.target.value)}
                variant="outline"
                inputSize="sm"
                placeholder="キャラクター名"
              />
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
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            variant="outline"
            inputSize="md"
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
          <Select
            value={currentCharacter?.id || ""}
            onChange={value => {
              if (value === "add-new") {
                setShowAddMenu(true);
              } else {
                const character = characters.find(c => c.id === value);
                setCurrentCharacter(character || null);
              }
            }}
            onEdit={value => {
              const character = characters.find(c => c.id === value);
              if (character) {
                setIsEditing(true);
                setEditName(character.name);
              }
            }}
            options={[
              ...characters.map(character => ({
                value: character.id,
                label: character.name,
              })),
              { value: "add-new", label: "キャラクター追加" },
            ]}
            className="min-w-[150px] max-w-[60vw] md:w-60 md:max-w-[240px]"
            variant="outline"
          />
        </>
      )}

      {showAddMenu && (
        <div className="absolute top-full left-0 mt-2 bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64 z-10">
          <h3 className="text-sm font-bold mb-3">キャラクターを追加</h3>
          <div className="space-y-3">
            <Input
              value={newCharacterName}
              onChange={e => setNewCharacterName(e.target.value)}
              variant="outline"
              inputSize="md"
              placeholder="キャラクター名"
            />
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
