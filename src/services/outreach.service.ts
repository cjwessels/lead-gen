import { supabase } from '../lib/supabase'
import type { Lead, OutreachPack } from '../types'

export function generateOutreachPack(lead: Lead): OutreachPack {
  const firstName = lead.name.split(' ')[0]
  const issues = lead.painPoints.length
    ? lead.painPoints.slice(0, 3).map((item) => `- ${item}`).join('\n')
    : '- stronger lead capture\n- quicker quote turnaround\n- a cleaner mobile experience'

  return {
    emailSubject: `${lead.name}: a practical way to improve lead handling`,
    emailBody: `Hi ${firstName},\n\nI run SaaSiFy, a South African software development business focused on custom websites and web apps that help companies respond faster and reduce manual admin.\n\nFrom a quick look, ${lead.name} may benefit from:\n${issues}\n\nIf useful, I can show you a practical concept tailored to ${lead.name} with no obligation.\n\nRegards,\nChris Wessels\nSaaSiFy`,
    whatsappBody: `Hi ${firstName}, Chris here from SaaSiFy. I build custom websites and web apps for South African businesses. I noticed ${lead.name} may be able to improve lead handling and quoting. Are you open to a quick intro?`,
    callOpener: `Hi ${firstName}, Chris calling from SaaSiFy. We help businesses improve lead capture and quoting with custom web apps. Is this a bad time for a 30-second intro?`,
    source: 'local',
  }
}

export async function generateAiOutreachPack(lead: Lead): Promise<OutreachPack> {
  if (!supabase) {
    return generateOutreachPack(lead)
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !sessionData.session?.access_token) {
    return generateOutreachPack(lead)
  }

  const { data, error } = await supabase.functions.invoke('generate-outreach', {
    body: { lead },
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  })

  if (error || !data) {
    return generateOutreachPack(lead)
  }

  const pack = data as Partial<OutreachPack>

  if (!pack.emailSubject || !pack.emailBody || !pack.whatsappBody || !pack.callOpener) {
    return generateOutreachPack(lead)
  }

  return {
    emailSubject: pack.emailSubject,
    emailBody: pack.emailBody,
    whatsappBody: pack.whatsappBody,
    callOpener: pack.callOpener,
    source: 'ai',
  }
}
