"use client"

import { useState } from "react"
import { Search, AlertTriangle, CheckCircle, Loader2, ShieldX, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScanResult {
  level: "High" | "Medium" | "Low" | "Safe"
  score: number
  details: string
  indicators: string[]
}

export function ScannerForm() {
  const [input, setInput] = useState("")
  const [scanType, setScanType] = useState<"text" | "url" | "email">("text")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)

  const handleScan = async () => {
    if (!input.trim()) return
    setIsScanning(true)
    setResult(null)

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), type: scanType }),
      })
      const data = await response.json()
      setResult(data)
    } catch {
      setResult({
        level: "High",
        score: 0,
        details: "Analysis service unavailable. Please try again.",
        indicators: ["Connection error"],
      })
    } finally {
      setIsScanning(false)
    }
  }

  const levelConfig = {
    High: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", icon: ShieldX },
    Medium: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: AlertTriangle },
    Low: { color: "text-yellow-300", bg: "bg-yellow-300/10", border: "border-yellow-300/30", icon: AlertTriangle },
    Safe: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: ShieldCheck },
  }

  return (
    <section id="scanner" className="container py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-center font-serif text-3xl font-bold text-foreground">
          Threat Scanner
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          Analyze text, URLs, or emails for scam indicators and threats
        </p>

        {/* Scan type selector */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {(["text", "url", "email"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setScanType(type)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium capitalize transition-all",
                scanType === type
                  ? "border border-primary/50 bg-primary/15 text-primary"
                  : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              scanType === "url"
                ? "Enter a suspicious URL to analyze..."
                : scanType === "email"
                  ? "Paste the email content to scan..."
                  : "Enter suspicious text or message to analyze..."
            }
            rows={5}
            className="w-full resize-none rounded-lg border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleScan}
            disabled={isScanning || !input.trim()}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-md py-3 font-serif text-sm font-medium transition-all",
              isScanning || !input.trim()
                ? "cursor-not-allowed border border-border bg-secondary text-muted-foreground"
                : "border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Scan for Threats
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 animate-fade-in">
            <div
              className={cn(
                "rounded-lg border p-6",
                levelConfig[result.level].border,
                levelConfig[result.level].bg
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                {(() => {
                  const Icon = levelConfig[result.level].icon
                  return <Icon className={cn("h-6 w-6", levelConfig[result.level].color)} />
                })()}
                <div>
                  <h3
                    className={cn(
                      "font-serif text-lg font-bold",
                      levelConfig[result.level].color
                    )}
                  >
                    Threat Level: {result.level}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confidence Score: {result.score}%
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-foreground">{result.details}</p>

              {result.indicators.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Detected Indicators
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {result.indicators.map((indicator, i) => (
                      <li
                        key={i}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          levelConfig[result.level].border,
                          levelConfig[result.level].color
                        )}
                      >
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
