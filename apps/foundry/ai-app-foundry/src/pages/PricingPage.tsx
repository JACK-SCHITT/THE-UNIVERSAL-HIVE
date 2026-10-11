import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import openclawAvatar from "@/assets/openclaw-avatar.png";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  rev_share_year1: number;
  rev_share_lifetime: number;
  sort_order: number;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) {
          console.error("[Pricing] Failed to load plans:", error);
          toast.error("Failed to load pricing plans.");
        } else {
          setPlans((data ?? []) as Plan[]);
        }
        setLoading(false);
      });
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      toast("Sign in to purchase a plan.", { action: { label: "Sign In", onClick: () => navigate("/auth") } });
      return;
    }

    setPaying(plan.id);
    console.log("[Pricing] Initiating payment for plan:", plan.slug);

    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: { planId: plan.id, planSlug: plan.slug },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          msg = text || msg;
        } catch {
          // ignore
        }
      }
      console.error("[Pricing] Payment error:", msg);
      toast.error(`Payment failed: ${msg}`);
      setPaying(null);
      return;
    }

    if (data?.url) {
      window.open(data.url, "_blank");
    }
    setPaying(null);
  };

  const planColor = (slug: string) =>
    slug === "pro"
      ? { border: "border-purple/40", glow: "0 0 30px hsla(270,100%,65%,0.25)", badge: "text-purple bg-purple/10 border-purple/30" }
      : { border: "border-primary/30", glow: "0 0 20px hsla(195,100%,50%,0.15)", badge: "text-primary bg-primary/10 border-primary/30" };

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={openclawAvatar} alt="OpenClaw" className="w-7 h-7 rounded-full border border-primary/40" />
          <span className="font-bold tracking-widest gradient-text uppercase text-sm">COLOSSAL AI</span>
        </button>
        {user ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard →
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/40 text-primary text-sm font-medium hover:bg-primary/20 transition-all duration-200"
          >
            Sign In
          </button>
        )}
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            AI-DETERMINED PRICING — FAIR BY DESIGN
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            No subscriptions. <span className="gradient-text">We share your success.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            One-time build fee. Revenue share. You keep growing — we grow with you.
          </p>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="flex gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="w-80 h-96 rounded-2xl bg-secondary/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl">
            {plans.map((plan) => {
              const colors = planColor(plan.slug);
              const isPro = plan.slug === "pro";
              return (
                <div
                  key={plan.id}
                  className={`flex-1 rounded-2xl p-6 border ${colors.border} glass-panel relative`}
                  style={{ boxShadow: colors.glow }}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs font-bold tracking-wider">
                      RECOMMENDED
                    </div>
                  )}

                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-mono mb-4 ${colors.badge}`}>
                    {plan.name.toUpperCase()}
                  </div>

                  <div className="mb-2">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-2">one-time build fee</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{plan.description}</p>

                  <div className="space-y-2.5 mb-8">
                    {(plan.features as string[]).map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground mb-4 p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                    <div>📈 Year 1: {Math.round(plan.rev_share_year1 * 100)}% success stake</div>
                    <div>♾️ Lifetime: {Math.round(plan.rev_share_lifetime * 100)}% royalty from month 13</div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={paying === plan.id}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isPro
                        ? "bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:opacity-90"
                        : "bg-primary text-primary-foreground hover:opacity-90 glow-cyan"
                    }`}
                  >
                    {paying === plan.id ? "Opening checkout..." : `Start with ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Revenue share note */}
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-lg">
          <strong className="text-foreground">10-Year Buyout always available.</strong>{" "}
          Buy out Colossal's revenue stake at any point. The AI calculates a fair price based on your app's actual performance.
        </div>
      </div>
    </div>
  );
}
