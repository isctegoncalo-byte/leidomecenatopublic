# Guia de Templates — Lei do Mecenato

## Visão Geral

A plataforma tem dois tipos de templates editáveis:

1. **Templates de Relatório PDF** — controlam o visual e os textos do relatório de impacto ESG em PDF
2. **Templates de Conteúdos para Redes** — controlam os textos gerados automaticamente para LinkedIn, Instagram e comunicação interna

Ambos ficam em `src/templates/` e podem ser editados sem alterar o código principal.

---

## 1. Templates de Relatório PDF

### Ficheiro: `src/templates/reportTemplates.ts`

### Como criar um novo template:

Adiciona um novo objeto ao array `reportTemplates`:

```ts
{
  id: 'meu-template',          // identificador único
  name: 'O Meu Template',      // nome visível para o utilizador
  accent: '#1a1a2e',            // cor principal (header, títulos)
  subAccent: '#e94560',         // cor secundária (destaques, linhas)
  background: '#ffffff',        // cor de fundo das páginas
  note: 'Descrição para o utilizador.',

  // Secções do PDF — desativa ou reordena
  sections: [
    { id: 'cover',    label: 'Capa',                      enabled: true },
    { id: 'toc',      label: 'Índice',                    enabled: true },
    { id: 'summary',  label: 'Sumário Executivo',         enabled: true },
    { id: 'overview', label: 'A Empresa & A Instituição', enabled: true },
    { id: 'scores',   label: 'Impact Score & Rating',     enabled: true },
    { id: 'sdg',      label: 'Alinhamento com os ODS',    enabled: true },
    { id: 'needs',    label: 'Necessidades Apoiadas',     enabled: true },
    { id: 'gallery',  label: 'Galeria do Projeto',        enabled: true },
    { id: 'fiscal',   label: 'Dados Fiscais & IRC',       enabled: true },
  ],

  // Textos da capa
  coverTitle: 'Relatório\nde Impacto',
  coverSubtitle: 'Donativo ao abrigo da Lei do Mecenato',

  // Texto do bloco "Sobre" no índice
  aboutText: 'Este relatório foi gerado para {{empresa}} com base no donativo a {{instituicao}}.',

  // Rodapé
  footerText: 'Lei do Mecenato  •  Relatório de Impacto',

  // Disclaimer legal
  disclaimer: 'Este relatório foi gerado pela plataforma Lei do Mecenato...',
}
```

### Placeholders disponíveis nos textos:

| Placeholder | Descrição | Exemplo |
|---|---|---|
| `{{empresa}}` | Nome da empresa doadora | TechGlobal Portugal, SA |
| `{{instituicao}}` | Nome da instituição | Associação Crescer Juntos |
| `{{donativo}}` | Valor do donativo | 10.000 |
| `{{data}}` | Data do donativo | 15/01/2025 |
| `{{rating}}` | Rating ESG | AA |
| `{{score}}` | Score total | 78 |
| `{{beneficiarios}}` | N.º de beneficiários | 1.200 |
| `{{ods_principal}}` | ODS principal | ODS 4 |
| `{{cobertura}}` | % de cobertura do projeto | 40.0 |
| `{{deducao_irc}}` | Dedução IRC | 14.000 |
| `{{poupanca}}` | Poupança fiscal | 2.940 |
| `{{relatorio_id}}` | Código do relatório | IMP-1234567890 |

### Notas:
- As cores do ODS principal sobrepõem-se automaticamente às cores do template
- Para desativar uma secção, coloca `enabled: false` no array de secções
- O `coverTitle` aceita `\n` para quebra de linha

---

## 2. Templates de Conteúdos para Redes Sociais

### Ficheiro: `src/templates/socialTemplates.ts`

### Templates existentes:

| ID | Nome | Tom |
|---|---|---|
| `formal` | Institucional Formal | Corporativo, focado em dados |
| `storytelling` | Storytelling | Narrativo, emocional |
| `data-driven` | Dados e Métricas | KPIs e números, para relatório de sustentabilidade |

### Como criar um novo template:

Adiciona um novo objeto ao array `socialTemplates`:

```ts
{
  id: 'meu-social',
  name: 'O Meu Template Social',
  description: 'Descrição do tom e estilo.',
  linkedin: {
    title: 'Título do post LinkedIn',
    body: 'Texto com {{empresa}} e {{beneficiarios}}...',
    hashtags: ['ESG', 'LeiDoMecenato'],
    callToAction: 'Saiba mais no nosso site.',
  },
  instagram: {
    title: 'Título Instagram',
    body: 'Texto curto...',
    hashtags: ['Impacto', 'Portugal'],
    callToAction: 'Link na bio.',
  },
  internalComms: {
    title: 'Comunicação Interna',
    body: 'Texto longo para email...',
    hashtags: [],
    callToAction: 'Relatório na intranet.',
  },
}
```

### Placeholders adicionais para redes:

| Placeholder | Descrição | Exemplo |
|---|---|---|
| `{{ods_numeros}}` | Lista de ODS | ODS 4, ODS 10, ODS 13 |
| `{{necessidade_1}}` | 1.ª necessidade | Educação › Material Escolar |
| `{{necessidade_2}}` | 2.ª necessidade | Saúde › Saúde Mental |
| `{{ano}}` | Ano corrente | 2025 |

Todos os outros placeholders do relatório estão igualmente disponíveis.

### Função de geração:

```ts
import { generateSocialContent } from './templates/socialTemplates'

const content = generateSocialContent(report, 'storytelling')
// content.linkedin.title → "Uma história de impacto real"
// content.linkedin.body → texto com placeholders preenchidos
// content.instagram.hashtags → "#Impacto #MudançaReal ..."
// content.internal.body → email para colaboradores
```

---

## Resumo

| O que queres mudar | Onde mexer |
|---|---|
| Cores do PDF | `reportTemplates.ts` → `accent`, `subAccent` |
| Textos da capa do PDF | `reportTemplates.ts` → `coverTitle`, `coverSubtitle` |
| Secções do PDF | `reportTemplates.ts` → `sections[]` |
| Disclaimer do PDF | `reportTemplates.ts` → `disclaimer` |
| Post LinkedIn | `socialTemplates.ts` → `linkedin.body` |
| Post Instagram | `socialTemplates.ts` → `instagram.body` |
| Email interno | `socialTemplates.ts` → `internalComms.body` |
| Hashtags | `socialTemplates.ts` → `hashtags[]` |
| Adicionar novo template | Adicionar objeto ao array correspondente |
