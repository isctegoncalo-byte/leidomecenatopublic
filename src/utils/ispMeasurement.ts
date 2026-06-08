import { DonationProof, Institution, NeedItem } from '../types'
import { SDG_DATA } from '../data/sdgs'

export type IspDimensionKey =
  | 'impactGenerated'
  | 'esgContribution'
  | 'efficiency'
  | 'evidenceQuality'
  | 'sustainability'

export type ConfidenceKey =
  | 'dataCompleteness'
  | 'dataFreshness'
  | 'evidenceExistence'
  | 'independentValidation'
  | 'kpiCoverage'
  | 'auditability'

export interface IspSdgContribution {
  sdgNumber: number
  sdgName: string
  contributionLevel: 'Baixo' | 'Medio' | 'Elevado' | 'Transformacional'
  evidence: string
}

export interface IspBeneficiaryProfile {
  direct: number
  indirect: number
  ageGroup: string
  gender: string
  location: string
  vulnerabilityCategory: string
}

export interface SroiInputs {
  valuePerDirectBeneficiary: number
  valuePerIndirectBeneficiary: number
  proxyId?: string
  proxyLabel?: string
  proxyCategory?: string
  proxySource?: string
  proxyRationale?: string
  proxyConfidence?: number
  proxyMatchedKeywords?: string[]
  proxyMatchedSdgs?: number[]
  attributionPercent: number
  deadweightPercent: number
  displacementPercent: number
  durationYears: number
  dropoffPercent: number
  notes: string
}

export interface IspMeasurement {
  proofId: string
  updatedAt: string
  dimensions: Record<IspDimensionKey, number>
  confidenceFactors: Record<ConfidenceKey, number>
  sdgs: IspSdgContribution[]
  beneficiaries: IspBeneficiaryProfile
  sroi: SroiInputs
  notes: string
}

export interface IspDonationItem {
  proof: DonationProof
  institution?: Institution
  project?: NeedItem
  companyName: string
}

export interface DonationImpactContext {
  donationAmount: number
  projectCost: number
  coveragePercent: number
  coveredDirectBeneficiaries: number
  costPerDirectBeneficiary: number
  impactPerEuro: number
}

export interface IrodResult {
  score: number
  qualityReturn: number
  confidenceReturn: number
  coverageReturn: number
  beneficiaryReturn: number
  leverageReturn: number
  leverageMultiplier: number
}

export interface IcsResult {
  score: number
  evidenceStrength: number
  dataIntegrity: number
  kpiTraceability: number
  sdgAlignment: number
  beneficiaryClarity: number
  validationReadiness: number
}

export interface ImpactScoreResult {
  score: number
  isp: number
  irod: number
  ics: number
}

export interface SroiResult {
  grossSocialValue: number
  adjustedSocialValue: number
  donationAmount: number
  ratio: number
  netSocialValue: number
  paybackPercent: number
}

export interface SroiProxy {
  id: string
  label: string
  category: string
  directValue: number
  indirectValue: number
  sdgs: number[]
  keywords: string[]
  source: string
  rationale: string
}

export interface SroiProxyRecommendation {
  proxy: SroiProxy
  score: number
  confidence: number
  matchedKeywords: string[]
  matchedSdgs: number[]
  reasons: string[]
}

const STORAGE_KEY = 'leidomecenato_isp_measurements'

export const SROI_PROXY_LIBRARY: SroiProxy[] = [
  {
    id: 'education-school-support',
    label: 'Apoio educativo e sucesso escolar',
    category: 'Educacao',
    directValue: 180,
    indirectValue: 45,
    sdgs: [4, 10],
    keywords: ['educacao', 'escolar', 'estudo', 'explicacoes', 'literacia', 'aprendizagem', 'alunos', 'criancas'],
    source: 'Proxy interna baseada em custo equivalente de apoio educativo complementar.',
    rationale: 'Usada quando o outcome principal e melhoria de aprendizagem, acompanhamento escolar ou reducao de desigualdades educativas.',
  },
  {
    id: 'education-digital-inclusion',
    label: 'Inclusao digital e competencias digitais',
    category: 'Educacao',
    directValue: 220,
    indirectValue: 55,
    sdgs: [4, 8, 9, 10],
    keywords: ['digital', 'computador', 'tecnologia', 'competencias digitais', 'laboratorio', 'equipamento informatico'],
    source: 'Proxy interna baseada em custo equivalente de formacao digital e acesso a equipamento.',
    rationale: 'Adequada a projetos que aumentam acesso digital, qualificacao tecnologica ou literacia digital.',
  },
  {
    id: 'health-primary-care',
    label: 'Cuidados de saude e prevencao',
    category: 'Saude',
    directValue: 260,
    indirectValue: 65,
    sdgs: [3, 10],
    keywords: ['saude', 'clinica', 'consulta', 'prevencao', 'rastreio', 'tratamento', 'terapia'],
    source: 'Proxy interna baseada em custo evitado/custo equivalente de cuidados e acompanhamento preventivo.',
    rationale: 'Usada quando o apoio melhora acesso a cuidados, prevencao ou acompanhamento clinico.',
  },
  {
    id: 'health-mental-wellbeing',
    label: 'Saude mental e bem-estar psicossocial',
    category: 'Saude',
    directValue: 320,
    indirectValue: 80,
    sdgs: [3, 10, 16],
    keywords: ['saude mental', 'psicologia', 'bem-estar', 'terapeutico', 'isolamento', 'ansiedade', 'familias'],
    source: 'Proxy interna baseada em custo equivalente de acompanhamento psicossocial.',
    rationale: 'Aplicavel a outcomes de melhoria de bem-estar, reducao de isolamento ou apoio psicologico.',
  },
  {
    id: 'social-food-basic-needs',
    label: 'Apoio alimentar e necessidades basicas',
    category: 'Apoio social',
    directValue: 120,
    indirectValue: 30,
    sdgs: [1, 2, 10],
    keywords: ['alimentar', 'alimentos', 'refeicoes', 'cabaz', 'pobreza', 'necessidades basicas', 'familias'],
    source: 'Proxy interna baseada em valor de mercado/custo equivalente de apoio alimentar e bens essenciais.',
    rationale: 'Indicada para donativos de bens essenciais, apoio alimentar e resposta social imediata.',
  },
  {
    id: 'social-inclusion-vulnerability',
    label: 'Inclusao social de populacoes vulneraveis',
    category: 'Inclusao',
    directValue: 280,
    indirectValue: 70,
    sdgs: [1, 5, 10, 16],
    keywords: ['inclusao', 'vulnerabilidade', 'migrantes', 'sem abrigo', 'deficiencia', 'igualdade', 'comunidade'],
    source: 'Proxy interna baseada em custo equivalente de acompanhamento social e integracao comunitaria.',
    rationale: 'Usada quando o outcome e integracao, autonomia, protecao ou reducao de exclusao.',
  },
  {
    id: 'employment-training',
    label: 'Emprego, formacao e empregabilidade',
    category: 'Emprego',
    directValue: 650,
    indirectValue: 160,
    sdgs: [4, 8, 10],
    keywords: ['emprego', 'formacao', 'empregabilidade', 'competencias', 'profissional', 'trabalho', 'capacitar'],
    source: 'Proxy interna baseada em custo equivalente de formacao, ativacao e ganhos potenciais de empregabilidade.',
    rationale: 'Adequada para projetos que aumentam empregabilidade, qualificacao ou transicao para trabalho.',
  },
  {
    id: 'sports-inclusion',
    label: 'Desporto inclusivo e participacao',
    category: 'Desporto',
    directValue: 160,
    indirectValue: 40,
    sdgs: [3, 4, 10],
    keywords: ['desporto', 'atividade fisica', 'bolsas de desporto', 'inclusivo', 'modalidade', 'jovens'],
    source: 'Proxy interna baseada em custo equivalente de participacao desportiva e beneficios de bem-estar.',
    rationale: 'Aplicavel a projetos de desporto, inclusao, saude e participacao juvenil.',
  },
  {
    id: 'culture-heritage-education',
    label: 'Cultura, patrimonio e educacao artistica',
    category: 'Cultura',
    directValue: 140,
    indirectValue: 35,
    sdgs: [4, 11],
    keywords: ['cultura', 'arte', 'memoria', 'patrimonio', 'arquivo', 'oficinas', 'museu'],
    source: 'Proxy interna baseada em custo equivalente de experiencia cultural/educativa e acesso a patrimonio.',
    rationale: 'Indicada para outcomes de acesso cultural, literacia artistica e valorizacao patrimonial.',
  },
  {
    id: 'environment-tree-ecosystem',
    label: 'Ambiente, reflorestacao e ecossistemas',
    category: 'Ambiente',
    directValue: 90,
    indirectValue: 25,
    sdgs: [6, 12, 13, 15],
    keywords: ['ambiente', 'reflorestacao', 'arvores', 'biodiversidade', 'ecossistema', 'clima', 'co2'],
    source: 'Proxy interna baseada em beneficios ambientais, educacao ambiental e servicos de ecossistema.',
    rationale: 'Usada quando o projeto gera outcomes ambientais e comunitarios associados.',
  },
  {
    id: 'water-sanitation',
    label: 'Agua, saneamento e eficiencia hidrica',
    category: 'Ambiente',
    directValue: 210,
    indirectValue: 55,
    sdgs: [3, 6, 12],
    keywords: ['agua', 'saneamento', 'hidrico', 'poupanca de agua', 'higiene'],
    source: 'Proxy interna baseada em custo evitado e acesso a condicoes de higiene/saude.',
    rationale: 'Adequada a projetos de acesso a agua, higiene, saneamento ou eficiencia hidrica.',
  },
  {
    id: 'energy-efficiency',
    label: 'Energia, eficiencia energetica e pobreza energetica',
    category: 'Ambiente',
    directValue: 240,
    indirectValue: 60,
    sdgs: [7, 11, 12, 13],
    keywords: ['energia', 'eficiencia energetica', 'poupanca energetica', 'pobreza energetica', 'solar'],
    source: 'Proxy interna baseada em poupanca potencial, conforto e reducao de custos energeticos.',
    rationale: 'Indicada para intervenções de eficiencia energetica, conforto termico e reducao de emissoes.',
  },
  {
    id: 'animal-welfare-community',
    label: 'Bem-estar animal e saude publica comunitaria',
    category: 'Bem-estar animal',
    directValue: 110,
    indirectValue: 35,
    sdgs: [3, 11, 15],
    keywords: ['animais', 'veterinaria', 'esterilizacao', 'clinica movel', 'bem-estar animal'],
    source: 'Proxy interna baseada em custo equivalente de cuidados veterinarios e beneficios comunitarios.',
    rationale: 'Aplicavel a projetos de bem-estar animal com efeitos indiretos em saude publica e comunidade.',
  },
]

export const ISP_DIMENSIONS: Array<{ key: IspDimensionKey; label: string; weight: number; criteria: string[] }> = [
  {
    key: 'impactGenerated',
    label: 'Impacto Gerado',
    weight: 40,
    criteria: ['Beneficiarios diretos atribuiveis ao donativo', 'Beneficiarios indiretos', 'Profundidade da transformacao', 'Duracao do impacto', 'Alcance comunitario', 'Peso do valor doado face ao custo total do projeto'],
  },
  {
    key: 'esgContribution',
    label: 'Contribuicao ESG',
    weight: 25,
    criteria: ['Ambiental: CO2, energia, agua, residuos', 'Social: educacao, inclusao, saude, emprego, igualdade', 'Governacao: transparencia, contas, compliance, etica'],
  },
  {
    key: 'efficiency',
    label: 'Eficiencia',
    weight: 15,
    criteria: ['Impacto por euro investido', 'Custo por beneficiario', 'Percentagem do projeto financiada pelo donativo', 'Eficiencia dos recursos'],
  },
  {
    key: 'evidenceQuality',
    label: 'Qualidade da Evidencia',
    weight: 10,
    criteria: ['Existencia de evidencia', 'Qualidade da documentacao', 'Validacao externa', 'Rastreabilidade dos dados'],
  },
  {
    key: 'sustainability',
    label: 'Sustentabilidade e Escalabilidade',
    weight: 10,
    criteria: ['Continuidade apos financiamento', 'Replicabilidade', 'Crescimento potencial', 'Sustentabilidade financeira'],
  },
]

export const CONFIDENCE_FACTORS: Array<{ key: ConfidenceKey; label: string }> = [
  { key: 'dataCompleteness', label: 'Completude dos dados' },
  { key: 'dataFreshness', label: 'Atualizacao dos dados' },
  { key: 'evidenceExistence', label: 'Existencia de evidencia' },
  { key: 'independentValidation', label: 'Validacao independente' },
  { key: 'kpiCoverage', label: 'Cobertura de KPIs' },
  { key: 'auditability', label: 'Auditabilidade' },
]

function readStore(): Record<string, IspMeasurement> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, IspMeasurement>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function clampScore(value: number) {
  return Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))
}

function sdgName(sdgNumber: number) {
  return SDG_DATA.find(sdg => sdg.n === sdgNumber)?.fullLabel || `ODS ${sdgNumber}`
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
}

function positiveNumber(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0)
}

function coverageToScore(coveragePercent: number) {
  if (coveragePercent >= 100) return 5
  if (coveragePercent >= 75) return 4.5
  if (coveragePercent >= 50) return 4
  if (coveragePercent >= 25) return 3
  if (coveragePercent >= 10) return 2
  if (coveragePercent > 0) return 1
  return 0
}

export function getDonationImpactContext(item: IspDonationItem): DonationImpactContext {
  const donationAmount = item.proof.confirmedAmount || item.proof.amount || 0
  const projectCost =
    item.project?.totalProjectCost ||
    item.project?.requestedAmount ||
    item.project?.estimatedValue ||
    item.proof.projectCost ||
    donationAmount ||
    0
  const coveragePercent = projectCost > 0 ? clampPercent((donationAmount / projectCost) * 100) : 0
  const direct = item.project?.beneficiaries || 0
  const coveredDirectBeneficiaries = Math.round(direct * (coveragePercent / 100))
  const costPerDirectBeneficiary = direct > 0 ? projectCost / direct : 0
  const impactPerEuro = donationAmount > 0 ? coveredDirectBeneficiaries / donationAmount : 0
  return {
    donationAmount,
    projectCost,
    coveragePercent,
    coveredDirectBeneficiaries,
    costPerDirectBeneficiary,
    impactPerEuro,
  }
}

export function calculateIspScore(measurement: Pick<IspMeasurement, 'dimensions'>) {
  const weighted = ISP_DIMENSIONS.reduce((sum, dimension) =>
    sum + clampScore(measurement.dimensions[dimension.key]) * dimension.weight, 0)
  return Math.round(weighted / 5)
}

export function calculateConfidenceScore(measurement: Pick<IspMeasurement, 'confidenceFactors'>) {
  const total = CONFIDENCE_FACTORS.reduce((sum, factor) => sum + clampScore(measurement.confidenceFactors[factor.key]), 0)
  return Math.round((total / (CONFIDENCE_FACTORS.length * 5)) * 100)
}

export function calculateIrodScore(item: IspDonationItem, measurement: IspMeasurement): IrodResult {
  const donationImpact = getDonationImpactContext(item)
  const isp = calculateIspScore(measurement)
  const confidence = calculateConfidenceScore(measurement)
  const qualityReturn = isp
  const confidenceReturn = confidence
  const coverageReturn = donationImpact.coveragePercent
  const beneficiaryReturn = clampPercent(donationImpact.impactPerEuro * 2000)
  const leverageMultiplier = donationImpact.donationAmount > 0
    ? Math.max(1, donationImpact.projectCost / donationImpact.donationAmount)
    : 1
  const leverageReturn = clampPercent((Math.min(leverageMultiplier, 5) / 5) * 100)
  const score = Math.round(
    (qualityReturn * 0.35) +
    (confidenceReturn * 0.15) +
    (coverageReturn * 0.2) +
    (beneficiaryReturn * 0.2) +
    (leverageReturn * 0.1)
  )

  return {
    score: clampPercent(score),
    qualityReturn: Math.round(qualityReturn),
    confidenceReturn: Math.round(confidenceReturn),
    coverageReturn: Math.round(coverageReturn),
    beneficiaryReturn: Math.round(beneficiaryReturn),
    leverageReturn: Math.round(leverageReturn),
    leverageMultiplier,
  }
}

export function irodInterpretation(score: number) {
  if (score >= 85) return 'Retorno de impacto muito elevado'
  if (score >= 70) return 'Retorno de impacto elevado'
  if (score >= 50) return 'Retorno de impacto moderado'
  return 'Retorno de impacto a reforcar'
}

export function calculateIcsScore(item: IspDonationItem, measurement: IspMeasurement): IcsResult {
  const kpis = selectedKpis(item.project)
  const evidenceFiles = [
    item.proof.proofFileDataUrl,
    item.proof.companyInvoiceFileDataUrl,
    item.proof.institutionReceiptFileDataUrl,
  ].filter(Boolean).length
  const hasBeneficiaryData = [
    measurement.beneficiaries.direct > 0,
    measurement.beneficiaries.indirect > 0,
    measurement.beneficiaries.ageGroup && measurement.beneficiaries.ageGroup !== 'Nao especificado',
    measurement.beneficiaries.location && measurement.beneficiaries.location !== 'Nao especificado',
    measurement.beneficiaries.vulnerabilityCategory && measurement.beneficiaries.vulnerabilityCategory !== 'Nao especificado',
  ].filter(Boolean).length
  const evidenceStrength = clampPercent((evidenceFiles / 3) * 100)
  const dataIntegrity = calculateConfidenceScore(measurement)
  const kpiTraceability = clampPercent((kpis.length / 5) * 100)
  const sdgAlignment = clampPercent((measurement.sdgs.length / 3) * 100)
  const beneficiaryClarity = clampPercent((hasBeneficiaryData / 5) * 100)
  const validationReadiness = item.proof.status === 'confirmed'
    ? 100
    : item.proof.status === 'pending-institution' || item.proof.status === 'pending-company'
      ? 65
      : 35
  const score = Math.round(
    (evidenceStrength * 0.25) +
    (dataIntegrity * 0.2) +
    (kpiTraceability * 0.2) +
    (sdgAlignment * 0.15) +
    (beneficiaryClarity * 0.1) +
    (validationReadiness * 0.1)
  )

  return {
    score: clampPercent(score),
    evidenceStrength: Math.round(evidenceStrength),
    dataIntegrity: Math.round(dataIntegrity),
    kpiTraceability: Math.round(kpiTraceability),
    sdgAlignment: Math.round(sdgAlignment),
    beneficiaryClarity: Math.round(beneficiaryClarity),
    validationReadiness: Math.round(validationReadiness),
  }
}

export function icsInterpretation(score: number) {
  if (score >= 85) return 'Credibilidade de impacto muito elevada'
  if (score >= 70) return 'Credibilidade de impacto elevada'
  if (score >= 50) return 'Credibilidade de impacto moderada'
  return 'Credibilidade de impacto a reforcar'
}

export function calculateImpactScore(item: IspDonationItem, measurement: IspMeasurement): ImpactScoreResult {
  const isp = calculateIspScore(measurement)
  const irod = calculateIrodScore(item, measurement).score
  const ics = calculateIcsScore(item, measurement).score
  const score = Math.round((isp * 0.4) + (irod * 0.35) + (ics * 0.25))
  return { score: clampPercent(score), isp, irod, ics }
}

export function impactScoreInterpretation(score: number) {
  if (score >= 85) return 'Impact Score excelente'
  if (score >= 70) return 'Impact Score forte'
  if (score >= 50) return 'Impact Score consistente'
  return 'Impact Score a consolidar'
}

function scoreBand(score: number) {
  if (score >= 85) return 'muito elevado'
  if (score >= 70) return 'elevado'
  if (score >= 50) return 'moderado'
  return 'a reforcar'
}

function ratioBand(ratio: number) {
  if (ratio >= 5) return 'muito elevado'
  if (ratio >= 3) return 'elevado'
  if (ratio >= 1) return 'positivo'
  return 'a reforcar'
}

function strongestDimension(measurement: IspMeasurement) {
  return ISP_DIMENSIONS.slice().sort((a, b) =>
    clampScore(measurement.dimensions[b.key]) - clampScore(measurement.dimensions[a.key])
  )[0]
}

function weakestDimension(measurement: IspMeasurement) {
  return ISP_DIMENSIONS.slice().sort((a, b) =>
    clampScore(measurement.dimensions[a.key]) - clampScore(measurement.dimensions[b.key])
  )[0]
}

export function ispResultParagraphs(measurement: IspMeasurement): [string, string] {
  const isp = calculateIspScore(measurement)
  const strongest = strongestDimension(measurement)
  const weakest = weakestDimension(measurement)
  return [
    `O resultado ISP de ${isp}/100 representa uma qualidade de impacto ${scoreBand(isp)}. A dimensao mais forte e ${strongest.label}, com ${Math.round(clampScore(measurement.dimensions[strongest.key]) * 20)}/100, indicando que este donativo apresenta melhor desempenho nesse eixo da metodologia.`,
    `A dimensao que mais condiciona a leitura e ${weakest.label}, com ${Math.round(clampScore(measurement.dimensions[weakest.key]) * 20)}/100. Para melhorar o ISP, deve ser dada prioridade a evidencias, KPIs e informacao operacional que reforcem esta dimensao sem alterar artificialmente o alcance real do donativo.`,
  ]
}

export function irodResultParagraphs(item: IspDonationItem, measurement: IspMeasurement): [string, string] {
  const irod = calculateIrodScore(item, measurement)
  const donationImpact = getDonationImpactContext(item)
  return [
    `O IROD de ${irod.score}/100 traduz um retorno de impacto ${scoreBand(irod.score)} face ao valor doado. O donativo cobre ${donationImpact.coveragePercent.toFixed(1)}% do custo total do projeto e apresenta uma alavancagem de ${irod.leverageMultiplier.toFixed(2)}x, o que ajuda a perceber se o valor doado desbloqueia impacto proporcional ou complementar.`,
    `A leitura e composta por qualidade de impacto (${irod.qualityReturn}/100), integridade da medicao (${irod.confidenceReturn}/100), cobertura (${irod.coverageReturn}/100), beneficiarios por euro (${irod.beneficiaryReturn}/100) e alavancagem (${irod.leverageReturn}/100). Os pontos de melhoria devem concentrar-se nos eixos com menor pontuacao, sobretudo quando a cobertura financeira ou os beneficiarios atribuiveis ainda forem baixos.`,
  ]
}

export function icsResultParagraphs(item: IspDonationItem, measurement: IspMeasurement): [string, string] {
  const ics = calculateIcsScore(item, measurement)
  const kpis = selectedKpis(item.project)
  return [
    `O ICS de ${ics.score}/100 indica uma credibilidade de impacto ${scoreBand(ics.score)}. Esta pontuacao mede a robustez da avaliacao, cruzando evidencia documental, integridade dos dados, rastreabilidade de KPIs, alinhamento com ODS, caracterizacao de beneficiarios e estado de validacao.`,
    `Neste caso, existem ${kpis.length} KPI(s) associados e ${measurement.sdgs.length} ODS registado(s). Para aumentar a credibilidade, a prioridade deve ser reforcar evidencia verificavel, clarificar dados demograficos dos beneficiarios e garantir que cada KPI tem fonte, metodo de recolha e ligacao direta ao outcome medido.`,
  ]
}

export function sroiResultParagraphs(item: IspDonationItem, measurement: IspMeasurement): [string, string] {
  const sroi = calculateSroi(item, measurement)
  const inputs = normalizeSroiInputs(item, measurement)
  return [
    `O SROI de ${sroi.ratio.toFixed(2)}x representa um retorno social estimado ${ratioBand(sroi.ratio)}. Isto significa que, para cada euro doado, a metodologia estima ${sroi.ratio.toFixed(2)} euros de valor social ajustado, depois de aplicar atribuicao, deadweight, deslocacao, duracao e drop-off.`,
    `A proxy aplicada e "${inputs.proxyLabel || 'nao definida'}", com valor direto de EUR ${inputs.valuePerDirectBeneficiary.toLocaleString('pt-PT')} por beneficiario direto e EUR ${inputs.valuePerIndirectBeneficiary.toLocaleString('pt-PT')} por beneficiario indireto. Este resultado deve ser lido como estimativa metodologica e deve ser revisto sempre que a proxy, a fonte, a evidencia ou os dados de beneficiarios forem atualizados.`,
  ]
}

export function impactScoreResultParagraphs(item: IspDonationItem, measurement: IspMeasurement): [string, string] {
  const impactScore = calculateImpactScore(item, measurement)
  return [
    `O Impact Score de ${impactScore.score}/100 representa uma avaliacao global ${scoreBand(impactScore.score)} do donativo. O resultado consolida ISP (${impactScore.isp}/100), IROD (${impactScore.irod}/100) e ICS (${impactScore.ics}/100), dando mais peso a qualidade de impacto e retorno do donativo, sem ignorar a credibilidade da medicao.`,
    `Quando o Impact Score e forte, o donativo combina impacto relevante, boa eficiencia relativa e medicao suficientemente suportada. Quando fica abaixo do esperado, a melhoria pode vir de tres frentes: reforcar dimensoes ISP, aumentar a rastreabilidade/validacao que alimenta o ICS ou melhorar a atribuicao/cobertura do donativo captada pelo IROD.`,
  ]
}

function kpiLabels(item: IspDonationItem) {
  const project = item.project
  return [
    ...(project?.customKpis || []),
    ...Object.values(project?.odsImpactMetrics || {}).flatMap(metrics => [
      ...Object.keys(metrics),
      ...Object.values(metrics).map(value => String(value)),
    ]),
  ]
}

function sroiMatchingText(item: IspDonationItem) {
  const project = item.project
  return [
    item.proof.description,
    item.proof.institutionName,
    project?.projectName,
    project?.category,
    project?.subcategory,
    project?.description,
    project?.executiveSummary,
    project?.rationale,
    project?.targetPopulation,
    project?.objectives,
    project?.impactMetric,
    project?.productOrService,
    project?.productOrServiceCategory,
    ...kpiLabels(item),
  ].filter(Boolean).join(' ').toLowerCase()
}

function scoreSroiProxy(item: IspDonationItem, proxy: SroiProxy) {
  const text = sroiMatchingText(item)
  const sdgs = item.project?.sdgGoals || []
  const category = item.project?.category?.toLowerCase() || ''
  const subcategory = item.project?.subcategory?.toLowerCase() || ''
  const kpiText = kpiLabels(item).join(' ').toLowerCase()
  const matchedKeywords = proxy.keywords.filter(keyword => text.includes(keyword.toLowerCase()))
  const matchedSdgs = proxy.sdgs.filter(sdg => sdgs.includes(sdg))
  const keywordScore = matchedKeywords.reduce((score, keyword) =>
    score + (kpiText.includes(keyword.toLowerCase()) ? 6 : 4), 0)
  const sdgScore = matchedSdgs.length * 3
  const categoryScore =
    (category && proxy.category.toLowerCase().includes(category) ? 5 : 0) +
    (subcategory && proxy.keywords.some(keyword => subcategory.includes(keyword.toLowerCase())) ? 4 : 0)
  const score = keywordScore + sdgScore + categoryScore
  const reasons = [
    matchedSdgs.length ? `ODS coincidentes: ${matchedSdgs.map(sdg => `ODS ${sdg}`).join(', ')}` : '',
    matchedKeywords.length ? `Palavras/KPIs coincidentes: ${matchedKeywords.slice(0, 6).join(', ')}` : '',
    categoryScore > 0 ? 'Categoria/subcategoria alinhada com a proxy.' : '',
  ].filter(Boolean)
  return { proxy, score, matchedKeywords, matchedSdgs, reasons }
}

function buildSroiProxyRecommendation(scored: ReturnType<typeof scoreSroiProxy>): SroiProxyRecommendation {
  const confidence = clampPercent(Math.round(Math.min(95, 35 + (scored.score * 4))))
  return { ...scored, confidence }
}

export function suggestSroiProxyRecommendation(item: IspDonationItem): SroiProxyRecommendation {
  const scored = SROI_PROXY_LIBRARY.map(proxy => scoreSroiProxy(item, proxy)).sort((a, b) => b.score - a.score)

  const best = scored[0]?.score > 0
    ? scored[0]
    : {
        proxy: SROI_PROXY_LIBRARY[5],
        score: 0,
        matchedKeywords: [],
        matchedSdgs: [],
        reasons: ['Sem correspondencia forte; aplicada proxy conservadora de inclusao social.'],
      }
  return buildSroiProxyRecommendation(best)
}

export function suggestSroiProxy(item: IspDonationItem): SroiProxy {
  return suggestSroiProxyRecommendation(item).proxy
}

function defaultSroiAssumptions(item: IspDonationItem, recommendation: SroiProxyRecommendation) {
  const donationImpact = getDonationImpactContext(item)
  const hasEvidence = Boolean(item.proof.proofFileDataUrl || item.proof.companyInvoiceFileDataUrl || item.proof.institutionReceiptFileDataUrl)
  const hasKpis = kpiLabels(item).length > 0
  const category = recommendation.proxy.category.toLowerCase()
  const evidenceBonus = hasEvidence ? 5 : 0
  const kpiBonus = hasKpis ? 5 : 0
  const confidenceBonus = Math.round(recommendation.confidence / 20)
  const attributionPercent = clampPercent(Math.min(90, 62 + evidenceBonus + kpiBonus + confidenceBonus))
  const deadweightPercent = category.includes('apoio social') ? 18
    : category.includes('emprego') ? 15
      : category.includes('ambiente') ? 12
        : category.includes('saude') ? 10
          : 12
  const displacementPercent = category.includes('emprego') ? 5 : 0
  const durationYears = category.includes('ambiente') || category.includes('energia') ? 3
    : category.includes('emprego') || category.includes('educacao') || category.includes('saude') || category.includes('inclusao') ? 2
      : 1
  const dropoffPercent = durationYears > 1 ? (category.includes('ambiente') ? 8 : 15) : 0
  const coverageNote = donationImpact.coveragePercent > 0
    ? ` A atribuicao usa beneficiarios ja ajustados a cobertura do donativo (${donationImpact.coveragePercent.toFixed(1)}% do projeto).`
    : ''
  return {
    attributionPercent,
    deadweightPercent,
    displacementPercent,
    durationYears,
    dropoffPercent,
    coverageNote,
  }
}

export function applySroiProxyToInputs(inputs: SroiInputs, proxy: SroiProxy, item?: IspDonationItem): SroiInputs {
  const recommendation = item
    ? buildSroiProxyRecommendation(scoreSroiProxy(item, proxy))
    : { proxy, score: 0, confidence: inputs.proxyConfidence || 60, matchedKeywords: [], matchedSdgs: [], reasons: [] }
  const assumptions = item ? defaultSroiAssumptions(item, recommendation) : null
  return {
    ...inputs,
    valuePerDirectBeneficiary: proxy.directValue,
    valuePerIndirectBeneficiary: proxy.indirectValue,
    proxyId: proxy.id,
    proxyLabel: proxy.label,
    proxyCategory: proxy.category,
    proxySource: proxy.source,
    proxyRationale: proxy.rationale,
    proxyConfidence: appliedRecommendation.confidence,
    proxyMatchedKeywords: appliedRecommendation.matchedKeywords,
    proxyMatchedSdgs: appliedRecommendation.matchedSdgs,
    attributionPercent: assumptions?.attributionPercent ?? inputs.attributionPercent,
    deadweightPercent: assumptions?.deadweightPercent ?? inputs.deadweightPercent,
    displacementPercent: assumptions?.displacementPercent ?? inputs.displacementPercent,
    durationYears: assumptions?.durationYears ?? inputs.durationYears,
    dropoffPercent: assumptions?.dropoffPercent ?? inputs.dropoffPercent,
    notes: `${proxy.rationale} Fonte/metodo: ${proxy.source}.${assumptions?.coverageNote || ''}`,
  }
}

export function defaultSroiInputs(item: IspDonationItem, directBeneficiaries?: number): SroiInputs {
  const donationImpact = getDonationImpactContext(item)
  const direct = directBeneficiaries || donationImpact.coveredDirectBeneficiaries || item.project?.beneficiaries || 0
  const recommendation = suggestSroiProxyRecommendation(item)
  const proxy = recommendation.proxy
  const assumptions = defaultSroiAssumptions(item, recommendation)
  const baseInputs = {
    valuePerDirectBeneficiary: proxy.directValue,
    valuePerIndirectBeneficiary: proxy.indirectValue,
    proxyId: proxy.id,
    proxyLabel: proxy.label,
    proxyCategory: proxy.category,
    proxySource: proxy.source,
    proxyRationale: proxy.rationale,
    proxyConfidence: recommendation.confidence,
    proxyMatchedKeywords: recommendation.matchedKeywords,
    proxyMatchedSdgs: recommendation.matchedSdgs,
    attributionPercent: assumptions.attributionPercent,
    deadweightPercent: assumptions.deadweightPercent,
    displacementPercent: assumptions.displacementPercent,
    durationYears: assumptions.durationYears,
    dropoffPercent: assumptions.dropoffPercent,
    notes: `${proxy.rationale} Fonte/metodo: ${proxy.source}.${assumptions.coverageNote}`,
  }
  return direct > 0 ? baseInputs : { ...baseInputs, attributionPercent: 70, deadweightPercent: 15 }
}

function normalizeSroiInputs(item: IspDonationItem, measurement: IspMeasurement): SroiInputs {
  const donationImpact = getDonationImpactContext(item)
  const fallback = defaultSroiInputs(item, measurement.beneficiaries.direct || donationImpact.coveredDirectBeneficiaries)
  return {
    valuePerDirectBeneficiary: positiveNumber(measurement.sroi?.valuePerDirectBeneficiary ?? fallback.valuePerDirectBeneficiary),
    valuePerIndirectBeneficiary: positiveNumber(measurement.sroi?.valuePerIndirectBeneficiary ?? fallback.valuePerIndirectBeneficiary),
    proxyId: measurement.sroi?.proxyId ?? fallback.proxyId,
    proxyLabel: measurement.sroi?.proxyLabel ?? fallback.proxyLabel,
    proxyCategory: measurement.sroi?.proxyCategory ?? fallback.proxyCategory,
    proxySource: measurement.sroi?.proxySource ?? fallback.proxySource,
    proxyRationale: measurement.sroi?.proxyRationale ?? fallback.proxyRationale,
    proxyConfidence: measurement.sroi?.proxyConfidence ?? fallback.proxyConfidence,
    proxyMatchedKeywords: measurement.sroi?.proxyMatchedKeywords ?? fallback.proxyMatchedKeywords,
    proxyMatchedSdgs: measurement.sroi?.proxyMatchedSdgs ?? fallback.proxyMatchedSdgs,
    attributionPercent: clampPercent(measurement.sroi?.attributionPercent ?? fallback.attributionPercent),
    deadweightPercent: clampPercent(measurement.sroi?.deadweightPercent ?? fallback.deadweightPercent),
    displacementPercent: clampPercent(measurement.sroi?.displacementPercent ?? fallback.displacementPercent),
    durationYears: Math.max(1, Math.min(10, positiveNumber(measurement.sroi?.durationYears ?? fallback.durationYears))),
    dropoffPercent: clampPercent(measurement.sroi?.dropoffPercent ?? fallback.dropoffPercent),
    notes: measurement.sroi?.notes ?? fallback.notes,
  }
}

export function calculateSroi(item: IspDonationItem, measurement: IspMeasurement): SroiResult {
  const donationImpact = getDonationImpactContext(item)
  const inputs = normalizeSroiInputs(item, measurement)
  const direct = positiveNumber(measurement.beneficiaries.direct || donationImpact.coveredDirectBeneficiaries)
  const indirect = positiveNumber(measurement.beneficiaries.indirect)
  const baseAnnualValue =
    (direct * inputs.valuePerDirectBeneficiary) +
    (indirect * inputs.valuePerIndirectBeneficiary)
  let grossSocialValue = 0
  for (let year = 0; year < inputs.durationYears; year += 1) {
    grossSocialValue += baseAnnualValue * Math.pow(1 - (inputs.dropoffPercent / 100), year)
  }
  const adjustedSocialValue = Math.max(
    0,
    grossSocialValue *
      (inputs.attributionPercent / 100) *
      (1 - (inputs.deadweightPercent / 100)) *
      (1 - (inputs.displacementPercent / 100))
  )
  const donationAmount = donationImpact.donationAmount || 0
  const ratio = donationAmount > 0 ? adjustedSocialValue / donationAmount : 0
  const netSocialValue = adjustedSocialValue - donationAmount
  const paybackPercent = donationAmount > 0 ? clampPercent((adjustedSocialValue / donationAmount) * 100) : 0
  return {
    grossSocialValue,
    adjustedSocialValue,
    donationAmount,
    ratio,
    netSocialValue,
    paybackPercent,
  }
}

export function sroiInterpretation(ratio: number) {
  if (ratio >= 5) return 'SROI muito elevado'
  if (ratio >= 3) return 'SROI elevado'
  if (ratio >= 1) return 'SROI positivo'
  return 'SROI a reforcar'
}

export function defaultIspMeasurement(item: IspDonationItem): IspMeasurement {
  const project = item.project
  const hasEvidence = Boolean(item.proof.proofFileDataUrl || item.proof.companyInvoiceFileDataUrl || item.proof.institutionReceiptFileDataUrl)
  const direct = project?.beneficiaries || 0
  const indirect = project?.generalImpactMetrics?.indirectBeneficiaries || 0
  const donationImpact = getDonationImpactContext(item)
  const coverageScore = coverageToScore(donationImpact.coveragePercent)
  const kpis = (project?.customKpis?.length || 0) + Object.values(project?.odsImpactMetrics || {}).reduce((sum, metrics) => sum + Object.keys(metrics).length, 0)
  const sdgs = (project?.sdgGoals || []).map(sdgNumber => ({
    sdgNumber,
    sdgName: sdgName(sdgNumber),
    contributionLevel: 'Elevado' as const,
    evidence: project?.impactMetric || 'Evidencia a validar pela equipa de administracao.',
  }))

  return {
    proofId: item.proof.id,
    updatedAt: new Date().toISOString(),
    dimensions: {
      impactGenerated: direct > 0 ? Math.max(1, Math.min(5, (coverageScore * 0.45) + 2.25)) : Math.max(1, coverageScore),
      esgContribution: (project?.sdgGoals?.length || 0) > 1 ? 4 : 3,
      efficiency: donationImpact.impactPerEuro > 0 ? Math.max(1, Math.min(5, (coverageScore * 0.55) + 1.75)) : Math.max(1, coverageScore),
      evidenceQuality: hasEvidence ? 4 : 2,
      sustainability: project?.continuousProject || project?.implementationPhase === 'a-decorrer' ? 4 : 3,
    },
    confidenceFactors: {
      dataCompleteness: project ? 4 : 2,
      dataFreshness: item.proof.confirmedAt ? 4 : 3,
      evidenceExistence: hasEvidence ? 4 : 1,
      independentValidation: item.proof.status === 'confirmed' ? 4 : 2,
      kpiCoverage: kpis > 2 ? 4 : kpis > 0 ? 3 : 2,
      auditability: hasEvidence && item.proof.status === 'confirmed' ? 4 : 2,
    },
    sdgs,
    beneficiaries: {
      direct: donationImpact.coveredDirectBeneficiaries || direct,
      indirect,
      ageGroup: 'Nao especificado',
      gender: 'Nao especificado',
      location: [item.institution?.municipality, item.institution?.district].filter(Boolean).join(', ') || 'Nao especificado',
      vulnerabilityCategory: project?.keyPopulations?.join('; ') || project?.targetPopulation || 'Nao especificado',
    },
    sroi: defaultSroiInputs(item, donationImpact.coveredDirectBeneficiaries || direct),
    notes: `Avaliacao interna gerada pela metodologia proprietaria ISP™. O donativo cobre ${donationImpact.coveragePercent.toFixed(1)}% do custo total do projeto, pelo que a medicao considera o impacto atribuivel ao valor doado e nao apenas o potencial total do projeto.`,
  }
}

export function getIspMeasurement(item: IspDonationItem): IspMeasurement {
  const stored = readStore()[item.proof.id]
  if (!stored) return defaultIspMeasurement(item)
  return {
    ...stored,
    sroi: {
      ...defaultSroiInputs(item, stored.beneficiaries?.direct),
      ...(stored.sroi || {}),
    },
  }
}

export function saveIspMeasurement(measurement: IspMeasurement) {
  const store = readStore()
  store[measurement.proofId] = { ...measurement, updatedAt: new Date().toISOString() }
  writeStore(store)
}

export function listIspMeasurements() {
  return readStore()
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function barSvg(label: string, value: number, color: string) {
  const width = Math.max(8, Math.min(100, value))
  return `
    <div class="chart-row">
      <span>${escapeHtml(label)}</span>
      <div class="bar"><div style="width:${width}%;background:${color};"></div></div>
      <strong>${Math.round(value)}</strong>
    </div>
  `
}

function paragraphsHtml(paragraphs: [string, string]) {
  return paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')
}

function selectedKpis(project?: NeedItem) {
  const custom = project?.customKpis || []
  const ods = Object.entries(project?.odsImpactMetrics || {}).flatMap(([sdg, metrics]) =>
    Object.entries(metrics).map(([key, value]) => `ODS ${sdg}: ${key} (${value})`)
  )
  return [...custom, ...ods]
}

function demographicSummary(measurement: IspMeasurement) {
  return [
    ['Beneficiarios diretos', measurement.beneficiaries.direct.toLocaleString('pt-PT')],
    ['Beneficiarios indiretos', measurement.beneficiaries.indirect.toLocaleString('pt-PT')],
    ['Faixa etaria', measurement.beneficiaries.ageGroup],
    ['Genero', measurement.beneficiaries.gender],
    ['Localizacao', measurement.beneficiaries.location],
    ['Vulnerabilidade', measurement.beneficiaries.vulnerabilityCategory],
  ]
}

export function downloadIspWordReport(item: IspDonationItem, measurement: IspMeasurement) {
  const isp = calculateIspScore(measurement)
  const irod = calculateIrodScore(item, measurement)
  const ics = calculateIcsScore(item, measurement)
  const impactScore = calculateImpactScore(item, measurement)
  const sroi = calculateSroi(item, measurement)
  const sroiInputs = normalizeSroiInputs(item, measurement)
  const donationImpact = getDonationImpactContext(item)
  const ispParagraphs = ispResultParagraphs(measurement)
  const irodParagraphs = irodResultParagraphs(item, measurement)
  const icsParagraphs = icsResultParagraphs(item, measurement)
  const sroiParagraphs = sroiResultParagraphs(item, measurement)
  const impactScoreParagraphs = impactScoreResultParagraphs(item, measurement)
  const amount = (item.proof.confirmedAmount || item.proof.amount || 0).toLocaleString('pt-PT')
  const kpis = selectedKpis(item.project)
  const sdgDashboard = measurement.sdgs.map(sdg => `
    <tr>
      <td>ODS ${sdg.sdgNumber}</td>
      <td>${escapeHtml(sdg.sdgName)}</td>
      <td>${escapeHtml(sdg.contributionLevel)}</td>
      <td>${escapeHtml(sdg.evidence)}</td>
    </tr>
  `).join('')

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>ISP - ${escapeHtml(item.companyName)}</title>
      <style>
        @page { margin: 1.7cm; }
        body { font-family: Aptos, Arial, sans-serif; color: #0E2433; background: #ffffff; line-height: 1.45; }
        h1, h2, h3 { color: #0E2433; margin: 0 0 10px; }
        h1 { font-size: 32px; line-height: 1.08; }
        h2 { font-size: 22px; border-bottom: 2px solid #D7E2EA; padding-bottom: 7px; margin-top: 28px; }
        h3 { font-size: 16px; margin-top: 18px; }
        .cover { background: #0E2433; color: #ffffff; padding: 34px; border-radius: 18px; }
        .cover h1, .cover p { color: #ffffff; }
        .eyebrow { color: #8BA5B5; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
        .tagline { color: #C7D7DE; font-size: 18px; margin-top: 18px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .card { border: 1px solid #D7E2EA; background: #F8FAFC; border-radius: 12px; padding: 14px; margin: 10px 0; }
        .score { font-size: 42px; font-weight: 900; color: #2563EB; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
        th { background: #0E2433; color: #ffffff; text-align: left; }
        th, td { border: 1px solid #D7E2EA; padding: 9px; vertical-align: top; }
        .chart-row { margin: 8px 0; display: flex; align-items: center; gap: 10px; }
        .chart-row span { width: 210px; font-weight: 700; font-size: 12px; }
        .chart-row strong { width: 36px; text-align: right; }
        .bar { flex: 1; height: 16px; background: #E2EDF3; border-radius: 999px; overflow: hidden; }
        .bar div { height: 16px; border-radius: 999px; }
        .note { color: #526879; font-size: 12px; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <section class="cover">
        <p class="eyebrow">Lei do Mecenato | Metodologia Proprietaria ISP™</p>
        <h1>Medição ESG e Impacto</h1>
        <p class="tagline">Impacto que gera Valor</p>
        <p><strong>Empresa:</strong> ${escapeHtml(item.companyName)}</p>
        <p><strong>Instituição:</strong> ${escapeHtml(item.proof.institutionName)}</p>
        <p><strong>Projeto:</strong> ${escapeHtml(item.project?.projectName || item.project?.subcategory || 'Nao identificado')}</p>
        <p><strong>Valor do donativo:</strong> EUR ${amount}</p>
      </section>

      <h2>Sumário Executivo</h2>
      <div class="grid">
        <div class="card"><p class="eyebrow">Impact Score</p><div class="score">${impactScore.score}</div><p>${escapeHtml(impactScoreInterpretation(impactScore.score))}.</p></div>
        <div class="card"><p class="eyebrow">ISP™</p><div class="score">${isp}</div><p>Resultado ponderado de 0 a 100.</p></div>
        <div class="card"><p class="eyebrow">IROD™</p><div class="score">${irod.score}</div><p>${escapeHtml(irodInterpretation(irod.score))}.</p></div>
        <div class="card"><p class="eyebrow">ICS™</p><div class="score">${ics.score}</div><p>${escapeHtml(icsInterpretation(ics.score))}.</p></div>
        <div class="card"><p class="eyebrow">SROI</p><div class="score">${sroi.ratio.toFixed(2)}x</div><p>${escapeHtml(sroiInterpretation(sroi.ratio))}.</p></div>
      </div>
      <p>${escapeHtml(measurement.notes)}</p>

      <h2>Impacto Específico do Donativo</h2>
      <table>
        <tbody>
          <tr><th>Valor doado</th><td>EUR ${donationImpact.donationAmount.toLocaleString('pt-PT')}</td></tr>
          <tr><th>Custo total do projeto</th><td>EUR ${donationImpact.projectCost.toLocaleString('pt-PT')}</td></tr>
          <tr><th>Cobertura do projeto pelo donativo</th><td>${donationImpact.coveragePercent.toFixed(1)}%</td></tr>
          <tr><th>Beneficiários diretos atribuíveis ao donativo</th><td>${donationImpact.coveredDirectBeneficiaries.toLocaleString('pt-PT')}</td></tr>
          <tr><th>Custo por beneficiário direto do projeto</th><td>EUR ${donationImpact.costPerDirectBeneficiary.toFixed(2)}</td></tr>
          <tr><th>Impacto por euro doado</th><td>${donationImpact.impactPerEuro.toFixed(4)} beneficiários diretos/EUR</td></tr>
        </tbody>
      </table>
      ${barSvg('Cobertura do projeto pelo donativo', donationImpact.coveragePercent, '#F59E0B')}

      <h2>Social Return on Investment - SROI</h2>
      <p>A calculadora SROI estima o valor social atribuivel ao donativo e compara-o com o valor doado. O resultado indica quantos euros de valor social estimado sao gerados por cada euro doado.</p>
      <table>
        <tbody>
          <tr><th>SROI</th><td>${sroi.ratio.toFixed(2)}x - ${escapeHtml(sroiInterpretation(sroi.ratio))}</td></tr>
          <tr><th>Valor social bruto estimado</th><td>EUR ${sroi.grossSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</td></tr>
          <tr><th>Valor social ajustado</th><td>EUR ${sroi.adjustedSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</td></tr>
          <tr><th>Valor liquido social</th><td>EUR ${sroi.netSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</td></tr>
          <tr><th>Valor do donativo</th><td>EUR ${sroi.donationAmount.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</td></tr>
        </tbody>
      </table>
      ${barSvg('SROI face ao break-even', sroi.paybackPercent, '#7C3AED')}
      <table>
        <tbody>
          <tr><th>Proxy financeira aplicada</th><td>${escapeHtml(sroiInputs.proxyLabel || 'Nao definida')}</td></tr>
          <tr><th>Categoria da proxy</th><td>${escapeHtml(sroiInputs.proxyCategory || 'Nao definida')}</td></tr>
          <tr><th>Fonte/metodo da proxy</th><td>${escapeHtml(sroiInputs.proxySource || 'Nao definido')}</td></tr>
          <tr><th>Justificacao da proxy</th><td>${escapeHtml(sroiInputs.proxyRationale || 'Nao definida')}</td></tr>
          <tr><th>Valor por beneficiario direto</th><td>EUR ${sroiInputs.valuePerDirectBeneficiary.toLocaleString('pt-PT')}</td></tr>
          <tr><th>Valor por beneficiario indireto</th><td>EUR ${sroiInputs.valuePerIndirectBeneficiary.toLocaleString('pt-PT')}</td></tr>
          <tr><th>Atribuicao ao donativo</th><td>${sroiInputs.attributionPercent}%</td></tr>
          <tr><th>Deadweight</th><td>${sroiInputs.deadweightPercent}%</td></tr>
          <tr><th>Deslocacao</th><td>${sroiInputs.displacementPercent}%</td></tr>
          <tr><th>Duracao do impacto</th><td>${sroiInputs.durationYears} ano(s)</td></tr>
          <tr><th>Drop-off anual</th><td>${sroiInputs.dropoffPercent}%</td></tr>
        </tbody>
      </table>
      <p class="note">${escapeHtml(sroiInputs.notes)}</p>
      <h3>Leitura do resultado SROI</h3>
      ${paragraphsHtml(sroiParagraphs)}

      <h2>Impact Return on Donation - IROD™</h2>
      <p>O IROD™ estima o retorno de impacto do donativo, cruzando qualidade de impacto, integridade da medição, cobertura do custo total, beneficiários diretos por euro e efeito de alavancagem do valor doado.</p>
      <table>
        <tbody>
          <tr><th>IROD™</th><td>${irod.score}/100 - ${escapeHtml(irodInterpretation(irod.score))}</td></tr>
          <tr><th>Qualidade de impacto</th><td>${irod.qualityReturn}/100</td></tr>
          <tr><th>Integridade da medição</th><td>${irod.confidenceReturn}/100</td></tr>
          <tr><th>Cobertura do custo total</th><td>${irod.coverageReturn}/100</td></tr>
          <tr><th>Beneficiários por euro</th><td>${irod.beneficiaryReturn}/100</td></tr>
          <tr><th>Alavancagem do donativo</th><td>${irod.leverageMultiplier.toFixed(2)}x</td></tr>
        </tbody>
      </table>
      ${barSvg('IROD™', irod.score, '#06B6D4')}
      ${barSvg('Qualidade de impacto', irod.qualityReturn, '#2563EB')}
      ${barSvg('Integridade da medição', irod.confidenceReturn, '#22C55E')}
      ${barSvg('Cobertura', irod.coverageReturn, '#F59E0B')}
      ${barSvg('Beneficiários por euro', irod.beneficiaryReturn, '#06B6D4')}

      <h3>Leitura do resultado IROD</h3>
      ${paragraphsHtml(irodParagraphs)}

      <h2>Impact Credibility Score - ICS™</h2>
      <p>O ICS™ mede a credibilidade da avaliação de impacto, verificando se a medição é suportada por evidências, dados completos, KPIs rastreáveis, ODS associados, dados demográficos e estado de validação.</p>
      <table>
        <tbody>
          <tr><th>ICS™</th><td>${ics.score}/100 - ${escapeHtml(icsInterpretation(ics.score))}</td></tr>
          <tr><th>Força da evidência</th><td>${ics.evidenceStrength}/100</td></tr>
          <tr><th>Integridade dos dados</th><td>${ics.dataIntegrity}/100</td></tr>
          <tr><th>Rastreabilidade de KPIs</th><td>${ics.kpiTraceability}/100</td></tr>
          <tr><th>Alinhamento ODS</th><td>${ics.sdgAlignment}/100</td></tr>
          <tr><th>Clareza dos beneficiários</th><td>${ics.beneficiaryClarity}/100</td></tr>
          <tr><th>Prontidão de validação</th><td>${ics.validationReadiness}/100</td></tr>
        </tbody>
      </table>
      ${barSvg('ICS™', ics.score, '#0E2433')}
      ${barSvg('Força da evidência', ics.evidenceStrength, '#2563EB')}
      ${barSvg('Integridade dos dados', ics.dataIntegrity, '#22C55E')}
      ${barSvg('Rastreabilidade de KPIs', ics.kpiTraceability, '#06B6D4')}

      <h3>Leitura do resultado ICS</h3>
      ${paragraphsHtml(icsParagraphs)}

      <h2>Impact Score</h2>
      <p>O Impact Score consolida a avaliação global do donativo através de três indicadores proprietários: ISP™, IROD™ e ICS™.</p>
      <table>
        <tbody>
          <tr><th>Impact Score</th><td>${impactScore.score}/100 - ${escapeHtml(impactScoreInterpretation(impactScore.score))}</td></tr>
          <tr><th>ISP™</th><td>${impactScore.isp}/100</td></tr>
          <tr><th>IROD™</th><td>${impactScore.irod}/100</td></tr>
          <tr><th>ICS™</th><td>${impactScore.ics}/100</td></tr>
        </tbody>
      </table>
      <p><strong>Fórmula:</strong> Impact Score = ISP™ x 40% + IROD™ x 35% + ICS™ x 25%.</p>
      ${barSvg('Impact Score', impactScore.score, '#0E2433')}
      ${barSvg('ISP™', impactScore.isp, '#2563EB')}
      ${barSvg('IROD™', impactScore.irod, '#06B6D4')}
      ${barSvg('ICS™', impactScore.ics, '#22C55E')}

      <h3>Leitura do Impact Score</h3>
      ${paragraphsHtml(impactScoreParagraphs)}

      <h2>Fórmula ISP™</h2>
      <p>ISP = (Impacto Gerado x 40 + Contribuição ESG x 25 + Eficiência x 15 + Qualidade da Evidência x 10 + Sustentabilidade x 10) / 5.</p>
      ${ISP_DIMENSIONS.map(dimension => barSvg(`${dimension.label} (${dimension.weight}%)`, clampScore(measurement.dimensions[dimension.key]) * 20, '#2563EB')).join('')}

      <h3>Leitura do resultado ISP</h3>
      ${paragraphsHtml(ispParagraphs)}

      <h2>Integração com ODS</h2>
      <table>
        <thead><tr><th>Número</th><th>Nome</th><th>Nível de contribuição</th><th>Evidências</th></tr></thead>
        <tbody>${sdgDashboard || '<tr><td colspan="4">Sem ODS associado.</td></tr>'}</tbody>
      </table>

      <h2>Gestão de Beneficiários</h2>
      <table>
        <tbody>${demographicSummary(measurement).map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody>
      </table>

      <h2>KPI e Evidências</h2>
      <ul>${(kpis.length ? kpis : ['Sem KPI preenchidos.']).map(kpi => `<li>${escapeHtml(kpi)}</li>`).join('')}</ul>
      <p><strong>Comprovativo:</strong> ${item.proof.proofFileName || item.proof.companyInvoiceFileName || 'Nao anexado'}</p>

      <div class="page-break"></div>
      <h2>Apêndice Metodológico</h2>
      ${ISP_DIMENSIONS.map(dimension => `
        <h3>${escapeHtml(dimension.label)} (${dimension.weight}%)</h3>
        <p><strong>Pontuação:</strong> ${clampScore(measurement.dimensions[dimension.key])}/5</p>
        <ul>${dimension.criteria.map(criteria => `<li>${escapeHtml(criteria)}</li>`).join('')}</ul>
      `).join('')}
    </body>
  </html>`

  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `medicao-isp-${item.proof.contractId || item.proof.id}.doc`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
