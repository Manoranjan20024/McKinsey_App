import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';

export function useDashboardStats(pollingInterval = 30000) {
  const [stats, setStats] = useState({
    documents_today: 0,
    auto_approved: 0,
    human_review: 0,
    avg_check_time: '0s'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (pollingInterval > 0) {
      const interval = setInterval(fetchStats, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [pollingInterval]);

  return { stats, loading, error, refresh: fetchStats };
}
