import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import openclawAvatar from "@/assets/openclaw-avatar.png";
import type { AuthUser } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";

type Mode = "login" | "register";
type RegStep = "email" | "otp" | "password";

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email!.split("@")[0],
    avatar: user.user_metadata?.avatar_url,
  };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [regStep, setRegStep] = useState<RegStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return toast.error("Email and password required.");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    login(mapUser(data.user));
    navigate("/dashboard");
  };

  // ── REGISTER step 1: send OTP ─────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter your email first.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Verification code sent — check your email.");
    setRegStep("otp");
    setLoading(false);
  };

  // ── REGISTER step 2: verify OTP ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp) return toast.error("Enter the verification code.");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Email verified. Set your password.");
    setRegStep("password");
    setLoading(false);
  };

  // ── REGISTER step 3: set password ─────────────────────────────────────────
  const handleSetPassword = async () => {
    if (!password || password.length < 6)
      return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { username: username || email.split("@")[0] },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    login(mapUser(data.user));
    toast.success("Account created. Welcome to Colossal AI.");
    navigate("/dashboard");
  };

  const handleSubmit = () => {
    if (mode === "login") return handleLogin();
    if (regStep === "email") return handleSendOtp();
    if (regStep === "otp") return handleVerifyOtp();
    return handleSetPassword();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const stepLabels: Record<RegStep, string> = {
    email: "Create Account",
    otp: "Verify Email",
    password: "Set Password",
  };

  const buttonLabel =
    loading
      ? "Processing..."
      : mode === "login"
      ? "Sign In"
      : stepLabels[regStep];

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={openclawAvatar}
            alt="OpenClaw"
            className="w-16 h-16 rounded-full border-2 border-primary/50 mb-4 animate-float"
            style={{ boxShadow: "0 0 30px hsla(195,100%,50%,0.4)" }}
          />
          <div className="font-bold text-xl tracking-widest gradient-text uppercase">COLOSSAL AI</div>
          <div className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 border border-border/60">
          {/* Toggle */}
          <div className="flex bg-secondary rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setRegStep("email");
                  setOtp("");
                  setPassword("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Progress for register */}
          {mode === "register" && (
            <div className="flex gap-2 mb-5">
              {(["email", "otp", "password"] as RegStep[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= ["email", "otp", "password"].indexOf(regStep)
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="space-y-4" onKeyDown={handleKey}>
            {/* Email — always shown */}
            {(mode === "login" || regStep === "email") && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                {mode === "login" && (
                  <div>
                    <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                )}
              </>
            )}

            {/* OTP step */}
            {mode === "register" && regStep === "otp" && (
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
                  Verification Code
                </label>
                <div className="text-xs text-muted-foreground mb-3">
                  Code sent to <strong className="text-foreground">{email}</strong>
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4-digit code"
                  maxLength={4}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-center text-2xl font-mono tracking-[0.5em]"
                  autoFocus
                />
              </div>
            )}

            {/* Password step */}
            {mode === "register" && regStep === "password" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={email.split("@")[0]}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                    autoFocus
                  />
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-cyan mt-2"
            >
              {buttonLabel}
            </button>

            {mode === "register" && regStep !== "email" && (
              <button
                onClick={() => setRegStep(regStep === "otp" ? "email" : "otp")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          By signing up you agree to the{" "}
          <button
            onClick={() => navigate("/legal")}
            className="text-primary hover:underline"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            onClick={() => navigate("/legal")}
            className="text-primary hover:underline"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
