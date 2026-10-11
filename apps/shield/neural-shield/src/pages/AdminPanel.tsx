import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/types/auth';
import {
  Settings, Plus, Pencil, Trash2, Check, X, Users,
  DollarSign, Star, ToggleLeft, ToggleRight, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditingPlan extends Omit<Plan, 'features'> {
  features_raw: string;
}

function planToEditing(p: Plan): EditingPlan {
  return { ...p, features_raw: p.features.join('\n') };
}

function editingToPlan(e: EditingPlan): Omit<Plan, 'id'> & { id: string } {
  return {
    ...e,
    features: e.features_raw.split('\n').map(f => f.trim()).filter(Boolean),
  };
}

export function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [editing, setEditing] = useState<EditingPlan | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState<{ total: number; pro: number; free: number }>({ total: 0, pro: 0, free: 0 });

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    loadPlans();
    loadSubscriberStats();
  }, [user]);

  const loadPlans = async () => {
    const { data, error } = await supabase.from('plans').select('*').order('sort_order');
    if (error) { toast.error('Failed to load plans.'); return; }
    setPlans((data ?? []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string) })));
    setLoadingPlans(false);
  };

  const loadSubscriberStats = async () => {
    const { data } = await supabase.from('profiles').select('plan');
    if (!data) return;
    const total = data.length;
    const pro = data.filter(p => p.plan === 'pro' || p.plan === 'enterprise').length;
    setSubscribers({ total, pro, free: total - pro });
  };

  const handleEdit = (plan: Plan) => {
    setEditing(planToEditing(plan));
    setIsNew(false);
  };

  const handleNew = () => {
    setEditing({
      id: `plan-${Date.now()}`,
      name: '',
      description: '',
      price_monthly: 0,
      price_annual: 0,
      features_raw: '',
      is_active: true,
      highlight: false,
      sort_order: plans.length,
    });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Plan name is required.'); return; }
    setSaving(true);

    const payload = editingToPlan(editing);
    const dbPayload = {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      price_monthly: payload.price_monthly,
      price_annual: payload.price_annual,
      features: JSON.stringify(payload.features),
      is_active: payload.is_active,
      highlight: payload.highlight,
      sort_order: payload.sort_order,
      updated_at: new Date().toISOString(),
    };

    const { error } = isNew
      ? await supabase.from('plans').insert(dbPayload)
      : await supabase.from('plans').update(dbPayload).eq('id', editing.id);

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(isNew ? 'Plan created.' : 'Plan updated.');
      setEditing(null);
      loadPlans();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    toast.success('Plan deleted.');
    loadPlans();
  };

  const handleToggleActive = async (plan: Plan) => {
    const { error } = await supabase.from('plans').update({ is_active: !plan.is_active, updated_at: new Date().toISOString() }).eq('id', plan.id);
    if (error) { toast.error('Update failed.'); return; }
    loadPlans();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Admin Panel"
        subtitle="Pricing & Plan Management"
        isLive={false}
        actions={
          <button onClick={handleNew} className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-cyan-dim text-cyan-DEFAULT hover:bg-cyan-subtle transition-all">
            <Plus className="w-3 h-3" /> New Plan
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: subscribers.total, icon: <Users className="w-4 h-4" />, color: 'text-cyan-DEFAULT' },
            { label: 'Pro/Enterprise', value: subscribers.pro, icon: <Star className="w-4 h-4" />, color: 'text-yellow-warn' },
            { label: 'Free Tier', value: subscribers.free, icon: <DollarSign className="w-4 h-4" />, color: 'text-green-neon' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card-base p-4">
              <div className={cn("mb-2", color)}>{icon}</div>
              <div className="text-2xl font-bold text-white font-sans">{value}</div>
              <div className="text-[10px] font-mono text-[#4a6080] mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Plans table */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-DEFAULT" />
            <span className="text-sm font-bold text-white font-sans">Subscription Plans</span>
            <span className="text-[10px] font-mono text-[#4a6080] ml-1">{plans.length} plans</span>
          </div>

          {loadingPlans ? (
            <div className="p-8 text-center text-xs font-mono text-[#4a6080]">LOADING...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-[#3a5070] uppercase text-[9px] tracking-widest border-b border-bg-border">
                    <th className="text-left px-4 py-3">Plan</th>
                    <th className="text-right px-4 py-3">Monthly</th>
                    <th className="text-right px-4 py-3">Annual</th>
                    <th className="text-center px-4 py-3">Highlight</th>
                    <th className="text-center px-4 py-3">Active</th>
                    <th className="text-center px-4 py-3">Features</th>
                    <th className="text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id} className="border-b border-bg-border/40 hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold">{plan.name}</div>
                        <div className="text-[#4a6080] text-[9px] mt-0.5 max-w-xs truncate">{plan.description}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-DEFAULT font-bold">
                        {plan.price_monthly === 0 ? '—' : `$${plan.price_monthly}`}
                      </td>
                      <td className="px-4 py-3 text-right text-[#aac4d8]">
                        {plan.price_annual === 0 ? '—' : `$${plan.price_annual}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {plan.highlight ? <Star className="w-4 h-4 text-yellow-warn mx-auto" /> : <span className="text-[#2a4060]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggleActive(plan)} className="text-[#4a6080] hover:text-cyan-DEFAULT transition-colors">
                          {plan.is_active
                            ? <ToggleRight className="w-5 h-5 text-green-neon" />
                            : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-[#4a6080]">{plan.features.length}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(plan)} className="text-[#4a6080] hover:text-cyan-DEFAULT transition-colors p-1 rounded hover:bg-cyan-subtle">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(plan.id)} className="text-[#4a6080] hover:text-red-alert transition-colors p-1 rounded hover:bg-red-dim/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-base w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
              <span className="text-sm font-bold text-white font-sans">{isNew ? 'New Plan' : `Edit — ${editing.name}`}</span>
              <button onClick={() => setEditing(null)} className="text-[#4a6080] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">ID</label>
                  <input value={editing.id} onChange={e => setEditing(prev => prev ? { ...prev, id: e.target.value } : prev)}
                    disabled={!isNew}
                    className={cn("w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors",
                      !isNew && "opacity-50 cursor-not-allowed")} />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">Name</label>
                  <input value={editing.name} onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">Description</label>
                <input value={editing.description} onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">Monthly ($)</label>
                  <input type="number" min={0} step={0.01}
                    value={editing.price_monthly}
                    onChange={e => setEditing(prev => prev ? { ...prev, price_monthly: parseFloat(e.target.value) || 0 } : prev)}
                    className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">Annual ($)</label>
                  <input type="number" min={0} step={0.01}
                    value={editing.price_annual}
                    onChange={e => setEditing(prev => prev ? { ...prev, price_annual: parseFloat(e.target.value) || 0 } : prev)}
                    className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">Sort Order</label>
                  <input type="number" min={0}
                    value={editing.sort_order}
                    onChange={e => setEditing(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) || 0 } : prev)}
                    className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.is_active}
                    onChange={e => setEditing(prev => prev ? { ...prev, is_active: e.target.checked } : prev)}
                    className="accent-cyan-DEFAULT w-4 h-4" />
                  <span className="text-xs font-mono text-[#aac4d8]">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.highlight}
                    onChange={e => setEditing(prev => prev ? { ...prev, highlight: e.target.checked } : prev)}
                    className="accent-yellow-400 w-4 h-4" />
                  <span className="text-xs font-mono text-[#aac4d8]">Highlight (Most Popular)</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1 uppercase tracking-wider">
                  Features (one per line)
                </label>
                <textarea
                  rows={6}
                  value={editing.features_raw}
                  onChange={e => setEditing(prev => prev ? { ...prev, features_raw: e.target.value } : prev)}
                  className="w-full bg-bg-base border border-bg-border rounded px-3 py-2 text-xs font-mono text-[#aac4d8] outline-none focus:border-cyan-DEFAULT transition-colors resize-none"
                  placeholder={"Dashboard overview\nTransaction feed\nReal-time RL agent control"} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-bg-border">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-mono text-[#4a6080] hover:text-white border border-bg-border rounded hover:border-cyan-dim transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className={cn("flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded transition-all",
                  saving ? "bg-bg-elevated text-[#4a6080] cursor-not-allowed" :
                  "bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90")}>
                <Check className="w-3.5 h-3.5" />
                {saving ? 'SAVING...' : 'SAVE PLAN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
