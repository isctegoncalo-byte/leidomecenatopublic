// ══════════════════════════════════════════════════════
// TEMPLATES DE CONTEÚDOS — COMUNICAÇÃO INTERNA
// ══════════════════════════════════════════════════════
// Edita este ficheiro para criar ou alterar os textos
// gerados automaticamente para comunicação interna
// (emails, intranet, newsletters internas).
//
// PLACEHOLDERS disponíveis (substituídos automaticamente):
//   {{empresa}}       — nome da empresa doadora
//   {{instituicao}}   — nome da instituição beneficiária
//   {{donativo}}      — valor do donativo (ex: "10.000")
//   {{data}}          — data do donativo
//   {{rating}}        — rating ESG (ex: "AA")
//   {{score}}         — score total (ex: "78")
//   {{beneficiarios}} — n.º de beneficiários
//   {{ods_principal}} — nome do ODS principal
//   {{ods_numeros}}   — ex: "ODS 4, ODS 10, ODS 13"
//   {{cobertura}}     — % de cobertura do projeto
//   {{deducao_irc}}   — valor da dedução IRC
//   {{poupanca}}      — poupança fiscal estimada
//   {{necessidade_1}} — primeira necessidade apoiada
//   {{necessidade_2}} — segunda necessidade apoiada
//   {{relatorio_id}}  — código do relatório
//   {{ano}}           — ano corrente
// ══════════════════════════════════════════════════════

export interface SocialTemplate {
  id: string
  name: string
  description: string
  internalComms: SocialPost
}

export interface SocialPost {
  title: string
  body: string
  hashtags: string[]
  callToAction: string
}

export const socialTemplates: SocialTemplate[] = [
  // ─── TEMPLATE 1: INSTITUCIONAL FORMAL ──────────
  {
    id: 'formal',
    name: 'Institucional Formal',
    description: 'Tom corporativo, ideal para comunicação institucional. Focado em dados e impacto.',
    internalComms: {
      title: 'Comunicação Interna — Donativo à {{instituicao}}',
      body: `Caros colaboradores,

Temos o prazer de comunicar que a {{empresa}} efetuou um donativo de €{{donativo}} à {{instituicao}}, ao abrigo da Lei do Mecenato.

O Relatório de Impacto produzido atribuiu um Impact Score de {{score}}/100 (rating {{rating}}), com impacto direto em {{beneficiarios}} beneficiários. Este donativo está alinhado com os Objetivos de Desenvolvimento Sustentável: {{ods_numeros}}.

Necessidades apoiadas:
• {{necessidade_1}}
• {{necessidade_2}}

Este donativo reflete o compromisso da {{empresa}} com a responsabilidade social e com o desenvolvimento sustentável. Agradeço a todos os que contribuem para uma cultura empresarial mais responsável.`,
      hashtags: [],
      callToAction: 'O Relatório de Impacto completo está disponível na intranet.',
    },
  },

  // ─── TEMPLATE 2: STORYTELLING ──────────────────
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Tom narrativo e emocional, ideal para contar a história por trás do donativo.',
    internalComms: {
      title: 'O impacto que a {{empresa}} gerou este mês',
      body: `Olá equipa,

Quero partilhar uma história que nos orgulha a todos.

A {{empresa}} apoiou {{instituicao}} — uma organização dedicada a {{necessidade_1}} — com um donativo de €{{donativo}} ao abrigo da Lei do Mecenato. Este apoio chegou a {{beneficiarios}} pessoas.

O Relatório de Impacto atribuiu-nos um rating de {{rating}} ({{score}}/100). Isto significa que o nosso donativo não só fez a diferença na vida de quem precisa, como está alinhado com os Objetivos de Desenvolvimento Sustentável da ONU ({{ods_numeros}}).

Lembrem-se: 100% do donativo foi para a instituição. E com a dedução de 140% no IRC, o custo real para a empresa foi significativamente inferior.

Obrigado por fazerem parte de uma empresa com propósito.`,
      hashtags: [],
      callToAction: 'Relatório completo disponível na intranet.',
    },
  },

  // ─── TEMPLATE 3: DADOS E MÉTRICAS ─────────────
  {
    id: 'data-driven',
    name: 'Dados e Métricas',
    description: 'Focado em números e KPIs, ideal para empresas com relatório de sustentabilidade.',
    internalComms: {
      title: 'KPIs de Impacto Social — {{ano}}',
      body: `Segue o resumo do impacto gerado pelo donativo da {{empresa}} a {{instituicao}}:

┌─────────────────────────────────────┐
│ DONATIVO         €{{donativo}}            │
│ IMPACT SCORE     {{score}}/100 ({{rating}})     │
│ BENEFICIÁRIOS    {{beneficiarios}}               │
│ ODS              {{ods_numeros}}       │
│ COBERTURA        {{cobertura}}%              │
│ DEDUÇÃO IRC      €{{deducao_irc}}           │
│ POUPANÇA FISCAL  €{{poupanca}}             │
└─────────────────────────────────────┘

Necessidades apoiadas:
1. {{necessidade_1}}
2. {{necessidade_2}}

Estes dados podem ser integrados diretamente no relatório de sustentabilidade anual da empresa.`,
      hashtags: [],
      callToAction: 'Dados exportáveis em formato CSV disponíveis no portal.',
    },
  },
]

// ──────────────────────────────────────────────────────
// HELPER: gerar os conteúdos preenchidos
// ──────────────────────────────────────────────────────
import { fillPlaceholders } from './reportTemplates'
import { GeneratedESGReport } from '../types'

export function buildPlaceholderVars(report: GeneratedESGReport): Record<string, string> {
  return {
    empresa: report.company,
    instituicao: report.institution,
    donativo: report.donationAmount.toLocaleString('pt-PT'),
    data: report.donationDate,
    rating: report.rating,
    score: String(report.scores.total),
    beneficiarios: report.scores.beneficiaries.toLocaleString(),
    ods_principal: report.sdgAlignment.length > 0 ? `ODS ${report.sdgAlignment[0]}` : '—',
    ods_numeros: report.sdgAlignment.map(s => `ODS ${s}`).join(', '),
    cobertura: report.coveragePercent !== undefined ? report.coveragePercent.toFixed(1) : '—',
    deducao_irc: report.irsDeduction.toLocaleString('pt-PT'),
    poupanca: report.ircSavings.toLocaleString('pt-PT'),
    necessidade_1: report.relevantNeeds[0] ? `${report.relevantNeeds[0].category} › ${report.relevantNeeds[0].subcategory}` : '—',
    necessidade_2: report.relevantNeeds[1] ? `${report.relevantNeeds[1].category} › ${report.relevantNeeds[1].subcategory}` : '—',
    relatorio_id: report.reportId,
    ano: String(new Date().getFullYear()),
  }
}

export function generateSocialContent(report: GeneratedESGReport, templateId: string): {
  internal: { title: string; body: string; cta: string }
} | null {
  const template = socialTemplates.find(t => t.id === templateId) || socialTemplates[0]
  const vars = buildPlaceholderVars(report)

  return {
    internal: {
      title: fillPlaceholders(template.internalComms.title, vars),
      body: fillPlaceholders(template.internalComms.body, vars),
      cta: fillPlaceholders(template.internalComms.callToAction, vars),
    },
  }
}
