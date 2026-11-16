import { Account } from '../types'

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
  const stored = readJson<Array<Account & { password?: string }>>(ACCOUNTS_KEY, [])
  const accounts = stored.map(({ password: _legacyPassword, ...account }) => account)
  if (stored.some(account => Object.prototype.hasOwnProperty.call(account, 'password'))) {
    writeJson(ACCOUNTS_KEY, accounts)
  }
  return accounts
}

export function getAccountById(id: string): Account | null {
  return listAccounts().find(a => a.id === id) || null
}


export function logout() {
  localStorage.removeItem(SESSION_KEY)
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

