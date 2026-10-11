import { Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-serif text-sm font-semibold text-foreground">
            {"Scammer's Knightmare"}
          </span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Advanced threat detection platform. Protecting users from scams, phishing, and cyber
          threats in real-time.
        </p>
        <p className="text-xs text-muted-foreground/60">
          {"Built to make the digital world safer."}
        </p>
      </div>
    </footer>
  )
}
