import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import openclawAvatar from "@/assets/openclaw-avatar.png";

const NAV_LINKS = [
  { href: "/command", label: "Command", icon: "⚡" },
  { href: "/terminal", label: "Terminal", icon: "💻" },
  { href: "/apps", label: "Sub-Apps", icon: "🏗️" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/assimilate", label: "Swarm", icon: "💀" },
  { href: "/pricing", label: "Pricing", icon: "💳" },
  { href: "/buyout", label: "Buyout", icon: "💰" },
  { href: "/legal", label: "Legal", icon: "⚖️" },
];

// Builder is accessible via Terminal page sidebar — no separate route needed

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isAdmin = user?.email?.includes("admin");

  // Account link replaces generic Sign In when logged in

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border/60">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 flex-shrink-0 group"
        >
          <img
            src={openclawAvatar}
            alt="OpenClaw"
            className="w-7 h-7 rounded-full border border-cyan-dim/50 group-hover:border-primary transition-colors"
          />
          <span className="font-bold text-sm tracking-widest gradient-text uppercase">
            COLOSSAL
          </span>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0",
                location.pathname === link.href
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span className="text-xs">{link.icon}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0",
                location.pathname === "/admin"
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span className="text-xs">⚙️</span>
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span className="max-w-[100px] truncate">{user.username}</span>
              </div>
              <Link
                to="/account"
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                  location.pathname === "/account"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border hover:bg-secondary"
                )}
              >
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-transparent hover:border-border"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span>PRIME ACTIVE</span>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
