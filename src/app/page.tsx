import { SkillTreeSimulator } from "./components/SkillTreeSimulator";
import { WagmiProvider } from "wagmi";
import { config } from "./config/wagmi";

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <div className="min-h-screen flex flex-col w-full bg-background-dark text-text-primary">
        <header className="p-8 lg:p-16">
          <h1 className="text-2xl font-bold text-primary">ギルドスキルツリーシミュレータ</h1>
          <p className="text-sm text-text-muted">元素騎士のギルドスキルのシミュレーションができます</p>
        </header>

        <main className="flex-1 flex justify-center px-8 lg:px-16">
          <SkillTreeSimulator />
        </main>

        <footer className="flex flex-col gap-y-6 p-4 text-center text-xs text-text-muted">
          <p>© pocoapoco</p>
        </footer>
      </div>
    </WagmiProvider>
  );
}
