"use client";

import { SkillTreeSimulator } from "./components/SkillTreeSimulator";
import { AuthButton } from "./components/AuthButton";
import { CharacterSelect } from "./components/CharacterSelect";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background-dark text-text-primary">
      <header className="p-8 md:p-16 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">ギルドスキルツリーシミュレータ</h1>
          <p className="text-sm text-text-muted">元素騎士のギルドスキルのシミュレーションができます</p>
        </div>
        <div className="flex items-start w-full md:w-auto justify-between gap-4 z-10">
          <CharacterSelect />
          <AuthButton />
        </div>
      </header>

      <main className="flex-1 flex justify-center md:px-10 lg:px-16 relative">
        <SkillTreeSimulator />
      </main>

      <footer className="flex flex-col gap-y-6 p-4 text-center text-xs text-text-muted">
        <p>© pocoapoco</p>
      </footer>
    </div>
  );
}
