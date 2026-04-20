import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

export default function BackendStatusBadge() {
  const [status, setStatus] = useState('checking');
  const [model, setModel] = useState('');
  const [ragStatus, setRagStatus] = useState('');

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      setStatus(data.status === 'ok' ? 'online' : 'degraded');
      setModel(data.model);
      setRagStatus(data.rag_status);
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const labels = {
    checking: 'Connecting...',
    online:   'Primary Node',
    degraded: 'Degraded',
    offline:  'Backend Offline',
  };
  const colors = {
    checking: '#94A3B8',
    online:   '#059669',
    degraded: '#D97706',
    offline:  '#DC2626',
  };

  return (
    <div
      title={status === 'online' ? `${model} | RAG: ${ragStatus}` : 'Backend unreachable'}
      style={{
        background: colors[status] + '33',
        border: `1px solid ${colors[status]}66`,
        color: colors[status],
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <span>{status === 'online' ? '●' : '○'}</span>
      {labels[status]}
    </div>
  );
}
