import { ShieldAlert, ArrowDown } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      {/* Atmospheric background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0_100%_27%/0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 animate-pulse-glow">
          <ShieldAlert className="h-8 w-8 text-primary" />
        </div>

        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl text-balance">
          Advanced Threat Detection Platform
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Identify and neutralize online scams, phishing attacks, and cyber threats in real-time.
          Your digital fortress against fraud.
        </p>

        <a
          href="#scanner"
          className="mt-4 flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-6 py-3 font-serif text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          Begin Scanning
          <ArrowDown className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}
