import { Institution, NeedItem, DonationProof } from '../types'

export interface ImpactRatingBreakdown {
  scope: number
  directBeneficiaries: number
  indirectBeneficiaries: number
  socialRelevance: number
  sustainability: number
  evidence: number
  total: number
}

export interface DonationImpactRating {
  projectRating: ImpactRatingBreakdown
  requestedContribution: number
  donatedAmount: number
  contributionPercent: number
  donationRating: number
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

function logScore(value: number, base: number, multiplier: number) {
  if (!value || value <= 0) return 0
  return clamp(base + Math.log10(value) * multiplier)
}

function scopeScore(scope?: string) {
  const text = String(scope || '').toLowerCase()
  if (text.includes('internacional') || text.includes('nacional') || text.includes('portugal') || text.includes('pais')) return 100
  if (text.includes('regional')) return 80
  if (text.includes('intermunicipal') || text.includes('distrital') || text.includes('varios concelhos')) return 65
  if (text.includes('municipal') || text.includes('concelho')) return 45
  if (text.includes('local') || text.includes('bairro') || text.includes('freguesia')) return 25
  return 45
}

function directBeneficiaryScore(project: NeedItem, institution: Institution) {
  const direct = project.beneficiaries || institution.peopleReachedPerYear || 0
  return Math.round(logScore(direct, 15, 22))
}

function indirectBeneficiaryScore(project: NeedItem, institution: Institution) {
  const indirect = project.generalImpactMetrics?.indirectBeneficiaries || Math.round((project.beneficiaries || institution.peopleReachedPerYear || 0) * 0.35)
  return Math.round(logScore(indirect, 10, 21))
}

function relevanceScore(project: NeedItem) {
  const populationText = `${project.targetPopulation || ''} ${project.targetPopulationOther || ''}`.toLowerCase()
  const populationScore = populationText ? 24 : 10
  const sdg = Math.min(project.sdgGoals.length * 12, 36)
  const metric = project.impactMetric?.trim() || project.objectives?.trim() ? 16 : 0
  const needText = `${project.category} ${project.subcategory} ${project.description} ${project.rationale || ''} ${populationText}`.toLowerCase()
  const vulnerableBonus = ['crianca', 'jovem', 'idos', 'pobreza', 'deficien', 'vulner', 'saude', 'educa', 'sem abrigo', 'aliment'].some(term => needText.includes(term)) ? 13 : 0
  return clamp(Math.round(populationScore + sdg + metric + vulnerableBonus))
}

function sustainabilityScore(project: NeedItem) {
  const duration = project.generalImpactMetrics?.durationMonths || 0
  const durationScore = duration >= 24 ? 35 : duration >= 12 ? 28 : duration >= 6 ? 20 : duration > 0 ? 12 : 8
  const phaseScore = project.implementationPhase === 'a-decorrer' ? 18 : project.implementationPhase === 'inativo' ? 4 : 12
  const reportingScore = project.generalImpactMetrics?.reportingFrequency ? 20 : 8
  const secured = project.securedFunding && (project.totalProjectCost || project.requestedAmount || project.estimatedValue)
    ? Math.min((project.securedFunding / Math.max(project.totalProjectCost || project.requestedAmount || project.estimatedValue || 1, 1)) * 20, 20)
    : 8
  return clamp(Math.round(durationScore + phaseScore + reportingScore + secured))
}

function evidenceScore(project: NeedItem, institution: Institution) {
  const generalMetrics = Object.keys(project.generalImpactMetrics || {}).length
  const odsMetrics = Object.values(project.odsImpactMetrics || {}).reduce((sum, metrics) => sum + Object.keys(metrics || {}).length, 0)
  const photos = project.projectPhotoUrls?.length || 0
  const institutionVerified = institution.verified ? 18 : 6
  const evidenceMethod = project.generalImpactMetrics?.evidenceMethod ? 24 : 8
  return clamp(Math.round(institutionVerified + evidenceMethod + Math.min(generalMetrics * 6, 18) + Math.min(odsMetrics * 5, 20) + Math.min(photos * 5, 20)))
}

export function calculateProjectImpactRating(institution: Institution, project: NeedItem): ImpactRatingBreakdown {
  const territorialScope = project.territorialScope?.national
    ? 'Nacional'
    : project.territorialScope?.districts?.length
      ? project.territorialScope.municipalities?.length ? 'Municipal' : 'Distrital'
      : project.generalImpactMetrics?.geographicScope
  const scope = scopeScore(territorialScope)
  const directBeneficiaries = directBeneficiaryScore(project, institution)
  const indirectBeneficiaries = indirectBeneficiaryScore(project, institution)
  const socialRelevance = relevanceScore(project)
  const sustainability = sustainabilityScore(project)
  const evidence = evidenceScore(project, institution)
  const total = Math.round(
    scope * 0.20 +
    directBeneficiaries * 0.25 +
    indirectBeneficiaries * 0.15 +
    socialRelevance * 0.20 +
    sustainability * 0.10 +
    evidence * 0.10
  )

  return { scope, directBeneficiaries, indirectBeneficiaries, socialRelevance, sustainability, evidence, total }
}

export function requestedContribution(project: NeedItem, proof?: DonationProof) {
  return proof?.projectCost || project.totalProjectCost || project.requestedAmount || project.estimatedValue || 0
}

export function calculateDonationImpactRating(institution: Institution, project: NeedItem, proof: DonationProof): DonationImpactRating {
  const projectRating = calculateProjectImpactRating(institution, project)
  const requested = requestedContribution(project, proof)
  const donatedAmount = proof.confirmedAmount || proof.amount || 0
  const contributionPercent = requested > 0 ? clamp((donatedAmount / requested) * 100) : 0
  const donationRating = Math.round(projectRating.total * (contributionPercent / 100))

  return {
    projectRating,
    requestedContribution: requested,
    donatedAmount,
    contributionPercent,
    donationRating,
  }
}

export function impactRatingLabel(score: number) {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  if (score >= 30) return 'E'
  return 'F'
}

export function impactRatingMeaning(score: number) {
  const grade = impactRatingLabel(score)
  const meanings: Record<string, string> = {
    A: 'Impacto potencial excelente, com grande alcance, forte relevância social e boa capacidade de demonstrar resultados.',
    B: 'Impacto potencial muito forte, com bons indicadores e uma resposta social bem enquadrada.',
    C: 'Impacto potencial forte, mas com margem para reforçar escala, evidência ou sustentabilidade.',
    D: 'Impacto potencial moderado, normalmente por menor alcance, menor abrangencia ou dados ainda incompletos.',
    E: 'Impacto potencial inicial, dependente de melhor definição de métricas, evidência e continuidade.',
    F: 'Impacto potencial ainda pouco demonstrado, exigindo mais informacao antes de uma avaliacao robusta.',
  }
  return meanings[grade]
}

export function impactRatingColorClass(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-emerald-600'
  if (score >= 60) return 'text-lime-600'
  if (score >= 45) return 'text-yellow-600'
  if (score >= 30) return 'text-orange-500'
  return 'text-rose-500'
}
