import { useState, useEffect } from 'react';
import { subscriptionService, Subscription, SUBSCRIPTION_TIERS } from '@/services/subscriptionService';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = () => {
    const sub = subscriptionService.getSubscription();
    setSubscription(sub);
  };

  const subscribe = async (tier: keyof typeof SUBSCRIPTION_TIERS): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sub = subscriptionService.createSubscription(tier);
      setSubscription(sub);
      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    subscriptionService.cancelSubscription();
    loadSubscription();
  };

  return {
    subscription,
    loading,
    subscribe,
    cancel,
    hasActive: subscriptionService.hasActiveSubscription(),
  };
}
