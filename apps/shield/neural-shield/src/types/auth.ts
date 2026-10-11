export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  is_active: boolean;
  highlight: boolean;
  sort_order: number;
}

export interface Subscriber {
  id: string;
  user_id: string;
  email: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_end: string | null;
}
