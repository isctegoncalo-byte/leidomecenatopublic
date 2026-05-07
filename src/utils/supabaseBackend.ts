import { Account, AccountRole, UploadedDoc } from '../types'
import { isSupabaseConfigured, supabase } from './supabaseClient'

export interface AdminProfile {
  id: string
  role: AccountRole | 'admin'
  email: string
  name: string
  nif: string
  created_at: string
  company_activity: string | null
  institution_legal_name: string | null
  institution_category: string | null
  institution_logo_url: string | null
  consent_logo_display: boolean | null
  consent_rgpd: boolean | null
}

export interface AdminDocument {
  id: string
  owner_id: string
  name: string
  category: string
  storage_path: string
  public_url: string | null
  mime_type: string | null
  size: number
  created_at: string
  profiles?: Pick<AdminProfile, 'name' | 'email' | 'role'> | null
}

export interface SupabaseRegisterPayload {
  role: AccountRole
  email: string
  password: string
  name: string
  nif: string
  companyActivity?: string
  institutionLegalName?: string
  institutionCategory?: string
  consentLogoDisplay?: boolean
  consentRGPD?: boolean
}

const toAccount = (row: AdminProfile): Account => ({
  id: row.id,
  role: row.role === 'admin' ? 'empresa' : row.role,
  email: row.email,
  password: '',
  name: row.name,
  nif: row.nif,
  createdAt: row.created_at,
  companyActivity: row.company_activity || undefined,
  institutionLegalName: row.institution_legal_name || undefined,
  institutionCategory: row.institution_category || undefined,
  institutionLogoUrl: row.institution_logo_url || undefined,
  consentLogoDisplay: row.consent_logo_display ?? false,
  consentRGPD: row.consent_rgpd ?? false,
})

const toDoc = (row: AdminDocument): UploadedDoc => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  category: row.category,
  uploadedAt: row.created_at,
  dataUrl: row.public_url || '',
  size: row.size,
})

export function realBackendEnabled() {
  return isSupabaseConfigured && Boolean(supabase)
}

export async function getRealSessionAccount(): Promise<Account | null> {
  if (!supabase) return null
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return toAccount(data as AdminProfile)
}

export async function loginReal(email: string, password: string): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !authData.user) {
    return { ok: false, error: error?.message || 'Nao foi possivel iniciar sessao.' }
  }

  const account = await getRealSessionAccount()
  if (!account) return { ok: false, error: 'Conta encontrada, mas o perfil ainda nao existe.' }
  return { ok: true, account }
}

function profileFromPayload(userId: string, payload: SupabaseRegisterPayload) {
  return {
    id: userId,
    role: payload.role,
    email: payload.email.trim().toLowerCase(),
    name: payload.name.trim(),
    nif: payload.nif.trim(),
    company_activity: payload.companyActivity || null,
    institution_legal_name: payload.institutionLegalName || null,
    institution_category: payload.institutionCategory || null,
    consent_logo_display: payload.consentLogoDisplay ?? false,
    consent_rgpd: payload.consentRGPD ?? false,
  }
}

export async function registerReal(payload: SupabaseRegisterPayload): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  })
  if (authError || !authData.user) {
    return { ok: false, error: authError?.message || 'Nao foi possivel criar a conta.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileFromPayload(authData.user.id, payload), { onConflict: 'id' })
    .select('*')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message || 'Conta criada. Confirme o email se o Supabase pedir, depois entre com email e palavra-passe.' }
  }

  return { ok: true, account: toAccount(data as AdminProfile) }
}

export async function logoutReal() {
  if (supabase) await supabase.auth.signOut()
}

export async function listDocsReal(ownerId: string): Promise<UploadedDoc[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  const rows = data as AdminDocument[]
  const docs = await Promise.all(rows.map(async row => {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(row.storage_path, 60 * 10)
    return toDoc({ ...row, public_url: signed?.signedUrl || row.public_url })
  }))
  return docs
}

export async function uploadDocReal(ownerId: string, category: string, file: File): Promise<{ ok: true; doc: UploadedDoc } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const storagePath = `${ownerId}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: false, contentType: file.type || undefined })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      owner_id: ownerId,
      name: file.name,
      category,
      storage_path: storagePath,
      public_url: null,
      mime_type: file.type || null,
      size: file.size,
    })
    .select('*')
    .single()

  if (error || !data) return { ok: false, error: error?.message || 'Ficheiro enviado, mas sem registo na base de dados.' }
  return { ok: true, doc: toDoc(data as AdminDocument) }
}

export async function deleteDocReal(doc: UploadedDoc): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', doc.id)
    .single()

  const storagePath = (data as { storage_path?: string } | null)?.storage_path
  if (storagePath) await supabase.storage.from('documents').remove([storagePath])

  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function listAdminProfilesReal(): Promise<{ ok: true; profiles: AdminProfile[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, profiles: (data || []) as AdminProfile[] }
}

export async function listAdminDocumentsReal(): Promise<{ ok: true; documents: AdminDocument[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('documents')
    .select('*, profiles:owner_id(name,email,role)')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const rows = (data || []) as AdminDocument[]
  const documents = await Promise.all(rows.map(async row => {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(row.storage_path, 60 * 10)
    return { ...row, public_url: signed?.signedUrl || row.public_url }
  }))

  return { ok: true, documents }
}
