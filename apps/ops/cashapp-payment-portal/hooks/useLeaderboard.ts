import { useState, useEffect } from 'react';
import { leaderboardService, DonorProfile } from '@/services/leaderboardService';

export function useLeaderboard() {
  const [topDonors, setTopDonors] = useState<DonorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    setLoading(true);
    const donors = leaderboardService.getTopDonors(10);
    setTopDonors(donors);
    setLoading(false);
  };

  const refresh = () => {
    loadLeaderboard();
  };

  return {
    topDonors,
    loading,
    refresh,
  };
}
