export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F0F0F0",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          textAlign: "center",
          maxWidth: 720,
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#101010" }}>
          Clube Quinze Veranistas
        </h1>
        <p style={{ marginTop: 12, color: "#4B5563", lineHeight: 1.6 }}>
          Sistema de gestão do futebol do clube.
        </p>
      </div>
    </main>
  );
}
