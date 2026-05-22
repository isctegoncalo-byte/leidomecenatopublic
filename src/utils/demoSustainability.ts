import { GeneratedESGReport, NeedItem } from '../types'
import { downloadSustainabilityReport } from './sustainabilityPdf'
import { getDemoPhotos } from './demoPhotos'

const sharedNeed: NeedItem = {
  id: 'n-edu-1',
  category: 'Educação',
  subcategory: 'Material Escolar',
  description: 'Mochilas, cadernos, material de escrita e livros para 200 crianças do 1.º ao 6.º ano.',
  urgency: 'alta',
  sdgGoals: [4, 10],
  esgPillar: 'S',
  impactMetric: '200 crianças com acesso garantido a material escolar durante 1 ano letivo.',
  estimatedValue: 8000,
  beneficiaries: 200,
  quantity: '200 kits',
}

const sharedNeed2: NeedItem = {
  id: 'n-saude-1',
  category: 'Saúde',
  subcategory: 'Saúde Mental',
  description: 'Sessões de psicologia para crianças e famílias em crise.',
  urgency: 'alta',
  sdgGoals: [3, 10],
  esgPillar: 'S',
  impactMetric: '60 famílias com acompanhamento psicológico estruturado.',
  estimatedValue: 18000,
  beneficiaries: 180,
}

const sharedNeed3: NeedItem = {
  id: 'n-amb-1',
  category: 'Ambiente',
  subcategory: 'Reflorestação',
  description: 'Plantação de 50.000 árvores autóctones com sistema de monitorização.',
  urgency: 'media',
  sdgGoals: [13, 15],
  esgPillar: 'E',
  impactMetric: 'Captura estimada de 500 toneladas de CO₂/ano.',
  estimatedValue: 75000,
  beneficiaries: 8000,
  quantity: '50.000 árvores',
}

export type DemoSdgVariant = 'educacao' | 'ambiente' | 'saude'

export function downloadSustainabilityDemo(variant: DemoSdgVariant = 'educacao') {
  const photos = getDemoPhotos()

  let primarySdg = 4
  let needs: NeedItem[] = [sharedNeed, sharedNeed2]
  let institution = 'Associação Crescer Juntos'
  let category = 'Infância e Juventude'
  let narrative =
    'O donativo de €10.000 foi aplicado num projeto educativo com custo total de €25.000 (cobertura de 40%). Permitiu disponibilizar material escolar a 200 crianças e financiar acompanhamento psicológico a 60 famílias em situação vulnerável no concelho de Setúbal.'

  if (variant === 'ambiente') {
    primarySdg = 13
    needs = [sharedNeed3]
    institution = 'Associação Raiz Verde'
    category = 'Ambiente'
    narrative =
      'O donativo de €10.000 foi aplicado num projeto de reflorestação no Alentejo. Cobriu 13% do custo total do projeto (€75.000) e contribuiu para a plantação de árvores autóctones e a monitorização de biodiversidade.'
  } else if (variant === 'saude') {
    primarySdg = 3
    needs = [sharedNeed2, sharedNeed]
    institution = 'Centro de Reabilitação Horizonte'
    category = 'Saúde'
    narrative =
      'O donativo de €10.000 foi aplicado no programa de saúde mental do Centro de Reabilitação Horizonte. Cobriu 40% do custo total do projeto e impactou diretamente 180 pessoas em acompanhamento psicológico.'
  }

  const allSdgs = [...new Set(needs.flatMap(n => n.sdgGoals).filter(s => s !== primarySdg))]
  const sdgAlignment = [primarySdg, ...allSdgs]

  const beneficiaries = needs.reduce((acc, n) => acc + (n.beneficiaries || 0), 0)
  const totalValue = needs.reduce((acc, n) => acc + (n.estimatedValue || 0), 0)
  const projectCost = totalValue
  const coveragePercent = projectCost > 0 ? (10000 / projectCost) * 100 : 0

  const demoReport: GeneratedESGReport = {
    reportId: `IMP-DEMO-${variant.toUpperCase()}`,
    generatedAt: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }),
    company: 'TechGlobal Portugal, SA',
    companyNif: '514 789 321',
    institution,
    institutionCategory: category,
    donationDate: new Date().toLocaleDateString('pt-PT'),
    donationAmount: 10000,
    reportPrice: 750,
    reportTier: 'Relatório de Impacto Premium',
    donationMode: 'causa-com-projeto',
    projectCost,
    coveragePercent,
    exactMatch: false,
    fitScore: Math.round(coveragePercent),
    institutionPhotoUrls: photos,
    scores: {
      environmental: variant === 'ambiente' ? 92 : 52,
      social: variant === 'ambiente' ? 60 : 91,
      governance: 78,
      total: variant === 'ambiente' ? 78 : 78,
      sdgAlignment,
      beneficiaries,
      impactNarrative: narrative,
      highlights: [
        'Cobertura ampla do projeto identificado',
        'Forte alinhamento com os ODS prioritários',
        'Beneficiários verificados pela instituição',
      ],
      risks: [
        'Dependência de outros donativos para cobertura total',
        'Necessidade de monitorização de longo prazo',
      ],
    },
    coverageRatio: Math.round(coveragePercent),
    impactPerEuro: parseFloat((beneficiaries / 10000).toFixed(3)),
    co2Impact: variant === 'ambiente' ? 500 : 0,
    relevantNeeds: needs,
    sdgAlignment,
    pillarBreakdown: {
      E: needs.filter(n => n.esgPillar === 'E'),
      S: needs.filter(n => n.esgPillar === 'S'),
      G: needs.filter(n => n.esgPillar === 'G'),
    },
    irsDeduction: 14000,
    ircSavings: 2940,
    disclaimer:
      'Este relatório de impacto foi gerado pela plataforma Lei do Mecenato — uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.',
  }

  downloadSustainabilityReport(demoReport)
}
