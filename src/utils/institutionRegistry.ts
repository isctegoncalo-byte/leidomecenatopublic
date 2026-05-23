import { InstitutionRegistration } from '../types'

const INSTITUTIONS_KEY = 'leidomecenato_institution_registrations'
const REGISTRY_CLEANUP_FLAG = 'leidomecenato_institution_registry_cleaned_v1'

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

export function listInstitutionRegistrations() {
  if (typeof window !== 'undefined' && !localStorage.getItem(REGISTRY_CLEANUP_FLAG)) {
    localStorage.removeItem(INSTITUTIONS_KEY)
    localStorage.setItem(REGISTRY_CLEANUP_FLAG, '1')
  }
  return readJson<InstitutionRegistration[]>(INSTITUTIONS_KEY, [])
}
