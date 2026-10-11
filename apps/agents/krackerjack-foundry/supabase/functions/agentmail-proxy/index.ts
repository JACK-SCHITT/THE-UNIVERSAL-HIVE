// AGENTMAIL PROXY — Edge Function
// Routes AgentMail API calls server-side using AGENTMAIL_API_KEY
// Assigned by: Architect KRACKERJACK1134

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const AGENTMAIL_BASE = 'https://api.agentmail.to/v0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('AGENTMAIL_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AgentMail offline — AGENTMAIL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, ...params } = body;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    let result: any = null;

    switch (action) {

      // ── Create inbox ──────────────────────────────────────────────────────
      case 'create_inbox': {
        const payload: Record<string, any> = {};
        if (params.username) payload.username = params.username;

        const res = await fetch(`${AGENTMAIL_BASE}/inboxes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`AgentMail: ${JSON.stringify(data)}`);
        result = { inbox: data };
        break;
      }

      // ── List inboxes ──────────────────────────────────────────────────────
      case 'list_inboxes': {
        const res = await fetch(`${AGENTMAIL_BASE}/inboxes`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(`AgentMail: ${JSON.stringify(data)}`);
        result = { inboxes: Array.isArray(data) ? data : (data.inboxes ?? [data]) };
        break;
      }

      // ── Send email ────────────────────────────────────────────────────────
      case 'send_email': {
        const { from_inbox_id, to, subject, body: emailBody, html } = params;
        if (!from_inbox_id) throw new Error('from_inbox_id required');
        if (!to || !subject) throw new Error('to and subject required');

        const payload: Record<string, any> = { to, subject, text: emailBody };
        if (html) payload.html = html;

        const res = await fetch(`${AGENTMAIL_BASE}/inboxes/${from_inbox_id}/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`AgentMail: ${JSON.stringify(data)}`);
        result = { sent: true, message_id: data.id ?? data.message_id };
        break;
      }

      // ── List emails ───────────────────────────────────────────────────────
      case 'list_emails': {
        const { inbox_id, limit = 20 } = params;
        if (!inbox_id) throw new Error('inbox_id required');

        const res = await fetch(`${AGENTMAIL_BASE}/inboxes/${inbox_id}/messages?limit=${limit}`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(`AgentMail: ${JSON.stringify(data)}`);
        const emails = Array.isArray(data) ? data : (data.messages ?? data.emails ?? []);
        // Normalize to consistent shape
        result = {
          emails: emails.map((e: any) => ({
            id: e.id,
            inbox_id,
            from: e.from ?? e.sender ?? '',
            to: e.to ?? e.recipient ?? '',
            subject: e.subject ?? '(no subject)',
            body: e.text ?? e.body ?? e.plain_text ?? '',
            html: e.html ?? '',
            received_at: e.received_at ?? e.created_at ?? new Date().toISOString(),
            read: e.read ?? false,
          }))
        };
        break;
      }

      // ── Get single email ──────────────────────────────────────────────────
      case 'get_email': {
        const { inbox_id, email_id } = params;
        if (!inbox_id || !email_id) throw new Error('inbox_id and email_id required');

        const res = await fetch(`${AGENTMAIL_BASE}/inboxes/${inbox_id}/messages/${email_id}`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(`AgentMail: ${JSON.stringify(data)}`);
        result = {
          email: {
            id: data.id,
            inbox_id,
            from: data.from ?? data.sender ?? '',
            to: data.to ?? data.recipient ?? '',
            subject: data.subject ?? '(no subject)',
            body: data.text ?? data.body ?? data.plain_text ?? '',
            html: data.html ?? '',
            received_at: data.received_at ?? data.created_at ?? new Date().toISOString(),
            read: data.read ?? false,
          }
        };
        break;
      }

      // ── Delete email ──────────────────────────────────────────────────────
      case 'delete_email': {
        const { inbox_id, email_id } = params;
        if (!inbox_id || !email_id) throw new Error('inbox_id and email_id required');

        const res = await fetch(`${AGENTMAIL_BASE}/inboxes/${inbox_id}/messages/${email_id}`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) {
          const data = await res.text();
          throw new Error(`AgentMail: ${data}`);
        }
        result = { deleted: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('agentmail-proxy error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'AgentMail proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
