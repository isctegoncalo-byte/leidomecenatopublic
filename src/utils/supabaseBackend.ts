import { Account, AccountRole, DocumentReviewEntry, DonationProof, ImpactContract, PlatformNotification, UploadedDoc } from '../types'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { User } from '@supabase/supabase-js'
import { safeUploadName, validateDocumentUpload } from './uploadSecurity'
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
    status: contract.reportPaymentStatus === 'paid' ? 'paid' : 'pending',
    currency: 'eur',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('transactions')
    .upsert(payload, { onConflict: 'contract_id' })
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
