import { Institution, NeedItem, ImpactContract, GeneratedESGReport } from '../types'
import { findInstitutionRegistration } from './institutionRegistry'

export const sdgInfo: Record<number, { name: string; color: string; icon: string }> = {
  1:  { name: 'Erradicação da Pobreza',       color: '#E5243B', icon: '🏚️' },
  2:  { name: 'Fome Zero',                     color: '#DDA63A', icon: '🌾' },
  3:  { name: 'Saúde de Qualidade',            color: '#4C9F38', icon: '💚' },
  4:  { name: 'Educação de Qualidade',         color: '#C5192D', icon: '📚' },
  5:  { name: 'Igualdade de Género',           color: '#FF3A21', icon: '⚧️' },
  8:  { name: 'Trabalho Digno',                color: '#A21942', icon: '💼' },
  10: { name: 'Redução das Desigualdades',     color: '#DD1367', icon: '⚖️' },
  11: { name: 'Cidades Sustentáveis',          color: '#FD9D24', icon: '🏙️' },
  13: { name: 'Ação Climática',                color: '#3F7E44', icon: '🌡️' },
  14: { name: 'Vida Abaixo d\'Água',           color: '#0A97D9', icon: '🌊' },
  15: { name: 'Vida Terrestre',                color: '#56C02B', icon: '🌿' },
  17: { name: 'Parcerias para os Objetivos',   color: '#19486A', icon: '🤝' },
}

export const esgPillarInfo = {
  E: { label: 'Ambiental',   color: '#16a34a', bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  S: { label: 'Social',      color: '#2563eb', bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  G: { label: 'Governação',  color: '#7c3aed', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
}

function scorePillar(needs: NeedItem[], pillar: 'E' | 'S' | 'G'): number {
  const pillarNeeds = needs.filter(n => n.esgPillar === pillar)
  if (pillarNeeds.length === 0) return 40

  const urgencyWeight = { alta: 1.0, media: 0.7, baixa: 0.4 }
  let raw = 0
  pillarNeeds.forEach(n => {
    const urgency = urgencyWeight[n.urgency]
    const sdgBonus = Math.min(n.sdgGoals.length * 5, 15)
    const beneficiaryBonus = n.beneficiaries ? Math.min(Math.log10(n.beneficiaries) * 8, 20) : 0
    raw += 50 + urgency * 20 + sdgBonus + beneficiaryBonus
  })
  return Math.min(Math.round(raw / pillarNeeds.length), 100)
}

function projectValueScore(needs: NeedItem[], projectCost?: number): number {
  const declaredCost = projectCost || needs.reduce((acc, n) => acc + (n.totalProjectCost || n.estimatedValue || n.requestedAmount || 0), 0)
  if (!declaredCost) return 45
  return Math.min(100, 35 + Math.log10(declaredCost) * 13)
}

function kpiImpactScore(needs: NeedItem[]): number {
  if (needs.length === 0) return 45
  const totalBeneficiaries = needs.reduce((acc, n) => acc + (n.beneficiaries || 0), 0)
  const metricDepth = needs.reduce((acc, n) =>
    acc
    + Object.keys(n.generalImpactMetrics || {}).length
    + Object.values(n.odsImpactMetrics || {}).reduce((sum, metrics) => sum + Object.keys(metrics || {}).length, 0)
  , 0)
  const beneficiaryScore = totalBeneficiaries ? Math.min(55, Math.log10(totalBeneficiaries) * 14) : 10
  const metricScore = Math.min(35, metricDepth * 7)
  const odsScore = Math.min(10, new Set(needs.flatMap(n => n.sdgGoals)).size * 2)
  return Math.round(Math.min(100, beneficiaryScore + metricScore + odsScore))
}

function securedFundingScore(needs: NeedItem[], projectCost?: number): number {
  const totalCost = projectCost || needs.reduce((acc, n) => acc + (n.totalProjectCost || n.estimatedValue || n.requestedAmount || 0), 0)
  if (!totalCost) return 40
  const secured = needs.reduce((acc, n) => acc + (n.securedFunding || 0), 0)
  return Math.min(100, Math.round((secured / totalCost) * 100))
}

function geographicScopeScore(needs: NeedItem[], institution: Institution): number {
  const text = needs
    .map(n => String(n.generalImpactMetrics?.geographicScope || '').toLowerCase())
    .filter(Boolean)
    .join(' ')

  if (text.includes('nacional') || text.includes('portugal') || text.includes('país') || text.includes('pais')) return 100
  if (text.includes('regional') || text.includes('intermunicipal') || text.includes('vários concelhos') || text.includes('varios concelhos')) return 82
  if (text.includes('distrital') || (!!institution.district && text.includes(institution.district.toLowerCase()))) return 70
  if (text.includes('concelho') || text.includes('municipal') || (!!institution.municipality && text.includes(institution.municipality.toLowerCase()))) return 58
  if (text.includes('local') || text.includes('bairro') || text.includes('freguesia')) return 45
  return institution.district ? 55 : 45
}

export function generateESGReport(
  institution: Institution,
  contract: ImpactContract
): GeneratedESGReport {
  const registration = findInstitutionRegistration(institution.name) || findInstitutionRegistration(institution.legalName)
  const relevantNeeds = contract.selectedNeedIds.length > 0
    ? institution.needs.filter(n => contract.selectedNeedIds.includes(n.id))
    : institution.needs

  const selectedNeedValues = relevantNeeds.reduce((acc, n) => acc + (n.estimatedValue || 0), 0)
  const exactMatch = contract.donationType === 'produtos'
    ? relevantNeeds.length === 1 && !!relevantNeeds[0]?.estimatedValue && Math.abs(contract.donationAmount - (relevantNeeds[0].estimatedValue || 0)) <= Math.max((relevantNeeds[0].estimatedValue || 0) * 0.05, 1)
    : false

  const projectCost = contract.donationMode === 'causa-com-projeto'
    ? contract.projectCost ?? selectedNeedValues
    : undefined

  const coveragePercent = projectCost && projectCost > 0
    ? Math.min((contract.donationAmount / projectCost) * 100, 100)
    : undefined

  const coverageFitScore = contract.donationType === 'produtos'
    ? (exactMatch ? 100 : Math.min(Math.round((selectedNeedValues / Math.max(contract.donationAmount, 1)) * 100), 100))
    : (coveragePercent ? Math.min(Math.round(coveragePercent), 100) : 50)
  const valueScore = projectValueScore(relevantNeeds, projectCost)
  const kpiScore = kpiImpactScore(relevantNeeds)
  const securedScore = securedFundingScore(relevantNeeds, projectCost)
  const scopeScore = geographicScopeScore(relevantNeeds, institution)
  const fitScore = Math.round(coverageFitScore * 0.35 + valueScore * 0.18 + kpiScore * 0.22 + securedScore * 0.13 + scopeScore * 0.12)

  const eScore = scorePillar(relevantNeeds, 'E')
  const sScore = scorePillar(relevantNeeds, 'S')
  const gScore = scorePillar(relevantNeeds, 'G')
  const esgBaseScore = eScore * 0.25 + sScore * 0.32 + gScore * 0.13
  const totalScore = Math.round(esgBaseScore + fitScore * 0.30)

  const allSDGs = [...new Set(relevantNeeds.flatMap(n => n.sdgGoals))]
  const totalBeneficiaries = relevantNeeds.reduce((acc, n) => acc + (n.beneficiaries || 0), 0)
  const totalValue = relevantNeeds.reduce((acc, n) => acc + (n.estimatedValue || 0), 0)
  const coverageRatio = totalValue > 0 ? Math.min((contract.donationAmount / totalValue) * 100, 100) : 0
  const impactPerEuro = totalBeneficiaries > 0 ? totalBeneficiaries / contract.donationAmount : 0

  const eNeeds = relevantNeeds.filter(n => n.esgPillar === 'E')
  const co2Impact = eNeeds.length > 0 ? Math.round(contract.donationAmount * 0.012) : 0

  const simplerReport = contract.donationType === 'produtos' && exactMatch

  let rating: string
  let ratingColor: string
  if (totalScore >= 85) { rating = 'AA+'; ratingColor = '#16a34a' }
  else if (totalScore >= 75) { rating = 'AA';  ratingColor = '#22c55e' }
  else if (totalScore >= 65) { rating = 'A+';  ratingColor = '#84cc16' }
  else if (totalScore >= 55) { rating = 'A';   ratingColor = '#eab308' }
  else if (totalScore >= 45) { rating = 'B+';  ratingColor = '#f97316' }
  else                       { rating = 'B';   ratingColor = '#f43f5e' }

  const generatedAt = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return {
    reportId: `IMP-${Date.now()}`,
    generatedAt,
    company: contract.company,
    companyNif: contract.nif,
    institution: contract.institutionName,
    institutionCategory: institution.category,
    donationDate: contract.donationDate,
    donationAmount: contract.donationAmount,
    reportPrice: contract.reportPrice,
    reportTier: contract.reportTier.name,
    donationMode: contract.donationMode,
    projectCost,
    coveragePercent,
    exactMatch,
    fitScore,
    institutionPhotoUrls: (registration?.photoUrls || []).filter(Boolean),
    institutionThankYouMessage: undefined,
    scores: {
      environmental: eScore,
      social: sScore,
      governance: gScore,
      total: totalScore,
      sdgAlignment: allSDGs,
      beneficiaries: totalBeneficiaries,
      impactNarrative: contract.donationMode === 'causa-com-projeto' && projectCost
        ? `O donativo de €${contract.donationAmount.toLocaleString('pt-PT')} foi aplicado numa causa/projeto com custo total de €${projectCost.toLocaleString('pt-PT')}. A cobertura estimada do projeto é de ${coveragePercent?.toFixed(1)}% e contribuiu diretamente para o Rating de Impacto, com impacto direto em ${totalBeneficiaries.toLocaleString()} beneficiários.`
        : exactMatch
          ? `O donativo em géneros/serviços de €${contract.donationAmount.toLocaleString('pt-PT')} corresponde exatamente a uma necessidade da instituição, simplificando a modelação do impacto e apoiando ${totalBeneficiaries.toLocaleString()} beneficiários.`
          : `O donativo de €${contract.donationAmount.toLocaleString('pt-PT')} — 100% entregue diretamente a ${institution.name} — apoiou ${relevantNeeds.length} necessidade(s) com impacto direto em ${totalBeneficiaries.toLocaleString()} beneficiários.`,
      highlights: institution.esgScore.highlights,
      risks: institution.esgScore.risks,
    },
    rating,
    ratingColor,
    coverageRatio: Math.round(coverageRatio),
    impactPerEuro: parseFloat(impactPerEuro.toFixed(3)),
    co2Impact,
    relevantNeeds,
    sdgAlignment: allSDGs,
    pillarBreakdown: {
      E: relevantNeeds.filter(n => n.esgPillar === 'E'),
      S: relevantNeeds.filter(n => n.esgPillar === 'S'),
      G: relevantNeeds.filter(n => n.esgPillar === 'G'),
    },
    irsDeduction: contract.donationAmount * 1.4,
    ircSavings: Math.round(contract.donationAmount * 1.4 * 0.21 * 100) / 100,
    disclaimer: `${simplerReport ? 'O donativo em géneros corresponde exatamente a uma necessidade da instituição, o que simplifica a modelação de impacto.' : 'O relatório foi calculado com base na relação entre o donativo e o projeto/necessidade selecionada.'} A plataforma Lei do Mecenato é uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.`,
  }
}
