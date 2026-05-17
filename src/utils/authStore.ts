import { Account, AccountRole } from '../types'

const ACCOUNTS_KEY = 'leidomecenato_accounts'
const SESSION_KEY = 'leidomecenato_session'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listAccounts(): Account[] {
  return readJson<Account[]>(ACCOUNTS_KEY, [])
}

export function findAccountByEmail(email: string): Account | null {
  return listAccounts().find(a => a.email.trim().toLowerCase() === email.trim().toLowerCase()) || null
}

export function getAccountById(id: string): Account | null {
  return listAccounts().find(a => a.id === id) || null
}

export interface RegisterPayload {
  role: AccountRole
  email: string
  password: string
  name: string
  nif: string
  companyActivity?: string
  institutionLegalName?: string
  institutionCategory?: string
  institutionLogoUrl?: string
  consentLogoDisplay?: boolean
  consentRGPD?: boolean
}

export function registerAccount(payload: RegisterPayload): { ok: true; account: Account } | { ok: false; error: string } {
  if (!payload.email || !payload.password || !payload.name || !payload.nif) {
    return { ok: false, error: 'Preencha todos os campos obrigatórios.' }
  }
  if (!/^\d{9}$/.test(payload.nif.trim())) {
    return { ok: false, error: 'O NIF deve ter exatamente 9 dígitos numéricos.' }
  }
  if (findAccountByEmail(payload.email)) {
    return { ok: false, error: 'Já existe uma conta com este email.' }
  }

  const account: Account = {
    id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: payload.role,
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    name: payload.name.trim(),
    nif: payload.nif.trim(),
    createdAt: new Date().toISOString(),
    companyActivity: payload.companyActivity,
    institutionLegalName: payload.institutionLegalName,
    institutionCategory: payload.institutionCategory,
    institutionLogoUrl: payload.institutionLogoUrl,
    consentLogoDisplay: payload.consentLogoDisplay ?? false,
    consentRGPD: payload.consentRGPD ?? false,
  }

  const all = listAccounts()
  writeJson(ACCOUNTS_KEY, [...all, account])
  setSession(account.id)
  return { ok: true, account }
}

export function login(email: string, password: string): { ok: true; account: Account } | { ok: false; error: string } {
  const account = findAccountByEmail(email)
  if (!account) return { ok: false, error: 'Email não encontrado.' }
  if (account.password !== password) return { ok: false, error: 'Palavra-passe incorreta.' }
  setSession(account.id)
  return { ok: true, account }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function setSession(accountId: string) {
  localStorage.setItem(SESSION_KEY, accountId)
}

export function getSession(): Account | null {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  return getAccountById(id)
}

export function updateAccount(id: string, patch: Partial<Account>) {
  const all = listAccounts()
  const next = all.map(a => (a.id === id ? { ...a, ...patch } : a))
  writeJson(ACCOUNTS_KEY, next)
}

export function listAccountsWithLogoConsent(): Account[] {
  return listAccounts().filter(a => a.consentLogoDisplay === true)
}

const DEMO_ACCOUNTS_CLEANUP_FLAG = 'leidomecenato_demo_accounts_removed_v1'
const DEMO_ACCOUNT_EMAILS = new Set([
  'empresa@demo.pt',
  'instituicao@demo.pt',
  'geral@techglobal.pt',
  'geral@mobilipro.pt',
  'info@solverde.pt',
  'geral@construtora-atlas.pt',
  'admin@farmacia-central.pt',
  'geral@autorepara.pt',
  'geral@padariasol.pt',
  'info@designlx.pt',
  'geral@logisticapro.pt',
  'info@consultmais.pt',
  'geral@vinhosdouro.pt',
  'info@turismorural.pt',
  'geral@agroalentejo.pt',
  'geral@clinicasaude.pt',
  'info@smartbuilding.pt',
  'geral@crescerjuntos.pt',
  'geral@horizontereab.pt',
  'geral@artememoria.pt',
  'geral@raizverde.pt',
  'geral@academiainclusiva.pt',
  'geral@oceaninvest.pt',
  'geral@bancalimentar.pt',
  'geral@casadacrianca.pt',
  'geral@musicasemfronteiras.pt',
  'geral@refloresta.pt',
  'geral@apoiomaior.pt',
  'geral@codekids.pt',
  'geral@teatrosocial.pt',
  'geral@animaisemrisco.pt',
  'geral@habitacaosolidaria.pt',
])

function removeDemoAccounts() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(DEMO_ACCOUNTS_CLEANUP_FLAG)) return

  const current = listAccounts()
  const cleaned = current.filter(account => {
    const email = account.email.trim().toLowerCase()
    const isDemoId =
      account.id === 'acc-demo-empresa' ||
      account.id === 'acc-demo-instituicao' ||
      /^acc-[ei]\d+$/.test(account.id)

    return !isDemoId && !DEMO_ACCOUNT_EMAILS.has(email)
  })

  if (cleaned.length !== current.length) {
    writeJson(ACCOUNTS_KEY, cleaned)
  }

  if (!cleaned.some(account => account.id === localStorage.getItem(SESSION_KEY))) {
    localStorage.removeItem(SESSION_KEY)
  }

  localStorage.setItem(DEMO_ACCOUNTS_CLEANUP_FLAG, '1')
}

export function seedDemoAccounts() {
  removeDemoAccounts()
}

seedDemoAccounts()
