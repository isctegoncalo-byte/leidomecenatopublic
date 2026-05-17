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

// Seed demo accounts on first load
const SEED_FLAG = 'leidomecenato_accounts_seeded_v5'
const DEMO_COMPANY_CLEANUP_FLAG = 'leidomecenato_demo_companies_removed_v1'
const DEMO_COMPANY_EMAILS = new Set([
  'empresa@demo.pt',
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
])

function removeDemoCompanies() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(DEMO_COMPANY_CLEANUP_FLAG)) return
  const current = listAccounts()
  const cleaned = current.filter(account =>
    account.role !== 'empresa' ||
    (!account.id.startsWith('acc-e') && account.id !== 'acc-demo-empresa' && !DEMO_COMPANY_EMAILS.has(account.email))
  )
  if (cleaned.length !== current.length) writeJson(ACCOUNTS_KEY, cleaned)
  localStorage.setItem(DEMO_COMPANY_CLEANUP_FLAG, '1')
}

export function seedDemoAccounts() {
  if (typeof window === 'undefined') return
  removeDemoCompanies()
  if (localStorage.getItem(SEED_FLAG)) return
  const existing = listAccounts()

  const demoEmpresas: Account[] = []

  const demoInstituicoes: Account[] = [
    { id: 'acc-demo-instituicao', role: 'instituicao', email: 'instituicao@demo.pt', password: 'demo1234', name: 'Associação Crescer Juntos', nif: '500111222', createdAt: new Date().toISOString(), institutionLegalName: 'Associação Crescer Juntos — IPSS', institutionCategory: 'Infância e Juventude', consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i1',  role: 'instituicao', email: 'geral@crescerjuntos.pt',     password: 'demo1234', name: 'Associação Crescer Juntos',        nif: '500111222', createdAt: new Date().toISOString(), institutionLegalName: 'Associação Crescer Juntos — IPSS',             institutionCategory: 'Infância e Juventude',    consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i2',  role: 'instituicao', email: 'geral@horizontereab.pt',     password: 'demo1234', name: 'Centro de Reabilitação Horizonte', nif: '500222333', createdAt: new Date().toISOString(), institutionLegalName: 'Centro de Reabilitação Horizonte, CRL',       institutionCategory: 'Saúde',                   consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i3',  role: 'instituicao', email: 'geral@artememoria.pt',       password: 'demo1234', name: 'Fundação Arte & Memória',          nif: '500333444', createdAt: new Date().toISOString(), institutionLegalName: 'Fundação para a Preservação do Património',   institutionCategory: 'Cultura e Património',    consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i4',  role: 'instituicao', email: 'geral@raizverde.pt',         password: 'demo1234', name: 'Associação Raiz Verde',            nif: '500444555', createdAt: new Date().toISOString(), institutionLegalName: 'Associação Raiz Verde — Ambiente',            institutionCategory: 'Ambiente',                consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i5',  role: 'instituicao', email: 'geral@academiainclusiva.pt', password: 'demo1234', name: 'Academia Desportiva Inclusiva',    nif: '500555666', createdAt: new Date().toISOString(), institutionLegalName: 'Academia Desportiva para a Inclusão, IPSS',   institutionCategory: 'Desporto',                consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i6',  role: 'instituicao', email: 'geral@oceaninvest.pt',       password: 'demo1234', name: 'Instituto de Investigação Oceânica', nif: '500666777', createdAt: new Date().toISOString(), institutionLegalName: 'Instituto de Investigação Oceânica',        institutionCategory: 'Ciência e Investigação',  consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i7',  role: 'instituicao', email: 'geral@bancalimentar.pt',     password: 'demo1234', name: 'Banco Alimentar do Porto',         nif: '500777888', createdAt: new Date().toISOString(), institutionLegalName: 'Banco Alimentar Contra a Fome — Porto',       institutionCategory: 'Ação Social',             consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i8',  role: 'instituicao', email: 'geral@casadacrianca.pt',     password: 'demo1234', name: 'Casa da Criança de Coimbra',       nif: '500888999', createdAt: new Date().toISOString(), institutionLegalName: 'Casa da Criança de Coimbra, IPSS',            institutionCategory: 'Infância e Juventude',    consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i9',  role: 'instituicao', email: 'geral@musicasemfronteiras.pt', password: 'demo1234', name: 'Música Sem Fronteiras',          nif: '500999111', createdAt: new Date().toISOString(), institutionLegalName: 'Associação Música Sem Fronteiras',            institutionCategory: 'Cultura e Património',    consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i10', role: 'instituicao', email: 'geral@refloresta.pt',         password: 'demo1234', name: 'Refloresta Portugal',             nif: '501111222', createdAt: new Date().toISOString(), institutionLegalName: 'Refloresta — Associação Ambiental',           institutionCategory: 'Ambiente',                consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i11', role: 'instituicao', email: 'geral@apoiomaior.pt',         password: 'demo1234', name: 'Apoio Maior — Idosos',            nif: '501222333', createdAt: new Date().toISOString(), institutionLegalName: 'Apoio Maior — Centro de Dia, IPSS',           institutionCategory: 'Ação Social',             consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i12', role: 'instituicao', email: 'geral@codekids.pt',           password: 'demo1234', name: 'CodeKids — Programação para Todos', nif: '501333444', createdAt: new Date().toISOString(), institutionLegalName: 'Associação CodeKids',                       institutionCategory: 'Educação',                consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i13', role: 'instituicao', email: 'geral@teatrosocial.pt',       password: 'demo1234', name: 'Teatro Social de Lisboa',         nif: '501444555', createdAt: new Date().toISOString(), institutionLegalName: 'Teatro Social de Lisboa — Associação Cultural', institutionCategory: 'Cultura e Património',  consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i14', role: 'instituicao', email: 'geral@animaisemrisco.pt',     password: 'demo1234', name: 'Animais em Risco',                nif: '501555666', createdAt: new Date().toISOString(), institutionLegalName: 'Associação Animais em Risco',                 institutionCategory: 'Ambiente',                consentLogoDisplay: true, consentRGPD: true },
    { id: 'acc-i15', role: 'instituicao', email: 'geral@habitacaosolidaria.pt', password: 'demo1234', name: 'Habitação Solidária',             nif: '501666777', createdAt: new Date().toISOString(), institutionLegalName: 'Habitação Solidária — Cooperativa',           institutionCategory: 'Ação Social',             consentLogoDisplay: true, consentRGPD: true },
  ]

  const toAdd = [...demoEmpresas, ...demoInstituicoes].filter(
    a => !existing.find(e => e.email === a.email || e.id === a.id)
  )

  if (toAdd.length > 0) {
    writeJson(ACCOUNTS_KEY, [...existing, ...toAdd])
  }
  localStorage.setItem(SEED_FLAG, '1')
}

seedDemoAccounts()
