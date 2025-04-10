import { SkillTreeSimulator } from "./components/SkillTreeSimulator";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <header
        style={{
          padding: "1rem",
          borderBottom: "1px solid #333",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#e879f9",
          }}
        >
          ギルドスキルツリーシミュレータ
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#999",
          }}
        >
          元素騎士オンライン - ギルドスキルのシミュレーションができます
        </p>
      </header>

      <main
        style={{
          flex: "1",
          display: "flex",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <SkillTreeSimulator />
      </main>

      <footer
        style={{
          padding: "1rem",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#666",
          borderTop: "1px solid #333",
        }}
      >
        <p>© pocoapoco</p>
      </footer>
    </div>
  );
}
