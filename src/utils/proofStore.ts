import { DonationProof } from '../types'

const PROOFS_KEY = 'leidomecenato_proofs'

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
  return readJson<DonationProof[]>(PROOFS_KEY, [])
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
  const proof: DonationProof = {
    ...input,
    id: `proof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    companyConfirmed: false,
    institutionConfirmed: false,
    status: 'pending-company',
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

function recomputeStatus(proof: DonationProof) {
  if (proof.companyConfirmed && proof.institutionConfirmed) {
    proof.status = 'confirmed'
    proof.confirmedAmount = proof.institutionConfirmedAmount || proof.companyConfirmedAmount || proof.confirmedAmount || proof.amount
    if (!proof.confirmedAt) {
      proof.confirmedAt = new Date().toISOString()
    }
  } else if (proof.companyConfirmed && !proof.institutionConfirmed) {
    proof.status = 'pending-institution'
  } else {
    proof.status = 'pending-company'
  }
}
