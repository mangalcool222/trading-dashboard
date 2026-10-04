// n8n Webhook Integration for Telegram Alerts & Trello Trading Journal

/**
 * Sends a real-time webhook payload to n8n workflow endpoint
 */
export async function sendN8nWebhook(webhookUrl, eventType, payload) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.log('[n8n Webhook] Skipped: No valid Webhook URL configured');
    return false;
  }

  try {
    const body = {
      event: eventType, // 'SIGNAL_ALERT' | 'TRADE_EXECUTED' | 'TRADE_CLOSED'
      timestamp: new Date().toISOString(),
      source: 'ApexTrader PRO AI',
      data: payload
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log(`[n8n Webhook] Event '${eventType}' sent successfully! Status: ${response.status}`);
    return true;
  } catch (err) {
    console.error('[n8n Webhook] Error triggering webhook:', err);
    return false;
  }
}
