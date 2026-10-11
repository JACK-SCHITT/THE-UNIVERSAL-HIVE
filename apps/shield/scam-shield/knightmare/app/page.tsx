import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { ScannerForm } from "@/components/scanner-form"
import { ThreatDashboard } from "@/components/threat-dashboard"
import { Features } from "@/components/features"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <div className="border-t border-border">
          <ScannerForm />
        </div>
        <div className="border-t border-border">
          <ThreatDashboard />
        </div>
        <div className="border-t border-border">
          <Features />
        </div>
      </main>
      <Footer />
    </div>
  )
}
