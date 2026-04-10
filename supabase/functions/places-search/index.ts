import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return json({ error: 'Invalid query' }, 400)
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')

    if (!googleApiKey) {
      return json({ error: 'GOOGLE_API_KEY is not set' }, 500)
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
        textQuery: query,
        pageSize: 10,
      }),
    })

    const data = await upstream.json()
    return json(data, upstream.status)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}
