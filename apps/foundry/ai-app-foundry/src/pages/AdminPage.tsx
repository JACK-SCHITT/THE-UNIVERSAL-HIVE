import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

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
  is_active: boolean;
  stripe_price_id: string | null;
  sort_order: number;
}

// Check admin status from DB config OR email
async function checkAdminStatus(email: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("admin_config")
      .select("value")
      .eq("key", "admin_emails")
      .single();

    if (data?.value) {
      const adminEmails = data.value.split(",").map((e: string) => e.trim().toLowerCase());
      if (adminEmails.includes(email.toLowerCase())) return true;
    }
  } catch {}
  // Fallback: email includes "admin"
  return email.toLowerCase().includes("admin");
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Admin email config state
  const [adminEmails, setAdminEmails] = useState("");
  const [editingAdminEmails, setEditingAdminEmails] = useState(false);
  const [savingAdminEmails, setSavingAdminEmails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    checkAdminStatus(user.email).then((admin) => {
      setIsAdmin(admin);
      setCheckingAdmin(false);
      if (!admin) {
        toast.error("Admin access required.");
        navigate("/dashboard");
      }
    });
  }, [user]);

  useEffect(() => {
    fetchPlans();
    fetchAdminEmails();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("sort_order");
    if (error) {
      toast.error("Failed to load plans.");
      console.error("[Admin] fetchPlans error:", error);
    } else {
      setPlans((data ?? []) as Plan[]);
    }
    setLoadingPlans(false);
  };

  const fetchAdminEmails = async () => {
    const { data } = await supabase
      .from("admin_config")
      .select("value")
      .eq("key", "admin_emails")
      .single();
    if (data?.value) setAdminEmails(data.value);
  };

  const saveAdminEmails = async () => {
    setSavingAdminEmails(true);
    const { error } = await supabase
      .from("admin_config")
      .upsert({ key: "admin_emails", value: adminEmails, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast.error("Failed to save admin emails: " + error.message);
    } else {
      toast.success("Admin emails updated. Changes take effect on next login.");
      setEditingAdminEmails(false);
    }
    setSavingAdminEmails(false);
  };

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditDraft({ ...plan });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const savePlan = async () => {
    if (!editingId || !editDraft) return;
    setSaving(true);
    console.log("[Admin] Saving plan:", editingId, editDraft);

    let features = editDraft.features;
    if (typeof features === "string") {
      features = (features as unknown as string)
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
    }

    const updates = {
      name: editDraft.name,
      price: editDraft.price,
      description: editDraft.description,
      features,
      rev_share_year1: editDraft.rev_share_year1,
      rev_share_lifetime: editDraft.rev_share_lifetime,
      is_active: editDraft.is_active,
      stripe_price_id: editDraft.stripe_price_id || null,
      sort_order: editDraft.sort_order,
    };

    const { data, error } = await supabase.functions.invoke("update-plan", {
      body: { planId: editingId, updates },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          msg = text || msg;
        } catch {}
      }
      toast.error("Save failed: " + msg);
      console.error("[Admin] save error:", msg);
    } else {
      console.log("[Admin] Plan saved:", data);
      toast.success("Plan updated.");
      await fetchPlans();
      cancelEdit();
    }
    setSaving(false);
  };

  if (authLoading || checkingAdmin || loadingPlans) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-muted-foreground font-mono animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Edit pricing, subscriptions, plan features, and admin access.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            ← Dashboard
          </button>
        </div>

        {/* ── Admin Email Config ── */}
        <div className="glass-panel rounded-2xl p-6 border border-border/60 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-foreground">🔐 Admin Access Control</div>
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated list of email addresses with admin access.
              </p>
            </div>
            {!editingAdminEmails ? (
              <button
                onClick={() => setEditingAdminEmails(true)}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingAdminEmails(false)}
                  className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAdminEmails}
                  disabled={savingAdminEmails}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {savingAdminEmails ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {editingAdminEmails ? (
            <textarea
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
              rows={3}
              placeholder="admin@yourdomain.com, owner@yourdomain.com"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none font-mono transition-colors"
            />
          ) : (
            <div className="bg-secondary/50 rounded-xl px-4 py-3 font-mono text-sm text-muted-foreground">
              {adminEmails || "No admin emails configured"}
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground/60">
            Current admin: <span className="text-primary font-mono">{user?.email}</span>
          </div>
        </div>

        {/* ── Subscription Plans ── */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Subscription Plans
          </div>

          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            const d = isEditing ? editDraft : plan;

            return (
              <div
                key={plan.id}
                className="glass-panel rounded-2xl border border-border/60 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${plan.is_active ? "bg-green-400" : "bg-muted-foreground"}`}
                    />
                    <span className="font-bold text-foreground">{plan.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">/{plan.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(plan)}
                        className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={savePlan}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5 grid sm:grid-cols-2 gap-5">
                  <Field
                    label="Plan Name"
                    editing={isEditing}
                    value={String(d.name ?? "")}
                    onChange={(v) => setEditDraft((prev) => ({ ...prev, name: v }))}
                  />
                  <Field
                    label="Price (USD)"
                    editing={isEditing}
                    value={String(d.price ?? "")}
                    type="number"
                    prefix="$"
                    onChange={(v) => setEditDraft((prev) => ({ ...prev, price: parseFloat(v) || 0 }))}
                  />
                  <Field
                    label="Revenue Share — Year 1 (%)"
                    editing={isEditing}
                    value={String(Math.round((d.rev_share_year1 ?? 0) * 100))}
                    type="number"
                    suffix="%"
                    onChange={(v) =>
                      setEditDraft((prev) => ({ ...prev, rev_share_year1: (parseFloat(v) || 0) / 100 }))
                    }
                  />
                  <Field
                    label="Revenue Share — Lifetime (%)"
                    editing={isEditing}
                    value={String(Math.round((d.rev_share_lifetime ?? 0) * 100))}
                    type="number"
                    suffix="%"
                    onChange={(v) =>
                      setEditDraft((prev) => ({ ...prev, rev_share_lifetime: (parseFloat(v) || 0) / 100 }))
                    }
                  />
                  <Field
                    label="Stripe Price ID"
                    editing={isEditing}
                    value={String(d.stripe_price_id ?? "")}
                    placeholder="price_xxx..."
                    onChange={(v) => setEditDraft((prev) => ({ ...prev, stripe_price_id: v }))}
                  />
                  <Field
                    label="Sort Order"
                    editing={isEditing}
                    value={String(d.sort_order ?? 0)}
                    type="number"
                    onChange={(v) => setEditDraft((prev) => ({ ...prev, sort_order: parseInt(v) || 0 }))}
                  />

                  <div className="sm:col-span-2 flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Plan Active
                    </span>
                    {isEditing ? (
                      <button
                        onClick={() => setEditDraft((prev) => ({ ...prev, is_active: !prev.is_active }))}
                        className={`w-10 h-5 rounded-full transition-all duration-200 relative ${
                          editDraft.is_active ? "bg-green-500" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                            editDraft.is_active ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`text-xs font-mono ${plan.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={String(d.description ?? "")}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 resize-none transition-colors"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Features (one per line)
                    </label>
                    {isEditing ? (
                      <textarea
                        value={
                          Array.isArray(editDraft.features)
                            ? (editDraft.features as string[]).join("\n")
                            : String(editDraft.features ?? "")
                        }
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            features: e.target.value as unknown as string[],
                          }))
                        }
                        rows={6}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 resize-none font-mono transition-colors"
                      />
                    ) : (
                      <div className="space-y-1.5">
                        {(plan.features as string[]).map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Live App / Switch to Active ── */}
        <div className="mt-10 glass-panel rounded-2xl p-6 border border-primary/20">
          <div className="font-semibold text-foreground mb-2">📡 Switch to Active / Share Link</div>
          <p className="text-sm text-muted-foreground mb-4">
            This is the live URL of your Colossal AI platform. Share it to let others sign up and pay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono text-muted-foreground overflow-x-auto">
              {window.location.origin}
            </div>
            <button
              onClick={() => window.open(window.location.origin, "_blank")}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all glow-cyan flex-shrink-0"
            >
              ⚡ Switch to Active
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                toast.success("Link copied!");
              }}
              className="px-4 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex-shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  editing: boolean;
  value: string;
  onChange?: (v: string) => void;
  type?: "text" | "number";
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

function Field({ label, editing, value, onChange, type = "text", prefix, suffix, placeholder }: FieldProps) {
  return (
    <div>
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
          {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        </div>
      ) : (
        <div className="text-sm text-foreground font-mono">
          {prefix}
          {value}
          {suffix}
        </div>
      )}
    </div>
  );
}
