import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { content, imageBase64 } = await req.json();

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2-1212",
      messages: [{
        role: "user",
        content: `You are a merciless anti-scam unit. Analyze for scams/phishing/fraud.
Return ONLY valid JSON:
{
  "score": number 0-100,
  "verdict": "SCAM | SUSPICIOUS | SAFE",
  "redFlags": ["specific red flags"],
  "explanation": "short brutal breakdown",
  "recommendedAction": "string"
}
Content: ${content}`
      }],
      temperature: 0.1
    })
  });

  const data = await response.json();
  let result;
  try {
    result = JSON.parse(data.choices[0].message.content);
  } catch {
    result = { score: 85, verdict: "SCAM", redFlags: ["High risk detected"], explanation: "Treat as dangerous." };
  }
  return Response.json(result);
}