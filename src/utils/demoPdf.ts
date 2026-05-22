import { GeneratedESGReport } from '../types'
import { reportTemplates } from '../templates/reportTemplates'
import { downloadReportPdf } from './pdfReport'
import { getDemoPhotos } from './demoPhotos'

export function downloadDemoPdf() {
  const photos = getDemoPhotos()

  const demoReport: GeneratedESGReport = {
    reportId: 'IMP-DEMO-2025',
    generatedAt: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }),
    company: 'TechGlobal Portugal, SA',
    companyNif: '514 789 321',
    institution: 'Associação Crescer Juntos',
    institutionCategory: 'Infância e Juventude',
    donationDate: '15/01/2025',
    donationAmount: 10000,
    reportPrice: 750,
    reportTier: 'Relatório de Impacto Premium',
    donationMode: 'causa-com-projeto',
    projectCost: 25000,
    coveragePercent: 40,
    exactMatch: false,
    fitScore: 40,
    institutionPhotoUrls: photos,
    scores: {
      environmental: 52,
      social: 91,
      governance: 78,
      total: 78,
      sdgAlignment: [2, 3, 4, 10],
      beneficiaries: 1200,
      impactNarrative:
        'O donativo de €10.000 — 100% entregue diretamente à Associação Crescer Juntos — foi aplicado num projeto com custo total de €25.000 (cobertura de 40%). Com impacto direto em 1.200 beneficiários, este donativo contribuiu para a redução da pobreza alimentar infantil e para o acesso a material escolar de 200 crianças no concelho de Setúbal.',
      highlights: [
        'Cobertura de 1.200 crianças/ano',
        '85 voluntários ativos',
        'Estatuto de Utilidade Pública',
        'Taxa de retenção escolar 25% acima da média local',
      ],
      risks: [
        'Dependência de financiamento público (60% do orçamento)',
        'Alta rotatividade de voluntários no período de verão',
      ],
    },
    coverageRatio: 40,
    impactPerEuro: 0.12,
    co2Impact: 0,
    relevantNeeds: [
      {
        id: 'n1-1',
        category: 'Educação',
        subcategory: 'Material Escolar',
        description: 'Mochilas, cadernos, material de escrita e livros para 200 crianças do 1.º ao 6.º ano',
        urgency: 'alta',
        sdgGoals: [4],
        esgPillar: 'S',
        impactMetric: '200 crianças com acesso garantido a material escolar durante 1 ano letivo',
        estimatedValue: 8000,
        beneficiaries: 200,
        quantity: '200 kits',
      },
      {
        id: 'n1-2',
        category: 'Alimentação',
        subcategory: 'Refeições',
        description: 'Financiamento de refeições diárias para crianças em situação de pobreza alimentar severa',
        urgency: 'alta',
        sdgGoals: [2, 3],
        esgPillar: 'S',
        impactMetric: 'Redução de 100% da pobreza alimentar nas crianças apoiadas',
        estimatedValue: 24000,
        beneficiaries: 80,
      },
      {
        id: 'n1-4',
        category: 'Saúde',
        subcategory: 'Saúde Mental',
        description: 'Sessões de psicologia para crianças e famílias em crise',
        urgency: 'alta',
        sdgGoals: [3, 10],
        esgPillar: 'S',
        impactMetric: '60 famílias com acompanhamento psicológico estruturado',
        estimatedValue: 18000,
        beneficiaries: 180,
      },
    ],
    sdgAlignment: [2, 3, 4, 10],
    pillarBreakdown: {
      E: [],
      S: [
        {
          id: 'n1-1',
          category: 'Educação',
          subcategory: 'Material Escolar',
          description: 'Mochilas, cadernos e livros para 200 crianças',
          urgency: 'alta',
          sdgGoals: [4],
          esgPillar: 'S',
          impactMetric: '200 crianças com material escolar durante 1 ano',
          estimatedValue: 8000,
          beneficiaries: 200,
          quantity: '200 kits',
        },
        {
          id: 'n1-2',
          category: 'Alimentação',
          subcategory: 'Refeições',
          description: 'Refeições diárias para crianças em pobreza alimentar',
          urgency: 'alta',
          sdgGoals: [2, 3],
          esgPillar: 'S',
          impactMetric: 'Eliminação da pobreza alimentar nas crianças apoiadas',
          estimatedValue: 24000,
          beneficiaries: 80,
        },
        {
          id: 'n1-4',
          category: 'Saúde',
          subcategory: 'Saúde Mental',
          description: 'Sessões de psicologia para crianças e famílias em crise',
          urgency: 'alta',
          sdgGoals: [3, 10],
          esgPillar: 'S',
          impactMetric: '60 famílias com acompanhamento psicológico',
          estimatedValue: 18000,
          beneficiaries: 180,
        },
      ],
      G: [],
    },
    irsDeduction: 14000,
    ircSavings: 2940,
    disclaimer:
      'O relatório foi calculado com base na relação entre o donativo e o projeto/necessidade selecionada. A plataforma Lei do Mecenato é uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.',
  }

  const template = reportTemplates.find(t => t.id === 'editorial') || reportTemplates[0]
  downloadReportPdf(demoReport, template)
}
