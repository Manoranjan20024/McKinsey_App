export default function PlaceholderPage({ title, description }) {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1E3A5F", marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: "#64748B" }}>
        {description}
      </p>
    </div>
  );
}
