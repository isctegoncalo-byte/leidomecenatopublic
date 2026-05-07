import { Institution, InstitutionRegistration } from '../types'

export interface InstitutionContactLinks {
  email?: string
  phone?: string
  website?: string
  linktreeUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
}

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const demoById: Record<string, InstitutionContactLinks> = {
  '1': { email: 'geral@crescerjuntos.pt', phone: '+351 265 000 001', website: 'https://crescerjuntos.pt', linktreeUrl: 'https://linktr.ee/crescerjuntos', facebookUrl: 'https://facebook.com/crescerjuntos', instagramUrl: 'https://instagram.com/crescerjuntos', linkedinUrl: 'https://linkedin.com/company/crescerjuntos' },
  '2': { email: 'geral@horizontereab.pt', phone: '+351 210 000 002', website: 'https://horizontereab.pt', facebookUrl: 'https://facebook.com/horizontereab', instagramUrl: 'https://instagram.com/horizontereab', linkedinUrl: 'https://linkedin.com/company/horizontereab' },
  '3': { email: 'mecenato@artememoria.pt', phone: '+351 220 000 003', website: 'https://artememoria.pt', linktreeUrl: 'https://linktr.ee/artememoria', facebookUrl: 'https://facebook.com/artememoria', instagramUrl: 'https://instagram.com/artememoria' },
  '4': { email: 'geral@raizverde.pt', phone: '+351 266 000 004', website: 'https://raizverde.pt', facebookUrl: 'https://facebook.com/raizverde', instagramUrl: 'https://instagram.com/raizverde', linkedinUrl: 'https://linkedin.com/company/raizverde', tiktokUrl: 'https://tiktok.com/@raizverde' },
  '5': { email: 'apoio@academiainclusiva.pt', phone: '+351 214 000 005', website: 'https://academiainclusiva.pt', instagramUrl: 'https://instagram.com/academiainclusiva', linkedinUrl: 'https://linkedin.com/company/academiainclusiva' },
  '6': { email: 'mecenato@oceaninvest.pt', phone: '+351 289 000 006', website: 'https://oceaninvest.pt', facebookUrl: 'https://facebook.com/oceaninvest', instagramUrl: 'https://instagram.com/oceaninvest', linkedinUrl: 'https://linkedin.com/company/oceaninvest' },
  '7': { email: 'geral@bancoalimentarporto.pt', phone: '+351 225 000 007', website: 'https://bancoalimentarporto.pt', linktreeUrl: 'https://linktr.ee/bancoalimentarporto', facebookUrl: 'https://facebook.com/bancoalimentarporto', instagramUrl: 'https://instagram.com/bancoalimentarporto' },
  '8': { email: 'apoio@casadacrianca.pt', phone: '+351 239 000 008', website: 'https://casadacrianca.pt', facebookUrl: 'https://facebook.com/casadacrianca', instagramUrl: 'https://instagram.com/casadacrianca' },
  '9': { email: 'geral@musicasemfronteiras.pt', phone: '+351 217 000 009', website: 'https://musicasemfronteiras.pt', linktreeUrl: 'https://linktr.ee/musicasemfronteiras', instagramUrl: 'https://instagram.com/musicasemfronteiras', tiktokUrl: 'https://tiktok.com/@musicasemfronteiras' },
  '10': { email: 'geral@refloresta.pt', phone: '+351 244 000 010', website: 'https://refloresta.pt', facebookUrl: 'https://facebook.com/reflorestapt', instagramUrl: 'https://instagram.com/reflorestapt', linkedinUrl: 'https://linkedin.com/company/reflorestapt' },
  '11': { email: 'geral@apoiomaior.pt', phone: '+351 273 000 011', website: 'https://apoiomaior.pt', facebookUrl: 'https://facebook.com/apoiomaior', linkedinUrl: 'https://linkedin.com/company/apoiomaior' },
  '12': { email: 'geral@codekids.pt', phone: '+351 253 000 012', website: 'https://codekids.pt', linktreeUrl: 'https://linktr.ee/codekidspt', instagramUrl: 'https://instagram.com/codekidspt', linkedinUrl: 'https://linkedin.com/company/codekidspt', tiktokUrl: 'https://tiktok.com/@codekidspt' },
  '13': { email: 'mecenato@teatrosocial.pt', phone: '+351 218 000 013', website: 'https://teatrosocial.pt', facebookUrl: 'https://facebook.com/teatrosocial', instagramUrl: 'https://instagram.com/teatrosocial' },
  '14': { email: 'geral@animaisemrisco.pt', phone: '+351 219 000 014', website: 'https://animaisemrisco.pt', linktreeUrl: 'https://linktr.ee/animaisemrisco', facebookUrl: 'https://facebook.com/animaisemrisco', instagramUrl: 'https://instagram.com/animaisemrisco' },
  '15': { email: 'geral@habitacaosolidaria.pt', phone: '+351 232 000 015', website: 'https://habitacaosolidaria.pt', facebookUrl: 'https://facebook.com/habitacaosolidaria', instagramUrl: 'https://instagram.com/habitacaosolidaria', linkedinUrl: 'https://linkedin.com/company/habitacaosolidaria' },
}

export function getInstitutionContacts(institution: Institution, registration?: InstitutionRegistration | null): InstitutionContactLinks {
  if (registration) {
    return {
      email: registration.email,
      phone: registration.phone,
      website: registration.website,
      linktreeUrl: registration.linktreeUrl,
      facebookUrl: registration.facebookUrl,
      instagramUrl: registration.instagramUrl,
      linkedinUrl: registration.linkedinUrl,
      tiktokUrl: registration.tiktokUrl,
    }
  }

  return demoById[institution.id] || {
    email: `geral@${slug(institution.name)}.pt`,
    phone: '+351 210 000 000',
    website: `https://${slug(institution.name)}.pt`,
    facebookUrl: `https://facebook.com/${slug(institution.name)}`,
    instagramUrl: `https://instagram.com/${slug(institution.name)}`,
  }
}
