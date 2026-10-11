'use client';
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export default function ScamShield() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyze = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input, imageBase64: image }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    toast.success('Scan complete. Stay savage.');

    if (data.score > 60) {
      await supabase.from('scams').insert({
        content: input.substring(0, 400),
        score: data.score,
        verdict: data.verdict,
        red_flags: data.redFlags || []
      });
    }
  };

  useEffect(() => {
    supabase.from('scams').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setAlerts(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#00ff9f] p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-[#00ff9f]/30 pb-8">
          <div className="flex items-center gap-4">
            <Shield className="w-14 h-14" />
            <div>
              <h1 className="text-6xl font-bold tracking-tighter">SCAMSHIELD</h1>
              <p className="text-xl opacity-75">WEAPONIZED ANTI-SCAM AI</p>
            </div>
          </div>
        </header>

        <div className="terminal p-10 rounded-2xl mb-12">
          <h2 className="text-4xl mb-8 flex items-center gap-4"><AlertTriangle className="text-red-500" /> THREAT SCANNER</h2>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste link, phone, email, SMS text..."
            className="w-full h-52 bg-black border border-[#00ff9f]/50 p-6 text-lg focus:outline-none resize-none"
          />

          <label className="cursor-pointer block mt-6 border border-[#00ff9f]/50 hover:border-[#00ff9f] p-8 text-center rounded-xl">
            <ImageIcon className="mx-auto mb-3 w-10 h-10" />
            UPLOAD SCREENSHOT OR IMAGE
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          {image && <img src={image} className="mt-6 max-h-96 border border-[#00ff9f]/30 rounded-xl" />}

          <button
            onClick={analyze}
            disabled={loading}
            className="mt-10 w-full bg-[#00ff9f] text-black py-8 text-2xl font-bold hover:bg-white transition-all disabled:opacity-50"
          >
            {loading ? "SCANNING THE VOID..." : "LAUNCH SCAN →"}
          </button>
        </div>

        {result && (
          <div className="terminal p-10 rounded-2xl mb-12 border-red-500/50">
            <div className={`text-8xl font-bold mb-4 ${result.score > 70 ? 'text-red-500' : 'text-[#00ff9f]'}`}>
              {result.score}%
            </div>
            <div className="text-4xl mb-8">{result.verdict}</div>
            
            <div className="space-y-5 text-lg">
              {result.redFlags?.map((flag: string, i: number) => (
                <div key={i} className="flex gap-4"><span className="text-red-500">●</span> {flag}</div>
              ))}
            </div>
            <p className="mt-8 text-xl opacity-90">{result.explanation}</p>

            <button 
              onClick={() => window.open('https://report.ftc.gov', '_blank')}
              className="mt-12 w-full border-2 border-red-500 py-6 text-xl font-bold hover:bg-red-500 hover:text-black"
            >
              REPORT TO FTC / AUTHORITIES NOW
            </button>
          </div>
        )}

        <div className="terminal p-10 rounded-2xl">
          <h2 className="text-4xl mb-8 flex items-center gap-4"><Users /> LIVE COMMUNITY ALERTS</h2>
          {alerts.map((a: any, i) => (
            <div key={i} className="border-b border-[#00ff9f]/20 py-6 last:border-0">
              <span className="text-red-500 font-bold">{a.verdict} — {a.score}%</span>
              <p className="mt-2 opacity-80 text-sm">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}