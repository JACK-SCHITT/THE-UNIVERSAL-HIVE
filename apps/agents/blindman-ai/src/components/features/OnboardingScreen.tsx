import { useEffect } from 'react';
import { useTTS } from '@/hooks/useTTS';
import heroImg from '@/assets/hero-blindman.jpg';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { speak } = useTTS();

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(
        "Welcome to BLINDMAN AI — your no-bullshit navigation battle buddy. " +
        "Here's your arsenal: " +
        "Say SAVE PLACE AS NAME to lock any location. " +
        "Say GUIDE ME TO NAME to navigate. " +
        "Say WHERE AM I for your position. " +
        "Say START LOGGING ROUTE to record a path. " +
        "Say HELP for all commands. " +
        "Tap the big circle to speak. Let's fuck up navigation together. Fire when ready.",
        true
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [speak]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Hero image */}
      <div className="relative h-56 shrink-0">
        <img
          src={heroImg}
          alt="BLINDMAN AI"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-yellow-400 font-black text-4xl tracking-widest">BLINDMAN</h1>
          <p className="text-orange-400 font-bold text-xl tracking-widest">AI NAVIGATOR</p>
        </div>
      </div>

      {/* Commands */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider mb-4">
          COMMAND ARSENAL — VOICE ONLY
        </p>

        {[
          { cmd: '"Save place as [name]"', desc: 'Lock your current position' },
          { cmd: '"Guide me to [name]"', desc: 'Navigate to saved spot' },
          { cmd: '"Where am I"', desc: 'Get your current location' },
          { cmd: '"Start logging route to [name]"', desc: 'Record a path' },
          { cmd: '"List my spots"', desc: 'Hear all saved places' },
          { cmd: '"Describe the scene"', desc: 'Scan surroundings' },
          { cmd: '"Emergency"', desc: 'Nearest safe zone' },
          { cmd: '"Stop navigation"', desc: 'Cancel current route' },
          { cmd: '"Export my memories"', desc: 'Backup your data' },
          { cmd: '"Help"', desc: 'Full command list' },
        ].map(({ cmd, desc }) => (
          <div key={cmd} className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3">
            <p className="text-yellow-400 font-mono font-bold text-sm">{cmd}</p>
            <p className="text-zinc-400 text-sm mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <div className="p-4 shrink-0">
        <button
          onClick={onComplete}
          className="w-full bg-yellow-400 text-black font-black text-xl py-5 rounded-xl uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-yellow-400/20"
        >
          LOCK AND LOAD
        </button>
      </div>
    </div>
  );
}
