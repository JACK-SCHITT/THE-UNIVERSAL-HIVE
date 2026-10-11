export interface DonorProfile {
  id: string;
  name: string;
  totalDonated: number;
  donationCount: number;
  isAnonymous: boolean;
  joinDate: number;
  badges: string[];
  tier: 'supporter' | 'defender' | 'guardian' | 'hero';
}

const STORAGE_KEY = 'scamfighter_leaderboard';

function calculateTier(total: number): DonorProfile['tier'] {
  if (total >= 1000) return 'hero';
  if (total >= 500) return 'guardian';
  if (total >= 100) return 'defender';
  return 'supporter';
}

function calculateBadges(total: number, count: number): string[] {
  const badges: string[] = [];
  if (total >= 100) badges.push('First Century');
  if (total >= 500) badges.push('Champion');
  if (total >= 1000) badges.push('Legend');
  if (count >= 10) badges.push('Loyal Supporter');
  if (count >= 50) badges.push('Super Donor');
  return badges;
}

export const leaderboardService = {
  updateDonorStats: (amount: number, donorName?: string): void => {
    const donors = leaderboardService.getLeaderboard();
    const name = donorName || 'Anonymous';
    
    let donor = donors.find(d => d.name === name);
    
    if (!donor) {
      donor = {
        id: `donor_${Date.now()}`,
        name,
        totalDonated: 0,
        donationCount: 0,
        isAnonymous: name === 'Anonymous',
        joinDate: Date.now(),
        badges: [],
        tier: 'supporter',
      };
      donors.push(donor);
    }
    
    donor.totalDonated += amount;
    donor.donationCount += 1;
    donor.tier = calculateTier(donor.totalDonated);
    donor.badges = calculateBadges(donor.totalDonated, donor.donationCount);
    
    leaderboardService.saveLeaderboard(donors);
  },

  getLeaderboard: (): DonorProfile[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLeaderboard: (donors: DonorProfile[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  },

  getTopDonors: (limit: number = 10): DonorProfile[] => {
    return leaderboardService
      .getLeaderboard()
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, limit);
  },

  getCurrentMonthDonors: (): DonorProfile[] => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // In a real app, you'd track monthly donations separately
    // For now, we'll just return all donors
    return leaderboardService.getTopDonors();
  },
};
