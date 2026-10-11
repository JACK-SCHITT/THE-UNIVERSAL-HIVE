import { NextRequest, NextResponse } from "next/server"

interface ScanResult {
  level: "High" | "Medium" | "Low" | "Safe"
  score: number
  details: string
  indicators: string[]
}

const SCAM_PHRASES = [
  "click here",
  "act now",
  "limited time",
  "congratulations",
  "you've won",
  "you have won",
  "free gift",
  "urgent",
  "verify your account",
  "suspended",
  "unusual activity",
  "wire transfer",
  "western union",
  "bitcoin",
  "cryptocurrency",
  "social security",
  "prince",
  "inheritance",
  "lottery",
  "claim your",
  "risk free",
  "no obligation",
  "guaranteed",
  "100% free",
  "double your",
  "make money fast",
  "work from home",
  "be your own boss",
  "dear friend",
  "dear customer",
  "confidential",
  "password",
  "credit card",
  "bank account",
  "routing number",
  "ssn",
]

const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /free/i,
  /login/i,
  /verify/i,
  /account/i,
  /secure/i,
  /update/i,
  /confirm/i,
  /paypal/i,
  /amazon/i,
  /apple/i,
  /microsoft/i,
  /google/i,
  /\.xyz$/i,
  /\.tk$/i,
  /\.ml$/i,
  /\.ga$/i,
  /\.cf$/i,
  /\d{4,}/,
  /-{2,}/,
]

function analyzeText(input: string): ScanResult {
  const lower = input.toLowerCase()
  const foundIndicators: string[] = []

  for (const phrase of SCAM_PHRASES) {
    if (lower.includes(phrase)) {
      foundIndicators.push(`Scam phrase: "${phrase}"`)
    }
  }

  // Check for urgency language
  if (/(!{2,}|URGENT|IMMEDIATELY|RIGHT NOW)/i.test(input)) {
    foundIndicators.push("Urgency manipulation")
  }

  // Check for suspicious requests
  if (/send.*money|transfer.*funds|pay.*fee/i.test(input)) {
    foundIndicators.push("Financial request detected")
  }

  // Check for impersonation signals
  if (/official|authorized|representative|support team/i.test(input)) {
    foundIndicators.push("Possible impersonation")
  }

  // Check for poor grammar patterns common in scams
  if (/dear (sir|madam|friend|customer|user)/i.test(input)) {
    foundIndicators.push("Generic greeting (common in scams)")
  }

  const count = foundIndicators.length
  let level: ScanResult["level"]
  let score: number
  let details: string

  if (count >= 5) {
    level = "High"
    score = Math.min(95, 70 + count * 3)
    details =
      "Multiple high-risk scam indicators detected. This content is very likely fraudulent. Do not interact with it or provide any personal information."
  } else if (count >= 3) {
    level = "Medium"
    score = 50 + count * 5
    details =
      "Several suspicious patterns found. Exercise caution. This content may be an attempt to deceive or extract information."
  } else if (count >= 1) {
    level = "Low"
    score = 20 + count * 10
    details =
      "Minor indicators detected. While not definitively malicious, remain cautious with this content."
  } else {
    level = "Safe"
    score = 5
    details =
      "No significant scam indicators detected. The content appears to be safe, but always exercise standard caution online."
    foundIndicators.push("No threats found")
  }

  return { level, score, details, indicators: foundIndicators }
}

function analyzeUrl(input: string): ScanResult {
  const foundIndicators: string[] = []

  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (pattern.test(input)) {
      foundIndicators.push(`Suspicious pattern: ${pattern.source}`)
    }
  }

  // Check for URL tricks
  if (input.includes("@")) {
    foundIndicators.push("URL contains @ sign (redirect trick)")
  }

  if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(input)) {
    foundIndicators.push("IP address used instead of domain name")
  }

  if (input.length > 100) {
    foundIndicators.push("Unusually long URL")
  }

  // Check for homograph attacks
  if (/[а-яА-Я]|[^\x00-\x7F]/.test(input)) {
    foundIndicators.push("Non-ASCII characters (possible homograph attack)")
  }

  const count = foundIndicators.length
  let level: ScanResult["level"]
  let score: number
  let details: string

  if (count >= 4) {
    level = "High"
    score = Math.min(95, 70 + count * 4)
    details =
      "This URL shows multiple signs of being malicious. It may be a phishing page designed to steal your credentials. Do not visit this link."
  } else if (count >= 2) {
    level = "Medium"
    score = 45 + count * 8
    details =
      "This URL has suspicious characteristics. It could be a shortened or disguised link. Verify the destination before clicking."
  } else if (count >= 1) {
    level = "Low"
    score = 20 + count * 10
    details =
      "Minor suspicious patterns detected. The URL may be legitimate but proceed with caution."
  } else {
    level = "Safe"
    score = 5
    details =
      "No suspicious URL patterns detected. The link appears structurally safe, but always verify the content of any website you visit."
    foundIndicators.push("No threats found")
  }

  return { level, score, details, indicators: foundIndicators }
}

function analyzeEmail(input: string): ScanResult {
  const textResult = analyzeText(input)

  // Additional email-specific checks
  if (/from:.*@.*\.(xyz|tk|ml|ga|cf)/i.test(input)) {
    textResult.indicators.push("Suspicious sender domain")
  }

  if (/unsubscribe|click to remove/i.test(input) && textResult.level !== "Safe") {
    textResult.indicators.push("Fake unsubscribe link pattern")
  }

  if (/attachment|download|open the file/i.test(input)) {
    textResult.indicators.push("Attachment request (potential malware)")
  }

  // Recalculate based on combined indicators
  const count = textResult.indicators.filter((i) => i !== "No threats found").length
  if (count >= 5) {
    textResult.level = "High"
    textResult.score = Math.min(95, 70 + count * 3)
    textResult.details =
      "This email shows strong signs of being a scam or phishing attempt. Do not click any links, download attachments, or reply with personal information."
  }

  return textResult
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, type } = body as { input: string; type: string }

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input is required" }, { status: 400 })
    }

    // Add small delay to simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 800))

    let result: ScanResult

    switch (type) {
      case "url":
        result = analyzeUrl(input)
        break
      case "email":
        result = analyzeEmail(input)
        break
      default:
        result = analyzeText(input)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
