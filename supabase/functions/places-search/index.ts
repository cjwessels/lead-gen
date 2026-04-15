import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_searches_used, monthly_search_limit')
      .eq('id', auth.user.id)
      .single()

    if (profile && profile.monthly_searches_used >= profile.monthly_search_limit) {
      return new Response(JSON.stringify({ error: 'Monthly search limit reached' }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    const body = await req.json()
    const rawQuery = typeof body?.query === 'string' ? body.query : ''
    const parsed = parseStructuredSearch(rawQuery)
    const searchText = typeof body?.searchText === 'string' && body.searchText.trim()
      ? body.searchText.trim()
      : buildLeadSearchText(parsed)

    if (!searchText) {
      return new Response(JSON.stringify({ error: 'Invalid query' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY is not set' }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    const upstream = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.primaryTypeDisplayName',
      },
      body: JSON.stringify({
        textQuery: searchText,
        pageSize: 20,
      }),
    })

    const data = await upstream.json()

    await supabase.rpc('increment_monthly_searches', {
      p_user_id: auth.user.id,
    })

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})

const FIELD_ALIASES = {
  city: 'city',
  town: 'city',
  location: 'city',
  province: 'province',
  keyword: 'keyword',
  keywords: 'keyword',
  service: 'service',
  category: 'category',
  source: 'source',
  custom: 'custom',
  text: 'custom',
  q: 'custom',
}

function parseStructuredSearch(input: string) {
  const query = {
    raw: (input || '').trim(),
    freeText: (input || '').trim(),
    city: undefined,
    province: undefined,
    keyword: undefined,
    service: undefined,
    category: undefined,
    source: undefined,
    custom: undefined,
  }

  let working = query.raw
  const matches = [...query.raw.matchAll(/(\w+):(?:"([^"]+)"|(\S+))/g)]

  for (const match of matches) {
    const key = match[1]?.toLowerCase()
    const value = (match[2] || match[3] || '').trim()
    const mapped = key ? FIELD_ALIASES[key] : undefined
    if (mapped && value) query[mapped] = value
    working = working.replace(match[0], ' ')
  }

  const quotedPhrases = [...working.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim()).filter(Boolean)
  for (const phrase of quotedPhrases) {
    if (!query.city && looksLikeLocation(phrase)) query.city = phrase
    working = working.replace(`"${phrase}"`, ' ')
  }

  working = working.replace(/\s+/g, ' ').trim()
  query.freeText = working

  return query
}

function buildLeadSearchText(query) {
  return [query.keyword, query.service, query.category, query.custom, query.freeText, query.city, query.province]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeLocation(value) {
  return /(?:cape town|johannesburg|pretoria|durban|port elizabeth|east london|bloemfontein|polokwane|mbombela|nelspruit|kimberley|stellenbosch|george|gauteng|western cape|eastern cape|kwazul[ -]?natal|north west)/i.test(value)
}
