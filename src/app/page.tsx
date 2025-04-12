import { SkillTreeSimulator } from "./components/SkillTreeSimulator";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background-dark text-text-primary">
      <header className="p-4 border-b border-background-light">
        <h1 className="text-2xl font-bold text-primary">ギルドスキルツリーシミュレータ</h1>
        <p className="text-sm text-text-muted">元素騎士オンライン - ギルドスキルのシミュレーションができます</p>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <SkillTreeSimulator />
      </main>

      <footer className="flex flex-col gap-y-6 p-4 text-center text-xs text-text-muted border-t border-background-light">
        <p>© pocoapoco</p>
      </footer>
    </div>
  );
}
