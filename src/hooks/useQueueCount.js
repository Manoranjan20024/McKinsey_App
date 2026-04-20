import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

export function useQueueCount() {
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue/count`);
      const data = await res.json();
      setCount(data.pending_count);
    } catch (err) {
      setError("Failed to fetch queue count");
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  return { count, error };
}
