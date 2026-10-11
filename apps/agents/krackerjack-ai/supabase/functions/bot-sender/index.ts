import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { platform, botToken, chatId, message, embedTitle, embedColor, username, avatarUrl } = await req.json();

    if (!platform || !botToken || !message) {
      return new Response(JSON.stringify({ error: 'platform, botToken, and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── TELEGRAM ──────────────────────────────────────────────────────
    if (platform === 'telegram') {
      if (!chatId) {
        return new Response(JSON.stringify({ error: 'chatId required for Telegram' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const tgData = await tgRes.json();
      if (!tgRes.ok) {
        console.error(`[BOT-SENDER] Telegram error ${tgRes.status}:`, tgData);
        return new Response(JSON.stringify({ error: `Telegram: ${tgData.description || 'Unknown error'}` }), {
          status: tgRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true, platform: 'telegram', messageId: tgData.result?.message_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DISCORD ───────────────────────────────────────────────────────
    if (platform === 'discord') {
      // botToken for Discord is the webhook URL or channel ID + bot token
      // We support both webhook URLs and bot token + channel ID
      let discordUrl: string;
      let body: Record<string, unknown>;

      if (botToken.startsWith('https://discord.com/api/webhooks/') || botToken.startsWith('https://discordapp.com/api/webhooks/')) {
        // Webhook mode
        discordUrl = botToken;
        body = {
          content: embedTitle ? undefined : message,
          username: username || 'HIVE-OS',
          avatar_url: avatarUrl || undefined,
          embeds: embedTitle ? [{
            title: embedTitle,
            description: message,
            color: parseInt((embedColor || '#f5a623').replace('#', ''), 16),
            footer: { text: 'KRACKERJACK HIVE-OS · Architect Mode' },
          }] : undefined,
        };
      } else {
        // Bot token + channel ID mode
        if (!chatId) {
          return new Response(JSON.stringify({ error: 'Channel ID (chatId) required for Discord bot token mode' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        discordUrl = `https://discord.com/api/v10/channels/${chatId}/messages`;
        body = {
          content: embedTitle ? undefined : message,
          embeds: embedTitle ? [{
            title: embedTitle,
            description: message,
            color: parseInt((embedColor || '#f5a623').replace('#', ''), 16),
            footer: { text: 'KRACKERJACK HIVE-OS · Architect Mode' },
          }] : undefined,
        };
      }

      const discordRes = await fetch(discordUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(botToken.startsWith('https://') ? {} : { 'Authorization': `Bot ${botToken}` }),
        },
        body: JSON.stringify(body),
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text();
        console.error(`[BOT-SENDER] Discord error ${discordRes.status}: ${errText}`);
        return new Response(JSON.stringify({ error: `Discord: ${errText}` }), {
          status: discordRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const discordData = discordRes.status === 204 ? { ok: true } : await discordRes.json();
      return new Response(JSON.stringify({ ok: true, platform: 'discord', messageId: discordData.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[BOT-SENDER] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
