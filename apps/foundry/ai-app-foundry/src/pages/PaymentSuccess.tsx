import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import openclawAvatar from "@/assets/openclaw-avatar.png";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!sessionId || !user) {
      setChecking(false);
      return;
    }

    console.log("[PaymentSuccess] Verifying session:", sessionId);

    // Mark subscription as active via verify-payment edge function
    supabase.functions
      .invoke("verify-payment", { body: { sessionId } })
      .then(({ data, error }) => {
        if (error) {
          console.error("[PaymentSuccess] Verification error:", error.message);
        } else {
          console.log("[PaymentSuccess] Verified:", data);
          setVerified(true);
        }
        setChecking(false);
      });
  }, [sessionId, user]);

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <img
          src={openclawAvatar}
          alt="OpenClaw"
          className="w-20 h-20 rounded-full border-2 border-primary/50 mx-auto mb-6 animate-float"
          style={{ boxShadow: "0 0 30px hsla(195,100%,50%,0.5)" }}
        />

        {checking ? (
          <>
            <div className="text-xl font-bold mb-2">Verifying payment...</div>
            <div className="text-muted-foreground text-sm">Confirming transaction with Stripe.</div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-3 gradient-text">Payment Confirmed</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {verified
                ? "Your account has been upgraded. OpenClaw is ready to build your app."
                : "Payment received. Your access will be active shortly."}
            </p>

            <div className="glass-panel rounded-xl p-4 mb-8 text-sm text-left space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Build fee processed
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Revenue share configured
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Stripe Connect portal active
              </div>
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <span>⚡</span> OpenClaw standing by
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/command")}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-cyan"
              >
                ⚡ Start Building
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:border-primary/40 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
