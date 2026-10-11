export interface Subscription {
  id: string;
  tier: 'supporter' | 'defender' | 'guardian';
  amount: number;
  startDate: number;
  nextBillingDate: number;
  status: 'active' | 'cancelled' | 'paused';
  totalPaid: number;
  billingCount: number;
}

export const SUBSCRIPTION_TIERS = {
  supporter: { amount: 5, name: 'Supporter', benefits: ['Monthly impact updates', 'Supporter badge'] },
  defender: { amount: 10, name: 'Defender', benefits: ['Monthly impact updates', 'Defender badge', 'Early access to reports'] },
  guardian: { amount: 25, name: 'Guardian', benefits: ['Monthly impact updates', 'Guardian badge', 'Early access to reports', 'Exclusive case studies'] },
};

const STORAGE_KEY = 'scamfighter_subscription';

export const subscriptionService = {
  createSubscription: (tier: keyof typeof SUBSCRIPTION_TIERS): Subscription => {
    const now = Date.now();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const subscription: Subscription = {
      id: `sub_${now}`,
      tier,
      amount: SUBSCRIPTION_TIERS[tier].amount,
      startDate: now,
      nextBillingDate: nextMonth.getTime(),
      status: 'active',
      totalPaid: SUBSCRIPTION_TIERS[tier].amount,
      billingCount: 1,
    };
    
    subscriptionService.saveSubscription(subscription);
    return subscription;
  },

  getSubscription: (): Subscription | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveSubscription: (subscription: Subscription): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  },

  cancelSubscription: (): void => {
    const sub = subscriptionService.getSubscription();
    if (sub) {
      sub.status = 'cancelled';
      subscriptionService.saveSubscription(sub);
    }
  },

  hasActiveSubscription: (): boolean => {
    const sub = subscriptionService.getSubscription();
    return sub ? sub.status === 'active' : false;
  },
};
