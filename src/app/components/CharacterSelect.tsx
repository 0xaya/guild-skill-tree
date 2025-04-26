"use client";

import { useState, useEffect } from "react";
import { useCharacter } from "../contexts/CharacterContext";
import { Button } from "./ui/Button";
import { PlusIcon, TrashIcon } from "./ui/Icons";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Dialog } from "./ui/Dialog";
import { Tooltip } from "./ui/Tooltip";

export function CharacterSelect() {
  const { characters, currentCharacter, setCurrentCharacter, addCharacter, updateCharacter, deleteCharacter } =
    useCharacter();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAddCharacter = async () => {
    if (!newCharacterName) return;
    await addCharacter(newCharacterName);
    setNewCharacterName("");
    setShowAddMenu(false);
  };

  const handleEditName = async () => {
    if (!editingCharacterId || !editName) return;
    await updateCharacter(editingCharacterId, { name: editName });
    setIsEditing(false);
    setEditingCharacterId(null);
  };

  const handleDelete = async () => {
    if (!editingCharacterId) return;
    await deleteCharacter(editingCharacterId);
    setIsEditing(false);
    setEditingCharacterId(null);
    setIsDeleteDialogOpen(false);
  };

  // キャラクター追加メニューを閉じる
  const handleCloseAddMenu = () => {
    setShowAddMenu(false);
    setNewCharacterName("");
  };

  // キャラクター追加メニューを開く
  const handleOpenAddMenu = () => {
    console.log("Opening add menu");
    setShowAddMenu(true);
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCharacterId(null);
    setEditName("");
  };

  if (characters.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={handleOpenAddMenu} variant="primary" className="text-sm">
          <PlusIcon />
          キャラクター追加
        </Button>

        {showAddMenu && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64">
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
                  <Button onClick={handleCloseAddMenu} variant="outline" className="text-sm">
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddCharacter}
                    variant="primary"
                    className="text-sm"
                    disabled={!newCharacterName}
                  >
                    追加
                  </Button>
                </div>
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
          <Tooltip text="キャラクターを削除">
            <Button onClick={() => setIsDeleteDialogOpen(true)} variant="primary" icon={<TrashIcon />} isIconOnly />
          </Tooltip>
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
          <Button onClick={handleCancelEdit} variant="outline" className="text-sm">
            キャンセル
          </Button>
        </div>
      ) : (
        <>
          <Select
            value={currentCharacter?.id || ""}
            onChange={value => {
              console.log("Select onChange:", value);
              if (value === "add-new") {
                handleOpenAddMenu();
              } else {
                const character = characters.find(c => c.id === value);
                setCurrentCharacter(character || null);
              }
            }}
            onEdit={value => {
              const character = characters.find(c => c.id === value);
              if (character) {
                setEditingCharacterId(character.id);
                setEditName(character.name);
                setIsEditing(true);
              }
            }}
            keepOpenOnSelect={value => value === "add-new"}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background-dark/80 border border-primary/80 rounded-lg shadow-lg p-4 w-64">
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
                <Button onClick={handleCloseAddMenu} variant="outline" className="text-sm">
                  キャンセル
                </Button>
                <Button onClick={handleAddCharacter} variant="primary" className="text-sm" disabled={!newCharacterName}>
                  追加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="キャラクターの削除"
        description={`${characters.find(c => c.id === editingCharacterId)?.name}を削除してもよろしいですか？`}
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleDelete}
      />
    </div>
  );
}
