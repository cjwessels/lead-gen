import type { Lead } from '../types'

export function generateOutreachPack(lead: Lead) {
  const firstName = lead.name.split(' ')[0]

  return {
    emailSubject: `${lead.name}: faster lead handling for ${lead.category.toLowerCase()} teams`,
    emailBody: `Hi ${firstName},\n\nI run SaaSiFy, a South African software development business focused on custom web apps and websites that help companies respond to leads faster and reduce manual admin.\n\nFrom a quick look, ${lead.name} may benefit from:\n- better lead capture\n- quicker quote turnaround\n- a cleaner mobile experience\n\nIf useful, I can show you a practical concept for ${lead.name} with no obligation.\n\nRegards,\nChris Wessels\nSaaSiFy`,
    whatsappBody: `Hi ${firstName}, Chris here from SaaSiFy. I build custom websites and web apps for SA businesses. I noticed ${lead.name} may be able to improve lead handling and quoting. Are you open to a short intro?`,
    callOpener: `Hi ${firstName}, Chris calling from SaaSiFy. We help businesses improve lead capture and quoting with custom web apps. Is this a bad time for a 30-second intro?`,
  }
}
