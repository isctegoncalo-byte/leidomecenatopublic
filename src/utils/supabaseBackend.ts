import { Account, AccountRole, DocumentReviewEntry, DonationProof, ImpactContract, InstitutionRegistration, PlatformNotification, UploadedDoc } from '../types'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'
import { safeUploadName, validateDocumentUpload, validateImageUpload } from './uploadSecurity'
import {
  calculateIcsScore,
  calculateImpactScore,
  calculateIrodScore,
  calculateIspScore,
  calculateSroi,
  getDonationImpactContext,
  IspDonationItem,
  IspMeasurement,
} from './ispMeasurement'

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
  review_status?: 'pending' | 'accepted' | 'rejected' | null
  review_note?: string | null
  reviewed_by?: string | null
  review_history?: DocumentReviewEntry[] | null
  reviewed_at: string | null
  created_at: string
  profiles?: Pick<AdminProfile, 'name' | 'email' | 'role'> | null
}

export interface AdminInstitutionSubmission {
  id: string
  owner_id: string
  status: 'submitted' | 'confirmed' | 'rejected'
  payload: InstitutionRegistration & { storedAssets?: Array<{ label: string; name: string; path: string; url?: string }> }
  submitted_at: string
  reviewed_at: string | null
  review_note: string | null
}

export interface DonationNotificationRow {
  id: string
  recipient_id: string
  recipient_role: 'empresa' | 'instituicao' | 'admin' | null
  recipient_name: string | null
  kind: PlatformNotification['kind']
  title: string | null
  body: string | null
  read: boolean
  related_proof_id: string | null
  action_label: string | null
  action_view: string | null
  created_at: string
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
  reviewStatus: row.review_status || (row.accepted ? 'accepted' : 'pending'),
  reviewNote: row.review_note,
  reviewedBy: row.reviewed_by,
  reviewHistory: row.review_history || [],
  reviewedAt: row.reviewed_at,
})

export function realBackendEnabled() {
  return isSupabaseConfigured && Boolean(supabase)
}

export interface AdminImpactMeasurementRow {
  proof_id: string
  measurement: IspMeasurement
  donation_context: Record<string, unknown>
  isp_score: number
  irod_score: number
  ics_score: number
  impact_score: number
  sroi_ratio: number | null
  sroi_value: number | null
  company_name: string | null
  institution_name: string | null
  project_name: string | null
  donation_amount: number | null
  project_cost: number | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ReportTransaction {
  id: string
  contract_id: string
  company_profile_id: string | null
  company_name: string
  company_nif: string
  company_email: string
  institution_id: string | null
  institution_name: string
  donation_type: string | null
  donation_amount: number
  donation_date: string | null
  project_cost: number | null
  selected_need_ids: string[] | null
  report_tier_id: string | null
  report_tier_name: string
  report_price: number
  report_vat: number
  report_total: number
  payment_provider: string
  payment_link_url: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  stripe_receipt_url: string | null
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  currency: string
  amount_subtotal_cents: number | null
  amount_tax_cents: number | null
  amount_total_cents: number | null
  invoice_receipt_status: 'pending' | 'issued' | 'not_required'
  invoice_receipt_number: string | null
  invoice_receipt_issued_at: string | null
  invoice_receipt_file_url: string | null
  invoice_receipt_note: string | null
  invoice_receipt_updated_at: string | null
  created_at: string
  updated_at: string
}

function safePublicRole(value: unknown): AccountRole {
  return value === 'instituicao' ? 'instituicao' : 'empresa'
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

  const redirectTo = 'https://leidomecenato.pt/entrar'
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
        reportVat: contract.reportVat,
        reportTotal: contract.reportTotal,
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

export async function upsertReportTransactionPendingReal(
  contract: ImpactContract,
  account: Account,
  paymentLink: string,
): Promise<{ ok: true; transaction: ReportTransaction } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const payload = {
    contract_id: contract.id,
    company_profile_id: account.id,
    company_name: contract.company,
    company_nif: contract.nif,
    company_email: contract.email.trim().toLowerCase(),
    institution_id: contract.institutionId,
    institution_name: contract.institutionName,
    donation_type: contract.donationType,
    donation_amount: contract.donationAmount,
    donation_date: contract.donationDate,
    project_cost: contract.projectCost || null,
    selected_need_ids: contract.selectedNeedIds || [],
    report_tier_id: contract.reportTier.id,
    report_tier_name: contract.reportTier.name,
    report_price: contract.reportPrice,
    report_vat: contract.reportVat || 0,
    report_total: contract.reportTotal || contract.reportPrice,
    payment_provider: 'stripe',
    payment_link_url: paymentLink,
    // Browser initiated writes can only create pending transactions. Paid is server-owned.
    status: 'pending',
    currency: 'eur',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) return { ok: false, error: error?.message || 'Nao foi possivel guardar a transacao.' }
  return { ok: true, transaction: data as ReportTransaction }
}

export async function listCompanyReportTransactionsReal(
  account: Account,
): Promise<{ ok: true; transactions: ReportTransaction[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`company_profile_id.eq.${account.id},company_email.eq.${account.email.trim().toLowerCase()},company_nif.eq.${account.nif}`)
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, transactions: (data || []) as ReportTransaction[] }
}

export async function listAdminReportTransactionsReal(): Promise<{ ok: true; transactions: ReportTransaction[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, transactions: (data || []) as ReportTransaction[] }
}

export async function updateReportTransactionInvoiceReal(
  transactionId: string,
  patch: {
    invoiceReceiptStatus: 'pending' | 'issued' | 'not_required'
    invoiceReceiptNumber?: string
    invoiceReceiptIssuedAt?: string
    invoiceReceiptFileUrl?: string
    invoiceReceiptNote?: string
  },
): Promise<{ ok: true; transaction: ReportTransaction } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('transactions')
    .update({
      invoice_receipt_status: patch.invoiceReceiptStatus,
      invoice_receipt_number: patch.invoiceReceiptNumber?.trim() || null,
      invoice_receipt_issued_at: patch.invoiceReceiptIssuedAt || null,
      invoice_receipt_file_url: patch.invoiceReceiptFileUrl?.trim() || null,
      invoice_receipt_note: patch.invoiceReceiptNote?.trim() || null,
      invoice_receipt_updated_at: new Date().toISOString(),
      invoice_receipt_updated_by: userData.user?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select('*')
    .single()

  if (error || !data) return { ok: false, error: error?.message || 'Nao foi possivel atualizar a fatura-recibo.' }
  return { ok: true, transaction: data as ReportTransaction }
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
    role: safePublicRole(meta.role || fallback?.role),
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

  const emailRedirectTo = 'https://leidomecenato.pt/entrar'
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

  if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
    return {
      ok: true,
      needsEmailConfirmation: true,
      message: 'Este email já está associado a uma conta. Entre ou recupere a palavra-passe. Se a conta ainda não foi confirmada, pode pedir um novo email abaixo.',
    }
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

export async function resendSignupConfirmationReal(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: 'https://leidomecenato.pt/entrar' },
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
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

export async function submitInstitutionRegistrationReal(
  ownerId: string,
  registration: InstitutionRegistration,
  supportingFiles: Record<string, File | null>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== ownerId) return { ok: false, error: 'Inicie sessao com a conta da instituição antes de submeter.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', ownerId).single()
  if (profile?.role !== 'instituicao') return { ok: false, error: 'A submissão exige uma conta registada como instituição.' }

  const uploaded: Array<{ label: string; name: string; path: string; size: number; mimeType: string }> = []
  const uploadPrivateFile = async (file: File, label: string, checkImage = false) => {
    const validationError = checkImage ? validateImageUpload(file) : validateDocumentUpload(file)
    if (validationError) throw new Error(validationError)
    const name = safeUploadName(file.name)
    const path = `${ownerId}/${Date.now()}-${crypto.randomUUID()}-${name}`
    const { error } = await supabase!.storage.from('documents').upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw new Error(error.message)
    uploaded.push({ label, name, path, size: file.size, mimeType: file.type })
  }
  const visit = async (value: unknown, label: string): Promise<unknown> => {
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      const response = await fetch(value)
      const blob = await response.blob()
      const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const file = new File([blob], `${label}.${extension}`, { type: blob.type })
      await uploadPrivateFile(file, label, true)
      return `storage:${uploaded[uploaded.length - 1].path}`
    }
    if (Array.isArray(value)) return Promise.all(value.map((item, index) => visit(item, `${label}-${index + 1}`)))
    if (value && typeof value === 'object') {
      const entries = await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([key, child]) => [key, await visit(child, `${label}-${key}`)] as const))
      return Object.fromEntries(entries)
    }
    return value
  }

  try {
    for (const [label, file] of Object.entries(supportingFiles)) {
      if (file) await uploadPrivateFile(file, label)
    }
    const payload = await visit(registration, 'registo-instituicao') as InstitutionRegistration
    for (const asset of uploaded) {
      const { error: docError } = await supabase.from('documents').insert({
        owner_id: ownerId,
        name: asset.name,
        category: 'anexo-registo-instituicao',
        storage_path: asset.path,
        public_url: null,
        mime_type: asset.mimeType,
        size: asset.size,
      })
      if (docError) throw new Error(docError.message)
    }
    const { data, error } = await supabase.from('institution_submissions').insert({
      owner_id: ownerId,
      status: 'submitted',
      payload: { ...payload, storedAssets: uploaded.map(({ label, name, path }) => ({ label, name, path })) },
    }).select('id').single()
    if (error || !data) throw new Error(error?.message || 'Nao foi possivel guardar a submissão.')
    return { ok: true, id: data.id as string }
  } catch (error) {
    if (uploaded.length) {
      await supabase.storage.from('documents').remove(uploaded.map(asset => asset.path))
      await supabase.from('documents').delete().eq('owner_id', ownerId).eq('category', 'anexo-registo-instituicao').in('storage_path', uploaded.map(asset => asset.path))
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao guardar a submissão da instituição.' }
  }
}

export async function listAdminInstitutionSubmissionsReal(): Promise<{ ok: true; submissions: AdminInstitutionSubmission[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data, error } = await supabase.from('institution_submissions').select('*').order('submitted_at', { ascending: false })
  if (error) return { ok: false, error: error.message }
  const submissions = await Promise.all((data || []).map(async row => {
    const payload = row.payload as AdminInstitutionSubmission['payload']
    const assets = await Promise.all((payload.storedAssets || []).map(async asset => {
      const { data: signed } = await supabase!.storage.from('documents').createSignedUrl(asset.path, 600)
      return { ...asset, url: signed?.signedUrl }
    }))
    return { ...row, payload: { ...payload, storedAssets: assets } } as AdminInstitutionSubmission
  }))
  return { ok: true, submissions }
}

export async function reviewInstitutionSubmissionReal(
  submissionId: string,
  status: 'confirmed' | 'rejected',
  note: string,
  reviewerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== reviewerId) return { ok: false, error: 'A sessão administrativa expirou.' }
  const { error } = await supabase.from('institution_submissions').update({
    status,
    review_note: note.trim() || null,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', submissionId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

type DonationRow = Record<string, any> & {
  id: string
  company_id: string
  institution_profile_id: string | null
  contract_reference: string | null
  metadata: Record<string, unknown> | null
}

async function uploadDonationAttachment(ownerId: string, proofId: string, slot: string, attachment: { name: string; dataUrl: string; size: number }) {
  if (!supabase) throw new Error('Supabase ainda nao esta configurado.')
  const response = await fetch(attachment.dataUrl)
  const blob = await response.blob()
  const file = new File([blob], safeUploadName(attachment.name), { type: blob.type })
  const validationError = validateDocumentUpload(file)
  if (validationError) throw new Error(validationError)
  const path = `${ownerId}/donations/${proofId}/${slot}-${crypto.randomUUID()}-${safeUploadName(file.name)}`
  const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: false, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)
  const { error: rowError } = await supabase.from('documents').insert({
    owner_id: ownerId,
    name: file.name,
    category: 'donation-proof',
    storage_path: path,
    public_url: null,
    mime_type: file.type,
    size: file.size,
  })
  if (rowError) {
    await supabase.storage.from('documents').remove([path])
    throw new Error(rowError.message)
  }
  return path
}

function donationMetadata(proof: DonationProof) {
  return {
    accessCode: proof.accessCode,
    selectedNeedIds: proof.selectedNeedIds || [],
    reportTierName: proof.reportTierName,
    reportPrice: proof.reportPrice,
    reportVat: proof.reportVat,
    reportTotal: proof.reportTotal,
    reportPaymentStatus: proof.reportPaymentStatus,
    publicDonationAmountConsent: proof.publicDonationAmountConsent,
    projectCost: proof.projectCost,
    description: proof.description,
    proofDocId: proof.proofDocId,
    certificateId: proof.certificateId,
    certificateIssuedAt: proof.certificateIssuedAt,
    timelineStatus: proof.timelineStatus,
  }
}

export async function createDonationProofReal(proof: DonationProof): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== proof.companyAccountId) return { ok: false, error: 'Inicie sessão com a conta da empresa para registar o donativo.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'empresa') return { ok: false, error: 'A conta autenticada não tem perfil de empresa.' }

  let proofPath: string | null = null
  try {
    if (proof.proofFileDataUrl?.startsWith('data:')) {
      proofPath = await uploadDonationAttachment(auth.user.id, proof.id, 'comprovativo', {
        name: proof.proofFileName || 'comprovativo.pdf', dataUrl: proof.proofFileDataUrl, size: proof.proofFileSize || 0,
      })
    }
    const { error } = await supabase.from('donations').insert({
      id: proof.id,
      company_id: auth.user.id,
      institution_profile_id: proof.institutionAccountId && /^[0-9a-f-]{36}$/i.test(proof.institutionAccountId) ? proof.institutionAccountId : null,
      contract_reference: proof.contractId,
      institution_name: proof.institutionName,
      company_name: proof.companyName || '',
      company_nif: proof.companyNif || '',
      company_email: proof.companyEmail || auth.user.email || '',
      donation_type: proof.donationType,
      amount: Math.round(proof.amount),
      date: proof.date,
      proof_file_name: proof.proofFileName || null,
      proof_file_url: proofPath,
      proof_file_size: proof.proofFileSize || null,
      company_confirmed: proof.companyConfirmed,
      company_confirmed_amount: proof.companyConfirmedAmount ?? null,
      institution_confirmed: false,
      status: proof.status,
      metadata: donationMetadata(proof),
      timeline_status: proof.timelineStatus || 'intent_created',
    })
    if (error) throw new Error(error.message)
    proof.proofFileStoragePath = proofPath || undefined
    return { ok: true }
  } catch (error) {
    if (proofPath) {
      await supabase.storage.from('documents').remove([proofPath])
      await supabase.from('documents').delete().eq('owner_id', auth.user.id).eq('storage_path', proofPath)
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao guardar o donativo.' }
  }
}

async function donationRowToProof(row: DonationRow): Promise<DonationProof> {
  if (!supabase) throw new Error('Supabase ainda nao esta configurado.')
  const metadata = row.metadata || {}
  const signedUrl = async (path: string | null) => {
    if (!path) return undefined
    const { data } = await supabase!.storage.from('documents').createSignedUrl(path, 600)
    return data?.signedUrl || undefined
  }
  const [proofUrl, invoiceUrl, receiptUrl] = await Promise.all([
    signedUrl(row.proof_file_url), signedUrl(row.company_invoice_file_url), signedUrl(row.institution_receipt_file_url),
  ])
  return {
    id: row.id,
    contractId: row.contract_reference || row.id,
    companyAccountId: row.company_id,
    companyName: row.company_name || '',
    companyNif: row.company_nif || '',
    companyEmail: row.company_email || '',
    institutionAccountId: row.institution_profile_id || undefined,
    institutionName: row.institution_name || '',
    donationType: row.donation_type || null,
    selectedNeedIds: Array.isArray(metadata.selectedNeedIds) ? metadata.selectedNeedIds as string[] : [],
    reportTierName: typeof metadata.reportTierName === 'string' ? metadata.reportTierName : undefined,
    reportPrice: Number(metadata.reportPrice || 0),
    reportVat: Number(metadata.reportVat || 0),
    reportTotal: Number(metadata.reportTotal || 0),
    reportPaymentStatus: metadata.reportPaymentStatus as DonationProof['reportPaymentStatus'],
    amount: Number(row.amount || 0),
    projectCost: Number(metadata.projectCost || 0) || undefined,
    confirmedAmount: Number(row.institution_confirmed_amount || row.company_confirmed_amount || row.amount || 0),
    companyConfirmedAmount: row.company_confirmed_amount == null ? undefined : Number(row.company_confirmed_amount),
    institutionConfirmedAmount: row.institution_confirmed_amount == null ? undefined : Number(row.institution_confirmed_amount),
    publicDonationAmountConsent: Boolean(metadata.publicDonationAmountConsent),
    date: row.date || '',
    description: typeof metadata.description === 'string' ? metadata.description : '',
    proofDocId: typeof metadata.proofDocId === 'string' ? metadata.proofDocId : undefined,
    proofFileName: row.proof_file_name || undefined,
    proofFileDataUrl: proofUrl,
    proofFileStoragePath: row.proof_file_url || undefined,
    proofFileSize: row.proof_file_size || undefined,
    companyInvoiceFileName: row.company_invoice_file_name || undefined,
    companyInvoiceFileDataUrl: invoiceUrl,
    companyInvoiceStoragePath: row.company_invoice_file_url || undefined,
    companyInvoiceFileSize: row.company_invoice_file_size || undefined,
    institutionReceiptFileName: row.institution_receipt_file_name || undefined,
    institutionReceiptFileDataUrl: receiptUrl,
    institutionReceiptStoragePath: row.institution_receipt_file_url || undefined,
    institutionReceiptFileSize: row.institution_receipt_file_size || undefined,
    institutionThankYouMessage: row.institution_thank_you_message || undefined,
    companyConfirmed: Boolean(row.company_confirmed),
    institutionConfirmed: Boolean(row.institution_confirmed),
    status: row.status,
    confirmedAt: row.confirmed_at || undefined,
    certificateId: metadata.certificateId as string | undefined,
    certificateIssuedAt: metadata.certificateIssuedAt as string | undefined,
    timelineStatus: row.timeline_status,
  }
}

export async function listDonationProofsReal(account: Account): Promise<{ ok: true; proofs: DonationProof[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) return { ok: false, error: 'A sessão expirou.' }
  const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false })
  if (error) return { ok: false, error: error.message }
  const rows = (data || []) as DonationRow[]
  const visible = rows.filter(row => row.company_id === account.id || row.institution_profile_id === account.id)
  return { ok: true, proofs: await Promise.all(visible.map(donationRowToProof)) }
}

export async function listAdminDonationProofsReal(): Promise<{ ok: true; proofs: DonationProof[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'A sessão expirou.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Apenas administradores podem consultar todos os donativos.' }
  const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false })
  if (error) return { ok: false, error: error.message }
  return { ok: true, proofs: await Promise.all(((data || []) as DonationRow[]).map(donationRowToProof)) }
}

export async function saveDonationProofReal(proof: DonationProof): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'A sessão expirou.' }
  const { data: current, error: readError } = await supabase.from('donations').select('*').eq('id', proof.id).maybeSingle()
  if (readError || !current) return { ok: false, error: readError?.message || 'Donativo não encontrado no Supabase.' }
  const row = current as DonationRow
  const isCompany = row.company_id === auth.user.id
  const isInstitution = row.institution_profile_id === auth.user.id
  if (!isCompany && !isInstitution) return { ok: false, error: 'A conta atual não participa neste donativo.' }

  const uploaded: string[] = []
  try {
    const patch: Record<string, unknown> = {}
    if (isCompany) {
      patch.company_confirmed = proof.companyConfirmed
      patch.company_confirmed_amount = proof.companyConfirmedAmount ?? null
      if (proof.proofFileDataUrl?.startsWith('data:')) {
        const path = await uploadDonationAttachment(auth.user.id, proof.id, 'comprovativo', { name: proof.proofFileName || 'comprovativo.pdf', dataUrl: proof.proofFileDataUrl, size: proof.proofFileSize || 0 })
        uploaded.push(path); patch.proof_file_url = path; patch.proof_file_name = proof.proofFileName || null; patch.proof_file_size = proof.proofFileSize || null
      }
      if (proof.companyInvoiceFileDataUrl?.startsWith('data:')) {
        const path = await uploadDonationAttachment(auth.user.id, proof.id, 'fatura', { name: proof.companyInvoiceFileName || 'fatura.pdf', dataUrl: proof.companyInvoiceFileDataUrl, size: proof.companyInvoiceFileSize || 0 })
        uploaded.push(path); patch.company_invoice_file_url = path; patch.company_invoice_file_name = proof.companyInvoiceFileName || null; patch.company_invoice_file_size = proof.companyInvoiceFileSize || null
      }
    } else {
      patch.institution_confirmed = proof.institutionConfirmed
      patch.institution_confirmed_amount = proof.institutionConfirmedAmount ?? null
      patch.institution_thank_you_message = proof.institutionThankYouMessage || null
      if (proof.institutionReceiptFileDataUrl?.startsWith('data:')) {
        const path = await uploadDonationAttachment(auth.user.id, proof.id, 'recibo', { name: proof.institutionReceiptFileName || 'recibo.pdf', dataUrl: proof.institutionReceiptFileDataUrl, size: proof.institutionReceiptFileSize || 0 })
        uploaded.push(path); patch.institution_receipt_file_url = path; patch.institution_receipt_file_name = proof.institutionReceiptFileName || null; patch.institution_receipt_file_size = proof.institutionReceiptFileSize || null
      }
    }
    if (proof.status === 'rejected') {
      patch.status = 'rejected'
      patch.rejection_note = 'Donativo rejeitado pelo participante.'
    }
    const { error } = await supabase.from('donations').update(patch).eq('id', proof.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  } catch (error) {
    if (uploaded.length) {
      await supabase.storage.from('documents').remove(uploaded)
      await supabase.from('documents').delete().eq('owner_id', auth.user.id).in('storage_path', uploaded)
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao atualizar o donativo.' }
  }
}

export async function listNotificationsReal(account: Account): Promise<{ ok: true; notifications: PlatformNotification[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) return { ok: false, error: 'A sessão expirou.' }
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
  if (error) return { ok: false, error: error.message }
  const notifications = ((data || []) as DonationNotificationRow[]).map(row => ({
    id: row.id,
    recipientAccountId: row.recipient_id,
    recipientRole: row.recipient_role || undefined,
    recipientName: row.recipient_name || undefined,
    createdAt: row.created_at,
    kind: row.kind,
    title: row.title || '',
    body: row.body || '',
    read: row.read,
    relatedProofId: row.related_proof_id || undefined,
    actionLabel: row.action_label || undefined,
    actionView: row.action_view as PlatformNotification['actionView'],
  }))
  return { ok: true, notifications }
}

export async function listChatThreadsReal(account: Account): Promise<{ ok: true; threads: import('../types').ChatThread[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) return { ok: false, error: 'A sessão expirou.' }
  const { data: threadRows, error } = await supabase.from('chat_threads').select('*').order('updated_at', { ascending: false })
  if (error) return { ok: false, error: error.message }
  const rows = (threadRows || []) as Array<Record<string, any> & { id: string; donation_id: string | null }>
  if (!rows.length) return { ok: true, threads: [] }
  const donationIds = rows.map(row => row.donation_id).filter((id): id is string => Boolean(id))
  const [{ data: donations }, { data: messages }] = await Promise.all([
    donationIds.length ? supabase.from('donations').select('*').in('id', donationIds) : Promise.resolve({ data: [] as any[] }),
    supabase.from('chat_messages').select('*').in('thread_id', rows.map(row => row.id)).order('created_at', { ascending: true }),
  ])
  const donationMap = new Map(((donations || []) as DonationRow[]).map(row => [row.id, row]))
  const messageRows = (messages || []) as Array<Record<string, any>>
  const threads = rows.map(row => {
    const donation = row.donation_id ? donationMap.get(row.donation_id) : undefined
    return {
      id: row.id,
      contractId: donation?.contract_reference || donation?.id || row.id,
      proofId: donation?.id,
      companyAccountId: row.company_id,
      companyName: donation?.company_name || 'Empresa',
      institutionAccountId: row.institution_profile_id || undefined,
      institutionName: donation?.institution_name || 'Instituição',
      donationAmount: Number(donation?.amount || 0),
      donationType: donation?.donation_type || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status || 'open',
      messages: messageRows.filter(message => message.thread_id === row.id).map(message => ({
        id: message.id,
        threadId: message.thread_id,
        senderAccountId: message.sender_id,
        senderName: message.sender_name || '',
        senderRole: message.sender_role,
        body: message.body || '',
        createdAt: message.created_at,
      })),
    }
  }) as import('../types').ChatThread[]
  return { ok: true, threads }
}

export async function sendChatMessageReal(threadId: string, account: Account, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) return { ok: false, error: 'A sessão expirou.' }
  const { error } = await supabase.from('chat_messages').insert({ thread_id: threadId, sender_id: account.id, sender_name: account.name, sender_role: account.role, body: body.trim() })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function closeChatThreadReal(threadId: string, account: Account): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) return { ok: false, error: 'A sessão expirou.' }
  const { error } = await supabase.from('chat_threads').update({ status: 'closed' }).eq('id', threadId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function markNotificationReadReal(id: string, markAllForAccountId?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || (markAllForAccountId && auth.user.id !== markAllForAccountId)) return { ok: false, error: 'A sessão expirou.' }
  let query = supabase.from('notifications').update({ read: true })
  if (markAllForAccountId) query = query.eq('recipient_id', markAllForAccountId)
  else query = query.eq('id', id)
  const { error } = await query
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

export async function deleteAdminProfileReal(profileId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { error } = await supabase.functions.invoke('admin-delete-account', {
    body: { profileId },
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
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
  reviewNote = '',
  reviewerLabel = 'Admin',
): Promise<{ ok: true; document: AdminDocument } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }
  const reviewedAt = new Date().toISOString()
  const nextStatus = accepted ? 'accepted' : 'rejected'
  const historyEntry: DocumentReviewEntry = {
    status: nextStatus,
    note: reviewNote.trim(),
    reviewedAt,
    reviewedBy: reviewerLabel,
  }

  const { data: current } = await supabase
    .from('documents')
    .select('review_history')
    .eq('id', documentId)
    .maybeSingle()
  const reviewHistory = Array.isArray(current?.review_history) ? current.review_history : []

  const { data, error } = await supabase
    .from('documents')
    .update({
      accepted,
      review_status: nextStatus,
      review_note: reviewNote.trim() || null,
      reviewed_by: reviewerLabel,
      review_history: [...reviewHistory, historyEntry],
      reviewed_at: reviewedAt,
    })
    .eq('id', documentId)
    .select('*, profiles:owner_id(name,email,role)')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message || 'Nao foi possivel atualizar o estado do documento.' }
  }

  return { ok: true, document: data as AdminDocument }
}

function projectNameForImpactItem(item: IspDonationItem) {
  return item.project?.projectName || item.project?.subcategory || item.project?.category || null
}

export async function listImpactMeasurementsReal(): Promise<{ ok: true; measurements: IspMeasurement[]; rows: AdminImpactMeasurementRow[] } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('impact_measurements')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const rows = (data || []) as AdminImpactMeasurementRow[]
  return {
    ok: true,
    rows,
    measurements: rows.map(row => row.measurement),
  }
}

export async function getImpactMeasurementReal(proofId: string): Promise<{ ok: true; measurement: IspMeasurement | null } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const { data, error } = await supabase
    .from('impact_measurements')
    .select('measurement')
    .eq('proof_id', proofId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  return { ok: true, measurement: (data?.measurement as IspMeasurement | undefined) || null }
}

export async function saveImpactMeasurementReal(
  item: IspDonationItem,
  measurement: IspMeasurement,
): Promise<{ ok: true; row: AdminImpactMeasurementRow } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase ainda nao esta configurado.' }

  const donationContext = getDonationImpactContext(item)
  const sroi = calculateSroi(item, measurement)
  const { data: userData } = await supabase.auth.getUser()
  const payload = {
    proof_id: measurement.proofId,
    measurement: { ...measurement, updatedAt: new Date().toISOString() },
    donation_context: donationContext,
    isp_score: calculateIspScore(measurement),
    irod_score: calculateIrodScore(item, measurement).score,
    ics_score: calculateIcsScore(item, measurement).score,
    impact_score: calculateImpactScore(item, measurement).score,
    sroi_ratio: sroi.ratio,
    sroi_value: sroi.adjustedSocialValue,
    company_name: item.companyName,
    institution_name: item.proof.institutionName,
    project_name: projectNameForImpactItem(item),
    donation_amount: donationContext.donationAmount,
    project_cost: donationContext.projectCost,
    updated_by: userData.user?.id || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('impact_measurements')
    .upsert(payload, { onConflict: 'proof_id' })
    .select('*')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message || 'Nao foi possivel guardar a medicao de impacto.' }
  }

  return { ok: true, row: data as AdminImpactMeasurementRow }
}

