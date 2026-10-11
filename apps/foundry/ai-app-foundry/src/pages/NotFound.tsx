import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center text-center px-6">
      <div>
        <div className="text-8xl font-bold gradient-text mb-4 font-mono">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          OpenClaw couldn't find this page.
        </h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          But it's already running the "Find A Way" protocol to route you somewhere useful.
        </p>
        <button
          onClick={() => navigate("/command")}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all duration-200 glow-cyan"
        >
          ⚡ Back to OpenClaw
        </button>
      </div>
    </div>
  );
}
