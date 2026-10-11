import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Check, Zap, Building2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/types/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatPrice(price: number): string {
  if (price === 0) return 'Custom';
  return `$${price.toFixed(0)}`;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield className="w-5 h-5" />,
  pro: <Zap className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load plans.'); return; }
        setPlans((data ?? []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : JSON.parse(p.features) })));
        setLoading(false);
      });
  }, []);

  const handleSelect = (plan: Plan) => {
    if (!user) { navigate('/register'); return; }
    if (plan.id === 'free') { toast.info("You're on the Free plan."); return; }
    if (plan.id === 'enterprise') { toast.info('Contact us at enterprise@neuralshield.ai'); return; }
    // Pro plan → navigate to checkout (Stripe integration will be wired here)
    if (plan.id === 'pro') {
      navigate('/checkout', { state: { plan } });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="fixed inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Nav */}
      <header className="relative border-b border-bg-border bg-bg-card/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-DEFAULT to-green-neon flex items-center justify-center">
            <Shield className="w-4 h-4 text-bg-base" />
          </div>
          <span className="font-bold text-sm text-white font-sans">NeuralShield</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/" className="text-xs font-mono text-cyan-DEFAULT hover:text-cyan-DEFAULT/80 transition-colors">
              ← Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-mono text-[#4a6080] hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="text-xs font-mono px-3 py-1.5 rounded bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 transition-colors font-bold">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-dim bg-cyan-subtle text-cyan-DEFAULT text-[10px] font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-DEFAULT animate-pulse" />
            Transparent Pricing
          </div>
          <h1 className="text-3xl font-bold text-white font-sans mb-3">
            Scale your fraud defense
          </h1>
          <p className="text-sm text-[#4a6080] font-mono max-w-md mx-auto">
            Start free. Upgrade when your team needs real-time RL control and compliance tooling.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={cn("text-xs font-mono transition-colors", billing === 'monthly' ? "text-white" : "text-[#4a6080]")}>Monthly</span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className={cn("relative w-10 h-5 rounded-full transition-all", billing === 'annual' ? "bg-cyan-DEFAULT" : "bg-bg-elevated")}
            >
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", billing === 'annual' ? "left-5" : "left-0.5")} />
            </button>
            <span className={cn("text-xs font-mono transition-colors", billing === 'annual' ? "text-white" : "text-[#4a6080]")}>
              Annual <span className="text-green-neon">−15%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="text-center text-xs font-mono text-[#4a6080] py-16">LOADING PLANS...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const price = billing === 'annual' && plan.price_annual > 0
                ? plan.price_annual / 12
                : plan.price_monthly;
              const isCurrent = user?.plan === plan.id;
              const isHighlight = plan.highlight;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-xl border p-6 flex flex-col transition-all",
                    isHighlight
                      ? "border-cyan-DEFAULT bg-cyan-subtle shadow-lg shadow-cyan-DEFAULT/10"
                      : "border-bg-border bg-bg-card hover:border-cyan-dim"
                  )}
                >
                  {isHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-DEFAULT text-bg-base text-[10px] font-bold font-mono tracking-widest">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4",
                    isHighlight ? "bg-cyan-DEFAULT text-bg-base" : "bg-bg-elevated text-[#4a6080]"
                  )}>
                    {PLAN_ICONS[plan.id] || <Shield className="w-5 h-5" />}
                  </div>

                  <div className="font-bold text-base text-white font-sans mb-1">{plan.name}</div>
                  <div className="text-[11px] text-[#4a6080] font-mono mb-5">{plan.description}</div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white font-sans">
                        {plan.price_monthly === 0 && plan.id === 'free' ? '$0' :
                         plan.price_monthly === 0 ? 'Custom' :
                         `$${Math.round(price)}`}
                      </span>
                      {price > 0 && plan.id !== 'enterprise' && (
                        <span className="text-xs text-[#4a6080] font-mono">/mo</span>
                      )}
                    </div>
                    {billing === 'annual' && plan.price_annual > 0 && (
                      <div className="text-[10px] text-green-neon font-mono mt-1">
                        ${plan.price_annual}/yr — save ${Math.round(plan.price_monthly * 12 - plan.price_annual)}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-green-neon shrink-0 mt-0.5" />
                        <span className="text-[11px] font-mono text-[#aac4d8]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={isCurrent}
                    className={cn(
                      "w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-all",
                      isCurrent
                        ? "bg-bg-elevated text-[#4a6080] cursor-default border border-bg-border"
                        : isHighlight
                        ? "bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 shadow-md shadow-cyan-DEFAULT/20"
                        : "border border-bg-border text-[#aac4d8] hover:border-cyan-dim hover:text-cyan-DEFAULT"
                    )}
                  >
                    {isCurrent ? 'CURRENT PLAN' :
                     plan.id === 'free' ? 'GET STARTED' :
                     plan.id === 'enterprise' ? 'CONTACT SALES' :
                     'UPGRADE NOW'}
                  </button>

                  {plan.id === 'enterprise' && (
                    <a href="mailto:enterprise@neuralshield.ai" className="mt-2 flex items-center justify-center gap-1 text-[10px] font-mono text-[#4a6080] hover:text-cyan-DEFAULT transition-colors">
                      <ExternalLink className="w-3 h-3" /> enterprise@neuralshield.ai
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="text-center mt-10 text-[10px] text-[#2a4060] font-mono">
          All plans include 99.9% uptime SLA · PCI-DSS compliant infrastructure · Cancel anytime
        </div>
      </div>
    </div>
  );
}
