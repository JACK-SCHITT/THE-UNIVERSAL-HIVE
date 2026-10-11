import { Shield, Zap, Eye, Lock, Wifi, Bell } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Real-time Protection",
    description:
      "Continuous monitoring and instant detection of emerging threats as they appear across the web.",
  },
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    description:
      "Advanced machine learning models analyze patterns and detect sophisticated scam techniques.",
  },
  {
    icon: Eye,
    title: "Deep URL Inspection",
    description:
      "Multi-layer URL analysis checks domain age, SSL certificates, redirect chains, and known blacklists.",
  },
  {
    icon: Lock,
    title: "Phishing Detection",
    description:
      "Identifies impersonation attempts and credential-harvesting pages with high accuracy.",
  },
  {
    icon: Wifi,
    title: "Network Analysis",
    description:
      "Maps connections between suspicious domains, IPs, and threat actor infrastructure.",
  },
  {
    icon: Bell,
    title: "Alert System",
    description:
      "Customizable alerts and reporting for detected threats across your monitored channels.",
  },
]

export function Features() {
  return (
    <section id="features" className="container py-20">
      <h2 className="mb-2 text-center font-serif text-3xl font-bold text-foreground">
        Defense Capabilities
      </h2>
      <p className="mb-12 text-center text-muted-foreground">
        A comprehensive suite of tools to detect, analyze, and neutralize cyber threats
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-card/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
