import { Shield, Menu } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-serif text-lg font-bold tracking-wide text-foreground">
            {"Scammer's Knightmare"}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#scanner"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Scanner
          </Link>
          <Link
            href="#dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
        </nav>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
