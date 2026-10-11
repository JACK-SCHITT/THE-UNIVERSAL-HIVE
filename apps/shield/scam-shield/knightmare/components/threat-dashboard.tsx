import { ShieldAlert, Bug, Globe, Mail, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Threats Blocked",
    value: "2.4M+",
    icon: ShieldAlert,
    trend: "+12%",
  },
  {
    label: "Phishing URLs",
    value: "890K+",
    icon: Globe,
    trend: "+8%",
  },
  {
    label: "Scam Emails",
    value: "1.1M+",
    icon: Mail,
    trend: "+15%",
  },
  {
    label: "Malware Detected",
    value: "340K+",
    icon: Bug,
    trend: "+5%",
  },
]

const recentThreats = [
  {
    type: "Phishing",
    target: "fake-paypal-login.com",
    level: "High" as const,
    time: "2 min ago",
  },
  {
    type: "Scam Email",
    target: "You've won $1,000,000...",
    level: "High" as const,
    time: "5 min ago",
  },
  {
    type: "Suspicious URL",
    target: "bit.ly/free-giftcrd",
    level: "Medium" as const,
    time: "12 min ago",
  },
  {
    type: "Impersonation",
    target: "support@amaz0n-help.com",
    level: "High" as const,
    time: "18 min ago",
  },
  {
    type: "Malware Link",
    target: "download-free-soft.xyz",
    level: "Medium" as const,
    time: "25 min ago",
  },
]

const levelStyles = {
  High: "text-red-400 bg-red-400/10 border-red-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Low: "text-yellow-300 bg-yellow-300/10 border-yellow-300/20",
}

export function ThreatDashboard() {
  return (
    <section id="dashboard" className="container py-20">
      <h2 className="mb-2 text-center font-serif text-3xl font-bold text-foreground">
        Threat Intelligence Dashboard
      </h2>
      <p className="mb-12 text-center text-muted-foreground">
        Real-time monitoring and analytics across our global detection network
      </p>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-primary" />
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Threats */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-serif text-lg font-semibold text-foreground">Recent Threats</h3>
          <p className="text-xs text-muted-foreground">Live feed from detection network</p>
        </div>
        <div className="divide-y divide-border">
          {recentThreats.map((threat, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{threat.type}</span>
                <span className="max-w-[200px] truncate text-xs text-muted-foreground md:max-w-none">
                  {threat.target}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    levelStyles[threat.level]
                  )}
                >
                  {threat.level}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {threat.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
