import { InstitutionRegistration } from '../types'

const INSTITUTIONS_KEY = 'leidomecenato_institution_registrations'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function saveInstitutionRegistration(registration: InstitutionRegistration) {
  const all = readJson<InstitutionRegistration[]>(INSTITUTIONS_KEY, [])
  const filtered = all.filter(item => item.nif !== registration.nif && item.legalName !== registration.legalName)
  writeJson(INSTITUTIONS_KEY, [...filtered, registration])
}

export function findInstitutionRegistration(name: string) {
  const all = readJson<InstitutionRegistration[]>(INSTITUTIONS_KEY, [])
  return all.find(item => item.name.trim().toLowerCase() === name.trim().toLowerCase() || item.legalName.trim().toLowerCase() === name.trim().toLowerCase()) || null
}
