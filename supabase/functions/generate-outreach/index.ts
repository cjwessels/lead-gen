import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      },
    )

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiApiKey) {
      return json({ error: 'OPENAI_API_KEY is not set' }, 400)
    }

    const { lead } = await req.json()

    if (!lead?.name || !lead?.category || !lead?.city) {
      return json({ error: 'Invalid lead payload' }, 400)
    }

    const prompt = `
You are writing practical outbound sales copy for a South African software development company called SaaSiFy.
Create concise, professional outreach for this lead.

Lead details:
- Business name: ${lead.name}
- Category: ${lead.category}
- City: ${lead.city}
- Website: ${lead.website || 'None'}
- Phone: ${lead.phone || 'None'}
- Rating: ${lead.rating || 'Unknown'}
- Review count: ${lead.reviewCount || 0}
- Pain points: ${(lead.painPoints || []).join(', ') || 'General digital improvement opportunity'}

Return valid JSON only with these keys:
emailSubject
emailBody
whatsappBody
callOpener

Requirements:
- friendly and professional
- do not sound spammy
- mention SaaSiFy naturally
- no markdown
- no extra keys
`

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4',
        input: prompt,
      }),
    })

    const raw = await upstream.json()

    if (!upstream.ok) {
      return json({ error: raw?.error?.message || 'AI generation failed' }, upstream.status)
    }

    const outputText =
      raw.output_text ||
      raw.output?.map((item: { content?: Array<{ text?: string }> }) => item.content?.map((part) => part.text || '').join('')).join('') ||
      ''

    const parsed = JSON.parse(outputText)

    return json({
      emailSubject: parsed.emailSubject,
      emailBody: parsed.emailBody,
      whatsappBody: parsed.whatsappBody,
      callOpener: parsed.callOpener,
      source: 'ai',
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
