import { GeneratedESGReport } from '../types'
import { ReportTemplate } from '../templates/reportTemplates'
import { sampleInstitutions } from '../data/institutions'
import { getDemoPhotos } from './demoPhotos'
import { downloadSustainabilityReport } from './sustainabilityPdf'

// Constrói o objeto GeneratedESGReport para uma instituição (sem fazer download)
export function buildDemoReportForInstitution(templateName: string, institutionIndex: number): GeneratedESGReport {
  const idx = institutionIndex % sampleInstitutions.length
  const inst = sampleInstitutions[idx]
  const photos = getDemoPhotos()

  const totalBeneficiaries = inst.needs.reduce((acc, n) => acc + (n.beneficiaries || 0), 0)
  const totalValue = inst.needs.reduce((acc, n) => acc + (n.estimatedValue || 0), 0)
  const donationAmount = Math.min(totalValue, 15000)
  const coveragePercent = totalValue > 0 ? (donationAmount / totalValue) * 100 : 0

  const report: GeneratedESGReport = {
    reportId: `DEMO-${templateName.toUpperCase().replace(/\s+/g, '-')}-${inst.id}`,
    generatedAt: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }),
    company: 'TechGlobal Portugal, SA',
    companyNif: '514 789 321',
    institution: inst.name,
    institutionCategory: inst.category,
    donationDate: new Date().toLocaleDateString('pt-PT'),
    donationAmount,
    reportPrice: 250,
    reportTier: `Relatório de Impacto Advanced — Template "${templateName}"`,
    donationMode: 'causa-com-projeto',
    projectCost: totalValue,
    coveragePercent: Math.round(coveragePercent * 10) / 10,
    exactMatch: false,
    fitScore: Math.round(coveragePercent),
    institutionPhotoUrls: photos,
    scores: {
      environmental: inst.esgScore.environmental,
      social: inst.esgScore.social,
      governance: inst.esgScore.governance,
      total: inst.esgScore.total,
      sdgAlignment: inst.esgScore.sdgAlignment,
      beneficiaries: totalBeneficiaries,
      impactNarrative: `O donativo de €${donationAmount.toLocaleString('pt-PT')} — 100% entregue diretamente a ${inst.name} — foi aplicado num projeto com custo total de €${totalValue.toLocaleString('pt-PT')} (cobertura de ${coveragePercent.toFixed(1)}%). Com impacto direto em ${totalBeneficiaries.toLocaleString()} beneficiários. ${inst.mission}`,
      highlights: inst.esgScore.highlights,
      risks: inst.esgScore.risks,
    },
    coverageRatio: Math.round(coveragePercent),
    impactPerEuro: parseFloat((totalBeneficiaries / Math.max(donationAmount, 1)).toFixed(3)),
    co2Impact: inst.esgScore.sdgAlignment.includes(13) || inst.esgScore.sdgAlignment.includes(15) ? Math.round(donationAmount * 0.012) : 0,
    relevantNeeds: inst.needs,
    sdgAlignment: inst.esgScore.sdgAlignment,
    pillarBreakdown: {
      E: inst.needs.filter(n => n.esgPillar === 'E'),
      S: inst.needs.filter(n => n.esgPillar === 'S'),
      G: inst.needs.filter(n => n.esgPillar === 'G'),
    },
    irsDeduction: donationAmount * 1.4,
    ircSavings: Math.round(donationAmount * 1.4 * 0.21 * 100) / 100,
    disclaimer: `Este relatório de exemplo foi gerado com o template "${templateName}" pela plataforma Lei do Mecenato — uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Os dados apresentados são simulados para demonstração do template.`,
  }

  return report
}

export function downloadAdminDemoReport(templateName: string, institutionIndex?: number, template?: ReportTemplate) {
  const idx = institutionIndex ?? Math.floor(Math.random() * sampleInstitutions.length)
  const report = buildDemoReportForInstitution(templateName, idx)
  downloadSustainabilityReport(report, template)
}
