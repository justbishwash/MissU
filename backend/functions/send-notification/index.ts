// Supabase Edge Function: send-notification
// Securely dispatches OneSignal push notifications with rate limiting + abuse protection
//
// Deploy with:
//   supabase functions deploy send-notification --no-verify-jwt
//
// Set secrets:
//   supabase secrets set ONESIGNAL_APP_ID=xxx
//   supabase secrets set ONESIGNAL_REST_API_KEY=xxx

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 notifications per minute per sender

const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string }> = {
  miss: {
    title: '❤️ Someone misses you',
    body: '{name} misses you badly right now...',
  },
  thinking: {
    title: '💭 Thinking of you',
    body: '{name} is thinking about you again.',
  },
  hug: {
    title: '🫂 Need hug',
    body: 'Your human needs affection.',
  },
  sleepy: {
    title: '😴 Sleepy thoughts',
    body: '{name} is sleepy and wishes you were here.',
  },
  angry: {
    title: '😤 A little upset',
    body: '{name} could use some love right now.',
  },
  love_attack: {
    title: '💘 LOVE ATTACK!',
    body: 'You are being bombarded with love by {name}!',
  },
  attention: {
    title: '🚨 Need you right now',
    body: '{name} needs your attention badly.',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401);
    }

    // Verify the user
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json();
    const { receiver_id, type = 'miss', urgent = false } = body;

    if (!receiver_id) {
      return jsonResponse({ error: 'receiver_id required' }, 400);
    }

    // Verify sender and receiver are paired
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${receiver_id}),and(user1_id.eq.${receiver_id},user2_id.eq.${user.id})`
      )
      .eq('is_active', true)
      .maybeSingle();

    if (!couple) {
      return jsonResponse({ error: 'Not paired with this user' }, 403);
    }

    // Rate limiting: count recent notifications from sender
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('sent_at', since);

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return jsonResponse(
        { error: 'Rate limit exceeded. Slow down a bit ❤️' },
        429
      );
    }

    // Fetch sender name + receiver player ID
    const [{ data: sender }, { data: receiver }] = await Promise.all([
      supabase.from('users').select('nickname').eq('id', user.id).single(),
      supabase.from('users').select('onesignal_player_id').eq('id', receiver_id).single(),
    ]);

    const template = NOTIFICATION_TEMPLATES[type] ?? NOTIFICATION_TEMPLATES.miss;
    const senderName = sender?.nickname || 'Your person';
    const title = template.title;
    const message = template.body.replace('{name}', senderName);

    // Insert notification record
    await supabase.from('notifications').insert({
      sender_id: user.id,
      receiver_id,
      type,
      message,
    });

    // Send via OneSignal (if player ID available)
    let oneSignalResult = null;
    if (receiver?.onesignal_player_id && ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [receiver.onesignal_player_id],
        headings: { en: title },
        contents: { en: message },
        chrome_web_icon: '/icons/icon-192.png',
        chrome_web_badge: '/icons/heart.svg',
        priority: urgent ? 10 : 7,
        ttl: 86400,
        web_buttons: [
          { id: 'miss-back', text: 'Miss You Too ❤️' },
          { id: 'send-hug', text: 'Send Hug 🫂' },
        ],
        data: { type, sender_id: user.id, urgent },
      };

      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      oneSignalResult = await res.json();
    }

    return jsonResponse({ ok: true, oneSignal: oneSignalResult });
  } catch (err) {
    console.error('send-notification error:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
