import { useSearchParams } from "react-router-dom";

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q');

  return (
    <div className="page" style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1E3A5F", marginBottom: 8 }}>Search Results for: <strong>{query}</strong></h2>
      <p style={{ fontSize: 14, color: "#64748B" }}>Feature coming soon — claim search will be available in v2.</p>
    </div>
  );
}
