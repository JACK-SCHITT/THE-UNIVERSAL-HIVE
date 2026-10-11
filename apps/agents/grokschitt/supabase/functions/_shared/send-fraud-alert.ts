// Send fraud alert email via Klaviyo
export async function sendFraudAlert(
  email: string,
  alertData: {
    amount: number;
    riskLevel: string;
    reason: string;
    timestamp: string;
  }
): Promise<boolean> {
  try {
    const apiKey = Deno.env.get('KLAVIYO_API_KEY');
    if (!apiKey) {
      console.error('Klaviyo API key not configured');
      return false;
    }

    const eventData = {
      data: {
        type: 'event',
        attributes: {
          profile: {
            email
          },
          metric: {
            name: 'Fraud Alert'
          },
          properties: {
            amount: alertData.amount,
            risk_level: alertData.riskLevel,
            reason: alertData.reason,
            timestamp: alertData.timestamp,
            platform: 'GROKSCHITT v18'
          },
          time: new Date().toISOString()
        }
      }
    };

    const response = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo event error:', errorText);
      return false;
    }

    console.log('Fraud alert sent to:', email);
    return true;

  } catch (error: any) {
    console.error('Send fraud alert error:', error);
    return false;
  }
}
