import { DonationProof, NeedItem } from '../types'

export function projectTarget(need: NeedItem): number {
  return need.requestedAmount || need.estimatedValue || need.totalProjectCost || 0
}

export function confirmedDonationTotal(need: NeedItem, proofs: DonationProof[] = [], institutionName?: string): number {
  return proofs
    .filter(proof => proof.status === 'confirmed')
    .filter(proof => !institutionName || proof.institutionName.trim().toLowerCase() === institutionName.trim().toLowerCase())
    .filter(proof => proof.selectedNeedIds?.includes(need.id))
    .reduce((sum, proof) => sum + (proof.confirmedAmount || proof.amount || 0), 0)
}

export function hasConfirmedProductDonation(need: NeedItem, proofs: DonationProof[] = [], institutionName?: string): boolean {
  return proofs
    .filter(proof => proof.status === 'confirmed')
    .filter(proof => proof.donationType === 'produtos')
    .filter(proof => !institutionName || proof.institutionName.trim().toLowerCase() === institutionName.trim().toLowerCase())
    .some(proof => proof.selectedNeedIds?.includes(need.id))
}

export function projectSecured(need: NeedItem, proofs: DonationProof[] = [], institutionName?: string): number {
  return Math.max(0, (need.securedFunding || 0) + confirmedDonationTotal(need, proofs, institutionName))
}

export function projectProgress(need: NeedItem, proofs: DonationProof[] = [], institutionName?: string): number {
  if (need.supportType === 'produtos' && hasConfirmedProductDonation(need, proofs, institutionName)) return 100
  const target = projectTarget(need)
  if (!target) return 0
  return Math.min(100, Math.round((projectSecured(need, proofs, institutionName) / target) * 100))
}

export function isProjectComplete(need: NeedItem, proofs: DonationProof[] = [], institutionName?: string): boolean {
  return need.status === 'concluido' || hasConfirmedProductDonation(need, proofs, institutionName) || projectProgress(need, proofs, institutionName) >= 100
}

export function activeProjects(needs: NeedItem[], proofs: DonationProof[] = [], institutionName?: string): NeedItem[] {
  return needs.filter(need => need.status !== 'inativo' && need.implementationPhase !== 'inativo' && !isProjectComplete(need, proofs, institutionName))
}

export function completedProjects(needs: NeedItem[], proofs: DonationProof[] = [], institutionName?: string): NeedItem[] {
  return needs.filter(need => isProjectComplete(need, proofs, institutionName))
}

export function supportTypeLabel(need: NeedItem): string {
  return need.supportType === 'produtos' ? 'Produto/serviço' : 'Verba'
}
