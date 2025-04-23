"use client";

import { SkillTreeSimulator } from "./components/SkillTreeSimulator";
import { AuthButton } from "./components/AuthButton";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background-dark text-text-primary">
      <header className="p-8 lg:p-16 flex justify-between items-start gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">ギルドスキルツリーシミュレータ</h1>
          <p className="text-sm text-text-muted">元素騎士のギルドスキルのシミュレーションができます</p>
        </div>
        <AuthButton />
      </header>

      <main className="flex-1 flex justify-center px-8 lg:px-16 relative">
        <SkillTreeSimulator />
      </main>

      <footer className="flex flex-col gap-y-6 p-4 text-center text-xs text-text-muted">
        <p>© pocoapoco</p>
      </footer>
    </div>
  );
}
