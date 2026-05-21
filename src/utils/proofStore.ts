import { DonationProof } from '../types'
import { listProjectInstitutions } from './projectCatalog'

const PROOFS_KEY = 'leidomecenato_proofs'
const ZAPIER_ESG_REPORT_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/27566905/4ykwk2i/'
const DEMO_FILE = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqCjw8L1R5cGUgL1BhZ2VzL0NvdW50IDAvS2lkcyBbXT4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolJUVPRg=='

const DEMO_PROOFS: DonationProof[] = [
  {
    id: 'demo-proof-crescer-confirmed',
    contractId: 'demo-contract-crescer-confirmed',
    companyAccountId: 'demo-company-techglobal',
    companyName: 'TechGlobal Portugal, SA',
    companyNif: '514789321',
    companyEmail: 'mecenato@techglobal.pt',
    institutionAccountId: '1',
    institutionName: 'Associação Crescer Juntos',
    donationType: 'dinheiro',
    selectedNeedIds: ['cj-centro-estudo-familias'],
    amount: 8000,
    projectCost: 56000,
    confirmedAmount: 8000,
    companyConfirmedAmount: 8000,
    institutionConfirmedAmount: 8000,
    date: '2026-05-05',
    description: 'Apoio financeiro para reforço do centro de estudo e acompanhamento familiar.',
    proofFileName: 'comprovativo-transferencia-techglobal.pdf',
    proofFileDataUrl: DEMO_FILE,
    proofFileSize: 248000,
    companyInvoiceFileName: 'documento-interno-techglobal.pdf',
    companyInvoiceFileDataUrl: DEMO_FILE,
    companyInvoiceFileSize: 132000,
    institutionReceiptFileName: 'recibo-donativo-crescer-juntos.pdf',
    institutionReceiptFileDataUrl: DEMO_FILE,
    institutionReceiptFileSize: 156000,
    institutionThankYouMessage: 'Este apoio permite acompanhar mais crianças durante o ano letivo e reforçar a proximidade com as famílias.',
    companyConfirmed: true,
    institutionConfirmed: true,
    status: 'confirmed',
    confirmedAt: '2026-05-07T10:30:00.000Z',
    certificateId: 'CERT-DEMO-001',
    certificateIssuedAt: '2026-05-07T10:30:00.000Z',
    timelineStatus: 'report_available',
  },
  {
    id: 'demo-proof-crescer-pending-institution',
    contractId: 'demo-contract-crescer-pending',
    companyAccountId: 'demo-company-lusitano',
    companyName: 'Grupo Lusitano Energia, SA',
    companyNif: '509120884',
    companyEmail: 'impacto@lusitanoenergia.pt',
    institutionAccountId: '1',
    institutionName: 'Associação Crescer Juntos',
    donationType: 'dinheiro',
    selectedNeedIds: ['cj-centro-estudo-familias'],
    amount: 5000,
    projectCost: 56000,
    confirmedAmount: 5000,
    companyConfirmedAmount: 5000,
    date: '2026-05-15',
    description: 'Donativo submetido pela empresa, a aguardar confirmação da instituição.',
    proofFileName: 'transferencia-lusitano-energia.pdf',
    proofFileDataUrl: DEMO_FILE,
    proofFileSize: 204000,
    companyConfirmed: true,
    institutionConfirmed: false,
    status: 'pending-institution',
    timelineStatus: 'docs_uploaded_by_company',
  },
  {
    id: 'demo-proof-horizonte-pending-company',
    contractId: 'demo-contract-horizonte-pending-company',
    companyAccountId: 'demo-company-medtech',
    companyName: 'MedTech Ibéria, Lda',
    companyNif: '516334221',
    companyEmail: 'parcerias@medtechiberia.pt',
    institutionAccountId: '2',
    institutionName: 'Centro de Reabilitação Horizonte',
    donationType: 'produtos',
    selectedNeedIds: ['horizonte-reabilitacao-neuromotora'],
    amount: 18000,
    projectCost: 118000,
    date: '2026-05-18',
    description: 'Cedência proposta de sensores de equilíbrio e licenças de software clínico, ainda sem documento final da empresa.',
    companyConfirmed: false,
    institutionConfirmed: false,
    status: 'pending-company',
    timelineStatus: 'intent_created',
  },
  {
    id: 'demo-proof-horizonte-confirmed',
    contractId: 'demo-contract-horizonte-confirmed',
    companyAccountId: 'demo-company-saudeprime',
    companyName: 'SaúdePrime Serviços Clínicos, SA',
    companyNif: '510883944',
    companyEmail: 'responsabilidade@saudeprime.pt',
    institutionAccountId: '2',
    institutionName: 'Centro de Reabilitação Horizonte',
    donationType: 'dinheiro',
    selectedNeedIds: ['horizonte-reabilitacao-neuromotora'],
    amount: 12000,
    projectCost: 118000,
    confirmedAmount: 12000,
    companyConfirmedAmount: 12000,
    institutionConfirmedAmount: 12000,
    date: '2026-05-11',
    description: 'Apoio complementar para instalação e formação técnica da unidade de reabilitação.',
    proofFileName: 'comprovativo-saudeprime.pdf',
    proofFileDataUrl: DEMO_FILE,
    proofFileSize: 226000,
    institutionReceiptFileName: 'recibo-horizonte-saudeprime.pdf',
    institutionReceiptFileDataUrl: DEMO_FILE,
    institutionReceiptFileSize: 151000,
    institutionThankYouMessage: 'O apoio acelera a instalação de tecnologia que melhora a autonomia de pessoas em reabilitação.',
    companyConfirmed: true,
    institutionConfirmed: true,
    status: 'confirmed',
    confirmedAt: '2026-05-13T15:00:00.000Z',
    certificateId: 'CERT-DEMO-002',
    certificateIssuedAt: '2026-05-13T15:00:00.000Z',
    timelineStatus: 'report_available',
  },
  {
    id: 'demo-proof-arte-rejected',
    contractId: 'demo-contract-arte-rejected',
    companyAccountId: 'demo-company-cultura-norte',
    companyName: 'Cultura Norte Consultoria, Lda',
    companyNif: '515224781',
    companyEmail: 'geral@culturanorte.pt',
    institutionAccountId: '3',
    institutionName: 'Fundação Arte & Memória Cultura',
    donationType: 'dinheiro',
    selectedNeedIds: ['arte-memoria-arquivo-vivo'],
    amount: 3000,
    projectCost: 48000,
    date: '2026-05-09',
    description: 'Registo rejeitado por divergência entre o valor indicado e o valor recebido.',
    proofFileName: 'comprovativo-cultura-norte.pdf',
    proofFileDataUrl: DEMO_FILE,
    proofFileSize: 188000,
    companyConfirmed: true,
    institutionConfirmed: false,
    status: 'rejected',
    timelineStatus: 'docs_uploaded_by_company',
  },
]

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

export function listProofs(): DonationProof[] {
  const stored = readJson<DonationProof[]>(PROOFS_KEY, [])
  const storedIds = new Set(stored.map(proof => proof.id))
  return [...DEMO_PROOFS.filter(proof => !storedIds.has(proof.id)), ...stored]
}

export function listProofsForCompany(accountId: string): DonationProof[] {
  return listProofs().filter(p => p.companyAccountId === accountId)
}

export function listProofsForInstitution(accountId: string): DonationProof[] {
  return listProofs().filter(p => p.institutionAccountId === accountId)
}

export function getProof(id: string): DonationProof | null {
  return listProofs().find(p => p.id === id) || null
}

export function getProofByContractId(contractId: string): DonationProof | null {
  return listProofs().find(p => p.contractId === contractId) || null
}

export function saveProof(proof: DonationProof) {
  const all = listProofs().filter(p => p.id !== proof.id)
  writeJson(PROOFS_KEY, [...all, proof])
}

export function createProof(input: Omit<DonationProof, 'id' | 'companyConfirmed' | 'institutionConfirmed' | 'status'>): DonationProof {
  const companyConfirmed = Boolean(input.proofFileDataUrl)
  const proof: DonationProof = {
    ...input,
    id: `proof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    companyConfirmed,
    companyConfirmedAmount: companyConfirmed ? input.amount : undefined,
    confirmedAmount: companyConfirmed ? input.amount : input.confirmedAmount,
    institutionConfirmed: false,
    status: companyConfirmed ? 'pending-institution' : 'pending-company',
  }
  saveProof(proof)
  return proof
}

export function setCompanyConfirmation(id: string, confirmed: boolean, invoice?: { name: string; dataUrl: string; size: number }, proofDocId?: string, confirmedAmount?: number) {
  const proof = getProof(id)
  if (!proof) return
  proof.companyConfirmed = confirmed
  if (confirmed && confirmedAmount !== undefined) {
    proof.companyConfirmedAmount = confirmedAmount
    proof.confirmedAmount = confirmedAmount
  }
  if (proofDocId) proof.proofDocId = proofDocId
  if (confirmed && invoice) {
    proof.companyInvoiceFileName = invoice.name
    proof.companyInvoiceFileDataUrl = invoice.dataUrl
    proof.companyInvoiceFileSize = invoice.size
  }
  recomputeStatus(proof)
  saveProof(proof)
}

export function setInstitutionConfirmation(id: string, confirmed: boolean, thankYouMessage?: string, receipt?: { name: string; dataUrl: string; size: number }, confirmedAmount?: number) {
  const proof = getProof(id)
  if (!proof) return
  if (confirmed) {
    proof.institutionThankYouMessage = (thankYouMessage || '').trim()
    if (confirmedAmount !== undefined) {
      proof.institutionConfirmedAmount = confirmedAmount
      proof.confirmedAmount = confirmedAmount
    }
    if (receipt) {
      proof.institutionReceiptFileName = receipt.name
      proof.institutionReceiptFileDataUrl = receipt.dataUrl
      proof.institutionReceiptFileSize = receipt.size
    }
  }
  proof.institutionConfirmed = confirmed
  recomputeStatus(proof)
  saveProof(proof)
}

export function rejectProof(id: string) {
  const proof = getProof(id)
  if (!proof) return
  proof.status = 'rejected'
  saveProof(proof)
}

function selectedProjectsForProof(proof: DonationProof) {
  const selectedNeedIds = new Set(proof.selectedNeedIds || [])
  const institutionName = proof.institutionName.trim().toLowerCase()

  return listProjectInstitutions()
    .filter(institution =>
      institution.id === proof.institutionAccountId ||
      institution.name.trim().toLowerCase() === institutionName ||
      institution.legalName.trim().toLowerCase() === institutionName
    )
    .flatMap(institution =>
      institution.needs
        .filter(project => selectedNeedIds.size === 0 || selectedNeedIds.has(project.id))
        .map(project => ({
          institution: {
            id: institution.id,
            name: institution.name,
            legalName: institution.legalName,
            category: institution.category,
            description: institution.description,
            mission: institution.mission,
            municipality: institution.municipality,
            district: institution.district,
            peopleReachedPerYear: institution.peopleReachedPerYear,
            volunteers: institution.volunteers,
            fullTimeStaff: institution.fullTimeStaff,
            annualBudget: institution.annualBudget,
            utilidadePublica: institution.utilidadePublica,
            verified: institution.verified,
          },
          project,
        }))
    )
}

function sendZapierReportWebhook(proof: DonationProof) {
  fetch(ZAPIER_ESG_REPORT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'donation_confirmed_for_esg_report',
      proof,
      projects: selectedProjectsForProof(proof),
    }),
  }).catch(err => console.log('Webhook enviado'))
}

function recomputeStatus(proof: DonationProof) {
  if (proof.companyConfirmed && proof.institutionConfirmed) {
    proof.status = 'confirmed'
    proof.confirmedAmount = proof.institutionConfirmedAmount || proof.companyConfirmedAmount || proof.confirmedAmount || proof.amount
    if (!proof.confirmedAt) {
      proof.confirmedAt = new Date().toISOString()
    }
    // Disparar webhook para Zapier gerar relatório ESG
    if (proof.status === 'confirmed') {
      sendZapierReportWebhook(proof)
    }
  } else if (proof.companyConfirmed && !proof.institutionConfirmed) {
    proof.status = 'pending-institution'
  } else {
    proof.status = 'pending-company'
  }
}
