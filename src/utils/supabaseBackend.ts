import { Account, AccountRole, DonationProof, ImpactContract, PlatformNotification, UploadedDoc } from '../types'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'
import { safeUploadName, validateDocumentUpload } from './uploadSecurity'

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
  accepted: boolean | null
  reviewed_at: string | null
  created_at: string
  profiles?: Pick<AdminProfile, 'name' | 'email' | 'role'> | null
}

export interface SupabaseRegisterPayload {
  role: AccountRole
  email: string
  password: string
  userId?: string
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
  role: row.role,
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
  accepted: Boolean(row.accepted),
  reviewedAt: row.reviewed_at,
})

export function realBackendEnabled() {
  return isSupabaseConfigured && Boolean(supabase)
}

type SupabaseAuthResult =
  | { ok: true; account: Account; needsEmailConfirmation?: false }
  | { ok: true; needsEmailConfirmation: true; message: string }
  | { ok: false; error: string }

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

export async function loginReal(email: string, password: string): Promise<SupabaseAuthResult> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !authData.user) {
    return { ok: false, error: error?.message || 'Nao foi possivel iniciar sessao.' }
  }

  const account = await ensureRealProfileAfterLogin(authData.user)
  if (!account) return { ok: false, error: 'Conta encontrada, mas o perfil ainda nao existe.' }
  return { ok: true, account }
}

export async function requestPasswordRecoveryReal(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const redirectTo = `${window.location.origin}/entrar`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updatePasswordReal(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function notifyAdminAboutRegistration(payload: SupabaseRegisterPayload) {
  if (!supabase) return

  try {
    await supabase.functions.invoke('registration-notification', {
      body: {
        to: 'geral@leidomecenato.pt',
        role: payload.role,
        email: payload.email.trim().toLowerCase(),
        userId: payload.userId || '',
        name: payload.name.trim(),
        nif: payload.nif.trim(),
        companyActivity: payload.companyActivity || '',
        institutionLegalName: payload.institutionLegalName || '',
        institutionCategory: payload.institutionCategory || '',
        registeredAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.warn('Nao foi possivel enviar notificacao de registo.', error)
  }
}

export async function notifyAdminAboutDonationIntent(
  contract: ImpactContract,
  notification?: PlatformNotification | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  try {
    const { error } = await supabase.functions.invoke('donation-notification', {
      body: {
        contractId: contract.id,
        companyName: contract.company,
        companyNif: contract.nif,
        companyEmail: contract.email.trim().toLowerCase(),
        institutionName: contract.institutionName,
        donationType: contract.donationType,
        donationAmount: contract.donationAmount,
        donationDate: contract.donationDate,
        reportTier: contract.reportTier.name,
        reportPrice: contract.reportPrice,
        donationMode: contract.donationMode,
        notificationTitle: notification?.title || '',
        notificationBody: notification?.body || '',
        createdAt: new Date().toISOString(),
      },
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (error) {
    console.warn('Nao foi possivel enviar notificacao de donativo por email.', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao enviar notificacao por email.' }
  }
}

export async function notifyAdminAboutCompanyDonationConfirmation(
  proof: DonationProof,
  account: Account,
  confirmedAmount?: number,
  notification?: PlatformNotification | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  try {
    const { error } = await supabase.functions.invoke('donation-notification', {
      body: {
        contractId: proof.contractId,
        companyName: proof.companyName || account.name,
        companyNif: proof.companyNif || account.nif,
        companyEmail: (proof.companyEmail || account.email).trim().toLowerCase(),
        institutionName: proof.institutionName,
        donationType: proof.donationType,
        donationAmount: confirmedAmount || proof.confirmedAmount || proof.amount,
        donationDate: proof.date,
        notificationTitle: notification?.title || '',
        notificationBody: notification?.body || '',
        createdAt: new Date().toISOString(),
      },
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (error) {
    console.warn('Nao foi possivel enviar confirmacao de donativo por email.', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao enviar confirmacao por email.' }
  }
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

function profileFromUser(user: User, fallback?: SupabaseRegisterPayload) {
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    role: (meta.role || fallback?.role || 'empresa') as AccountRole,
    email: user.email || fallback?.email.trim().toLowerCase() || '',
    name: String(meta.name || fallback?.name || user.email?.split('@')[0] || 'Conta'),
    nif: String(meta.nif || fallback?.nif || user.id),
    company_activity: meta.company_activity || fallback?.companyActivity || null,
    institution_legal_name: meta.institution_legal_name || fallback?.institutionLegalName || null,
    institution_category: meta.institution_category || fallback?.institutionCategory || null,
    consent_logo_display: meta.consent_logo_display ?? fallback?.consentLogoDisplay ?? false,
    consent_rgpd: meta.consent_rgpd ?? fallback?.consentRGPD ?? false,
  }
}

async function upsertProfileFromUser(user: User, fallback?: SupabaseRegisterPayload): Promise<Account | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileFromUser(user, fallback), { onConflict: 'id' })
    .select('*')
    .single()

  if (error || !data) return null
  return toAccount(data as AdminProfile)
}

export async function registerReal(payload: SupabaseRegisterPayload): Promise<SupabaseAuthResult> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/entrar` : undefined
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      emailRedirectTo,
      data: {
        role: payload.role,
        name: payload.name.trim(),
        nif: payload.nif.trim(),
        company_activity: payload.companyActivity || null,
        institution_legal_name: payload.institutionLegalName || null,
        institution_category: payload.institutionCategory || null,
        consent_logo_display: payload.consentLogoDisplay ?? false,
        consent_rgpd: payload.consentRGPD ?? false,
      },
    },
  })
  if (authError || !authData.user) {
    return { ok: false, error: authError?.message || 'Nao foi possivel criar a conta.' }
  }

  await notifyAdminAboutRegistration({ ...payload, userId: authData.user.id })

  if (!authData.session) {
    return {
      ok: true,
      needsEmailConfirmation: true,
      message: 'Conta criada. Enviámos um email de confirmação. Confirme o email e depois entre com email e palavra-passe.',
    }
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

export async function ensureRealProfileAfterLogin(user: User): Promise<Account | null> {
  const existing = await getRealSessionAccount()
  if (existing) return existing
  return upsertProfileFromUser(user)
}

export async function listDocsReal(ownerId: string): Promise<UploadedDoc[]> {
  if (!supabase) return []
  const client = supabase
  const { data, error } = await client
    .from('documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  const rows = data as AdminDocument[]
  const docs = await Promise.all(rows.map(async row => {
    const { data: signed } = await client.storage
      .from('documents')
      .createSignedUrl(row.storage_path, 60 * 10)
    return toDoc({ ...row, public_url: signed?.signedUrl || row.public_url })
  }))
  return docs
}

export async function uploadDocReal(ownerId: string, category: string, file: File): Promise<{ ok: true; doc: UploadedDoc } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const validationError = validateDocumentUpload(file)
  if (validationError) return { ok: false, error: validationError }

  const safeName = safeUploadName(file.name)
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
  const client = supabase

  const { data, error } = await client
    .from('documents')
    .select('*, profiles:owner_id(name,email,role)')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const rows = (data || []) as AdminDocument[]
  const documents = await Promise.all(rows.map(async row => {
    const { data: signed } = await client.storage
      .from('documents')
      .createSignedUrl(row.storage_path, 60 * 10)
    return { ...row, public_url: signed?.signedUrl || row.public_url }
  }))

  return { ok: true, documents }
}

export async function updateAdminDocumentAcceptedReal(
  documentId: string,
  accepted: boolean,
): Promise<{ ok: true; document: AdminDocument } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('documents')
    .update({
      accepted,
      reviewed_at: accepted ? new Date().toISOString() : null,
    })
    .eq('id', documentId)
    .select('*, profiles:owner_id(name,email,role)')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message || 'Nao foi possivel atualizar o estado do documento.' }
  }

  return { ok: true, document: data as AdminDocument }
}
