export type DonationType = 'dinheiro' | 'produtos' | null
export type ViewType =
  | 'home' | 'empresa' | 'instituicao' | 'empresas' | 'instituicoes' | 'simulador'
  | 'esg-report' | 'dashboard' | 'lei-mecenato' | 'impacto-real' | 'faq' | 'projeto'
  | 'login' | 'area-privada' | 'admin' | 'relatorios'
  | 'privacidade' | 'termos' | 'cookies'

export type ESGPillar = 'E' | 'S' | 'G'

export type AccountRole = 'empresa' | 'instituicao' | 'admin'

export interface Account {
  id: string
  role: AccountRole
  email: string
  password: string             // simulação: em produção seria hash
  name: string                 // nome da empresa ou instituição
  nif: string
  createdAt: string
  // Empresa
  companyActivity?: string
  // Instituição
  institutionLegalName?: string
  institutionCategory?: string
  institutionLogoUrl?: string
  // Consentimentos
  consentLogoDisplay?: boolean   // autoriza uso do logótipo na barra de parceiros do site
  consentRGPD?: boolean          // consente o tratamento de dados de acordo com o RGPD
}

export interface UploadedDoc {
  id: string
  ownerId: string              // account id
  name: string
  category: string             // ex: "estatutos", "comprovativo donativo", "outro"
  uploadedAt: string
  dataUrl: string              // base64
  size: number                 // bytes
  accepted?: boolean
  reviewedAt?: string | null
  reviewStatus?: 'pending' | 'accepted' | 'rejected'
  reviewNote?: string | null
  reviewedBy?: string | null
  reviewHistory?: DocumentReviewEntry[]
}

export interface DocumentReviewEntry {
  status: 'pending' | 'accepted' | 'rejected'
  note?: string
  reviewedAt: string
  reviewedBy?: string
}

export type DonationProofStatus = 'pending-institution' | 'pending-company' | 'confirmed' | 'rejected'

export type DonationTimelineStatus =
  | 'intent_created'
  | 'docs_uploaded_by_company'
  | 'confirmed_by_institution'
  | 'receipt_uploaded_by_institution'
  | 'confirmed_by_both'
  | 'report_in_progress'
  | 'report_available'

export interface DonationProof {
  id: string
  contractId: string
  // Mantidos como opcionais para compatibilidade com versões antigas guardadas em localStorage.
  accessCode?: string
  companyAccountId: string
  companyName?: string
  companyNif?: string
  companyEmail?: string
  institutionAccountId?: string
  institutionName: string
  donationType?: DonationType
  selectedNeedIds?: string[]
  reportTierName?: string
  reportPrice?: number
  reportVat?: number
  reportTotal?: number
  reportPaymentStatus?: 'none' | 'pending' | 'paid'
  amount: number
  projectCost?: number
  confirmedAmount?: number
  companyConfirmedAmount?: number
  institutionConfirmedAmount?: number
  publicDonationAmountConsent?: boolean
  date: string
  description: string
  proofDocId?: string          // documento submetido pela empresa
  proofFileName?: string
  proofFileDataUrl?: string
  proofFileSize?: number
  companyInvoiceFileName?: string
  companyInvoiceFileDataUrl?: string
  companyInvoiceFileSize?: number
  institutionReceiptFileName?: string
  institutionReceiptFileDataUrl?: string
  institutionReceiptFileSize?: number
  institutionThankYouMessage?: string
  companyConfirmed: boolean
  institutionConfirmed: boolean
  status: DonationProofStatus
  confirmedAt?: string
  certificateId?: string
  certificateIssuedAt?: string
  // Nova Timeline do Donativo
  timelineStatus?: DonationTimelineStatus
}

export interface DonationIntentNotification {
  id: string
  createdAt: string
  institutionAccountId?: string
  institutionName: string
  companyName: string
  companyNif: string
  companyEmail: string
  donationType: DonationType
  amount: number
  date: string
  subject: string
  body: string
  read: boolean
  contractId: string
}

export interface ChatMessage {
  id: string
  threadId: string
  senderAccountId: string
  senderName: string
  senderRole: AccountRole
  body: string
  createdAt: string
}

export interface ChatThread {
  id: string
  contractId: string
  proofId?: string
  companyAccountId: string
  companyName: string
  institutionAccountId?: string
  institutionName: string
  donationAmount: number
  donationType: DonationType
  createdAt: string
  updatedAt: string
  status: 'open' | 'closed'
  messages: ChatMessage[]
}

export type NotificationAudience = 'empresa' | 'instituicao' | 'admin'

export type NotificationKind =
  | 'donation-intent'
  | 'donation-registered'
  | 'company-confirmed'
  | 'institution-confirmed'
  | 'donation-confirmed'
  | 'donation-rejected'
  | 'report-available'
  | 'document-uploaded'

export interface PlatformNotification {
  id: string
  recipientAccountId?: string
  recipientRole?: NotificationAudience
  recipientName?: string
  createdAt: string
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  relatedContractId?: string
  relatedProofId?: string
  actionLabel?: string
  actionView?: ViewType
}

export interface NeedItem {
  id: string
  // Campos opcionais mantidos para compatibilidade com versões anteriores.
  supportType?: 'dinheiro' | 'produtos'
  status?: 'ativo' | 'concluido' | 'inativo'
  implementationPhase?: 'candidatura' | 'a-decorrer' | 'inativo'
  projectName?: string
  category: string
  subcategory: string
  description: string
  executiveSummary?: string
  rationale?: string
  keyPopulations?: string[]
  targetPopulation?: string
  targetPopulationOther?: string
  objectives?: string
  quantity?: string
  projectPhotoUrls?: string[]
  requestedAmount?: number
  productOrService?: string
  productOrServiceCategory?: string
  productOrServiceOther?: string
  totalProjectCost?: number
  securedFunding?: number
  estimatedValue?: number
  urgency: 'alta' | 'media' | 'baixa'
  sdgGoals: number[]
  esgPillar: ESGPillar
  impactMetric: string
  beneficiaries?: number
  projectStartDate?: string
  projectEndDate?: string
  continuousProject?: boolean
  territorialScope?: {
    national?: boolean
    districtLevel?: boolean
    municipalityLevel?: boolean
    districts?: string[]
    municipalities?: string[]
  }
  professionalsInvolved?: number
  disclosureMethods?: string[]
  disclosureOther?: string
  disclosurePlan?: string
  resultsPresentation?: string
  responsiblePerson?: string
  donationContactPerson?: string
  publicEmail?: string
  publicContacts?: string
  publicSocialLinks?: string
  publicWebsite?: string
  customKpis?: string[]
  generalImpactMetrics?: GeneralImpactMetrics
  odsImpactMetrics?: Record<number, Record<string, string | number>>
}

export interface GeneralImpactMetrics {
  durationMonths?: number
  geographicScope?: string
  indirectBeneficiaries?: number
  volunteersInvolved?: number
  evidenceMethod?: string
  reportingFrequency?: string
}

export interface InstitutionRegistration {
  accountId?: string
  name: string
  legalName: string
  nif: string
  type: string
  category: string
  founded: string
  description: string
  mission: string
  address: string
  municipality: string
  district: string
  postalCode: string
  phone: string
  email: string
  website: string
  linktreeUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
  iban: string
  fullTimeStaff: number
  partTimeStaff: number
  volunteers: number
  annualBudget: string
  peopleReachedPerYear: number
  mainActivities: string
  pastAchievements: string
  logoUrl: string
  photoUrls: string[]
  needs: NeedItem[]
  statutes: boolean
  utilidadePublica: boolean
  lastAccountsApproved: boolean
  termsAccepted?: boolean
  termsAcceptedAt?: string
  termsVersion?: string
  termsDocumentUrl?: string
}

export interface ESGScore {
  environmental: number
  social: number
  governance: number
  total: number
  sdgAlignment: number[]
  beneficiaries: number
  impactNarrative: string
  highlights: string[]
  risks: string[]
}

export interface Institution {
  id: string
  name: string
  legalName: string
  category: string
  description: string
  mission: string
  logo: string
  needs: NeedItem[]
  esgScore: ESGScore
  municipality: string
  district: string
  peopleReachedPerYear: number
  volunteers: number
  fullTimeStaff: number
  annualBudget: string
  utilidadePublica: boolean
  verified: boolean
}

// ─── Serviço de Relatório de Impacto contratado ───
export interface ImpactContract {
  id: string
  // Campo legado opcional. O relatório já não é desbloqueado por código.
  accessCode?: string
  company: string
  nif: string
  email: string
  contact: string
  activity: string
  institutionId: string
  institutionName: string
  donationType: DonationType
  donationAmount: number   // valor TOTAL do donativo — 100% foi para a instituição
  publicDonationAmountConsent?: boolean
  donationDate: string
  reportTier: ReportTier
  reportPrice: number      // preço base do serviço de relatório de impacto, sem IVA
  reportVat?: number
  reportTotal?: number
  reportPaymentStatus?: 'none' | 'pending' | 'paid'
  selectedNeedIds: string[]
  donationMode: 'necessidade-exata' | 'causa-com-projeto'
  projectCost?: number
  proofFileName?: string
  proofFileDataUrl?: string
  proofFileSize?: number
}

export interface ReportTier {
  id: string
  name: string
  price: number            // preço fixo
  features: string[]
  highlighted: boolean
  color: string
}

export interface GeneratedESGReport {
  reportId: string
  generatedAt: string
  company: string
  companyNif: string
  companyEmail?: string
  institution: string
  institutionCategory: string
  donationDate: string
  donationAmount: number
  reportPrice: number
  reportVat?: number
  reportTotal?: number
  reportTier: string
  donationMode: 'necessidade-exata' | 'causa-com-projeto'
  projectCost?: number
  coveragePercent?: number
  exactMatch: boolean
  fitScore: number
  institutionPhotoUrls?: string[]
  institutionThankYouMessage?: string
  scores: ESGScore
  coverageRatio: number
  impactPerEuro: number
  co2Impact: number
  relevantNeeds: NeedItem[]
  sdgAlignment: number[]
  pillarBreakdown: { E: NeedItem[]; S: NeedItem[]; G: NeedItem[] }
  irsDeduction: number
  ircSavings: number
  disclaimer: string
}

export const VAT_RATE = 0.06

export function calculateVat(baseAmount: number) {
  return Number((Math.max(0, baseAmount) * VAT_RATE).toFixed(2))
}

export function calculateTotalWithVat(baseAmount: number) {
  return Number((Math.max(0, baseAmount) + calculateVat(baseAmount)).toFixed(2))
}

export function formatCurrency(value: number) {
  return `€ ${value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const REPORT_TIERS: ReportTier[] = [
  {
    id: 'standard',
    name: 'Relatório de Impacto Basic',
    price: 150,
    color: 'slate',
    highlighted: false,
    features: [
      'Relatório PDF com 6 páginas (incluindo capa)',
      'Principais necessidades apoiadas',
      'Sumário do impacto gerado',
      'Métricas de impacto do apoio (ODS e ESG)',
    ],
  },
  {
    id: 'premium',
    name: 'Relatório de Impacto Advanced',
    price: 250,
    color: 'blue',
    highlighted: true,
    features: [
      'Relatório PDF com 13 páginas',
      'Tudo do Relatório de Impacto Basic',
      'Impact Score (ISP™, ICS™, IROD™)',
      'Narrativa de impacto personalizada',
      'Galeria e evidências visuais',
    ],
  },
  {
    id: 'social',
    name: 'Relatório de Impacto 360º',
    price: 400,
    color: 'purple',
    highlighted: false,
    features: [
      'Tudo do Relatório de Impacto Advanced',
      'Posts para comunicação nas Redes Sociais',
      'Ficheiro TXT com o copy de cada rede social',
    ],
  },
]
