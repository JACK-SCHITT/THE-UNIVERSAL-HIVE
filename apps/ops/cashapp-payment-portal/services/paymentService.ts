export interface PaymentRecord {
  id: string;
  amount: number;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  recipient: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
}

const STORAGE_KEY = 'scamfighter_donation_history';

export const paymentService = {
  processDonation: async (amount: number, donorName?: string): Promise<PaymentResult> => {
    // Simulate donation processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const transactionId = `SF${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    const donation: PaymentRecord = {
      id: transactionId,
      amount,
      timestamp: Date.now(),
      status: 'completed',
      recipient: '$JACKSCHITT1134',
    };

    // Save to history
    const history = paymentService.getPaymentHistory();
    history.unshift(donation);
    paymentService.savePaymentHistory(history);

    // Update leaderboard
    if (typeof window !== 'undefined') {
      const { leaderboardService } = require('./leaderboardService');
      leaderboardService.updateDonorStats(amount, donorName);
    }

    return {
      success: true,
      transactionId,
      message: 'Donation completed successfully! Thank you for fighting scams!',
    };
  },

  getPaymentHistory: (): PaymentRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  savePaymentHistory: (history: PaymentRecord[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save payment history:', error);
    }
  },

  clearHistory: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
