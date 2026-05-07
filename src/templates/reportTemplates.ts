// ══════════════════════════════════════════════════════
// TEMPLATES DE RELATÓRIO ESG — PDF
// ══════════════════════════════════════════════════════
// Edita este ficheiro para criar ou alterar templates.
// Cada template controla cores, textos, secções e layout do PDF.
// As cores do ODS principal sobrepõem-se automaticamente.
//
// PLACEHOLDERS disponíveis nos textos:
//   {{empresa}}       — nome da empresa doadora
//   {{instituicao}}   — nome da instituição beneficiária
//   {{donativo}}      — valor do donativo (ex: "10.000")
//   {{data}}          — data do donativo
//   {{rating}}        — rating ESG (ex: "AA")
//   {{score}}         — score total (ex: "78")
//   {{beneficiarios}} — n.º de beneficiários
//   {{ods_principal}} — nome do ODS principal
//   {{cobertura}}     — % de cobertura do projeto
//   {{deducao_irc}}   — valor da dedução IRC
//   {{poupanca}}      — poupança fiscal estimada
//   {{relatorio_id}}  — código do relatório
// ══════════════════════════════════════════════════════

export interface ReportTemplate {
  id: string
  name: string
  // Cores base (o ODS principal sobrepõe-se)
  accent: string
  subAccent: string
  background: string
  note: string

  // Secções do PDF — ativa/desativa e reordena
  sections: ReportSection[]

  // Fundos personalizados por página/secção (dataURL de JPG/PNG)
  // Chaves: cover, toc, summary, overview, scores, sdg, needs, gallery, fiscal
  pageBackgrounds: Record<string, string>

  // Textos personalizáveis da capa
  coverTitle: string       // ex: "Relatório\nde Impacto"
  coverSubtitle: string    // ex: "Donativo ao abrigo da Lei do Mecenato"

  // Texto do bloco "Sobre este relatório" no índice
  aboutText: string

  // Rodapé de todas as páginas
  footerText: string

  // Disclaimer final
  disclaimer: string

  // Opções visuais avançadas
  layoutStyle: 'corporate' | 'editorial' | 'magazine'
  coverStyle: 'minimal' | 'circles' | 'photo-led'
  logoPosition: 'top-left' | 'top-right' | 'center'
  showLogo: boolean
  showPageNumbers: boolean
  headingSize: number
  bodySize: number
  cornerRadius: number
  imageTreatment: 'rounded' | 'framed' | 'full-bleed'
  kpiStyle: 'cards' | 'badges' | 'table'

  // Labels e textos de secções
  ratingMethodTitle: string
  ratingMethodText: string
  thankYouTitle: string
  galleryTitle: string
  needsTitle: string
}

export interface ReportSection {
  id: string
  label: string           // nome para o índice
  enabled: boolean        // se false, a secção é omitida do PDF
}

// Secções padrão — podes reordenar ou desativar qualquer uma
const defaultSections: ReportSection[] = [
  { id: 'cover',       label: 'Capa',                      enabled: true },
  { id: 'toc',         label: 'Índice',                    enabled: true },
  { id: 'summary',     label: 'Sumário Executivo',         enabled: true },
  { id: 'overview',    label: 'A Empresa & A Instituição', enabled: true },
  { id: 'scores',      label: 'Impact Score & Rating',     enabled: true },
  { id: 'sdg',         label: 'Alinhamento com os ODS',    enabled: true },
  { id: 'needs',       label: 'Necessidades Apoiadas',     enabled: true },
  { id: 'gallery',     label: 'Galeria do Projeto',        enabled: true },
  { id: 'fiscal',      label: 'Dados Fiscais & IRC',       enabled: true },
]

export const defaultReportAdvanced = {
  layoutStyle: 'corporate' as const,
  coverStyle: 'circles' as const,
  logoPosition: 'top-left' as const,
  showLogo: true,
  showPageNumbers: true,
  pageBackgrounds: {},
  headingSize: 34,
  bodySize: 12,
  cornerRadius: 4,
  imageTreatment: 'rounded' as const,
  kpiStyle: 'cards' as const,
  ratingMethodTitle: 'Como é atribuído o rating',
  ratingMethodText: 'O Impact Score (0-100) é o resultado ponderado dos três pilares ESG: Ambiental (35%), Social (45%) e Governação (20%). Cada pilar é calculado com base nas necessidades apoiadas, considerando urgência, alinhamento com ODS e dimensão de beneficiários.',
  thankYouTitle: 'Mensagem de agradecimento da instituição',
  galleryTitle: 'Fotografias carregadas pela instituição apoiada',
  needsTitle: 'Necessidades Apoiadas',
}

// ──────────────────────────────────────────────────────
// TEMPLATES
// ──────────────────────────────────────────────────────

export const reportTemplates: ReportTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    accent: '#0f172a',
    subAccent: '#2563eb',
    background: '#ffffff',
    note: 'Layout formal e limpo, ideal para relatórios corporativos.',
    sections: [...defaultSections],
    coverTitle: 'Relatório\nde Impacto',
    coverSubtitle: 'Donativo ao abrigo da Lei do Mecenato',
    aboutText: 'Este relatório de impacto foi gerado pela plataforma Lei do Mecenato com base no donativo registado e no perfil ESG da instituição beneficiária. As cores e iconografia refletem o ODS principal apoiado ({{ods_principal}}).',
    footerText: 'Lei do Mecenato  •  Relatório de Impacto',
    disclaimer: 'Este relatório foi gerado pela plataforma Lei do Mecenato — uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.',
    ...defaultReportAdvanced,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    accent: '#1e293b',
    subAccent: '#7c3aed',
    background: '#f8fafc',
    note: 'Layout com destaque visual e secções mais narrativas.',
    sections: [...defaultSections],
    coverTitle: 'Impacto\nVerificado',
    coverSubtitle: '{{empresa}} × {{instituicao}}',
    aboutText: 'Relatório produzido a partir dos dados de impacto recolhidos junto de {{instituicao}}, cruzados com o perfil ESG da instituição e o donativo de €{{donativo}} registado por {{empresa}}.',
    footerText: 'Lei do Mecenato  •  Impacto Verificado',
    disclaimer: 'Este relatório foi gerado pela plataforma Lei do Mecenato — uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.',
    ...defaultReportAdvanced,
    layoutStyle: 'editorial',
    coverStyle: 'photo-led',
    kpiStyle: 'badges',
  },
  {
    id: 'premium-social',
    name: 'Premium Social',
    accent: '#312e81',
    subAccent: '#db2777',
    background: '#ffffff',
    note: 'Layout pensado para conteúdos de redes e comunicação interna.',
    sections: [...defaultSections],
    coverTitle: 'ESG Impact\nReport',
    coverSubtitle: 'Powered by Lei do Mecenato',
    aboutText: 'Este relatório documenta o impacto social, ambiental e de governação gerado pelo donativo de {{empresa}} a {{instituicao}}, com rating {{rating}} e {{beneficiarios}} beneficiários diretos.',
    footerText: 'Lei do Mecenato  •  ESG Impact Report',
    disclaimer: 'Este relatório foi gerado pela plataforma Lei do Mecenato — uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. O donativo referenciado é elegível para dedução fiscal nos termos do artigo 62.º do Código do IRC — confirme com o seu TOC.',
    ...defaultReportAdvanced,
    layoutStyle: 'magazine',
    coverStyle: 'circles',
    imageTreatment: 'full-bleed',
    kpiStyle: 'cards',
  },
]

// ──────────────────────────────────────────────────────
// HELPER: substituir placeholders nos textos do template
// ──────────────────────────────────────────────────────
export function fillPlaceholders(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value)
  }
  return result
}
