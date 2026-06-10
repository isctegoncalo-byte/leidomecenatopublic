import { useEffect } from 'react'
import { useBrand } from '../hooks/useBrand'
import { ViewType } from '../types'
import { findProjectEntry } from '../utils/projectCatalog'

interface Props {
  view?: ViewType
}

const BASE_URL = 'https://leidomecenato.pt'
const DEFAULT_IMAGE = `${BASE_URL}/images/logo-leidomecenato-official.svg`

type MetaConfig = {
  title: string
  description: string
  path: string
  keywords?: string
  noindex?: boolean
  schemaType?: 'WebPage' | 'CollectionPage' | 'Article' | 'FAQPage' | 'ContactPage'
  image?: string
}

const defaultKeywords = [
  'lei do mecenato',
  'mecenato Portugal',
  'donativos empresas',
  'beneficios fiscais IRC',
  'relatorio de impacto',
  'impacto social',
  'ODS',
  'IPSS Portugal',
].join(', ')

const viewMeta: Partial<Record<ViewType, MetaConfig>> = {
  home: {
    title: 'Lei do Mecenato',
    description: 'Plataforma para empresas encontrarem projetos elegiveis, simularem beneficios fiscais em IRC e documentarem impacto social ao abrigo da Lei do Mecenato.',
    keywords: 'lei do mecenato, donativos empresas, beneficios fiscais IRC, impacto social, projetos sociais, IPSS Portugal',
    path: '/',
  },
  empresa: {
    title: 'Donativo Empresarial',
    description: 'Escolha um projeto, registe um donativo financeiro, em produtos ou servicos, e documente o impacto gerado pela empresa mecenas.',
    keywords: 'donativo empresarial, responsabilidade social empresas, relatorio de impacto, donativos em produtos, ESG',
    path: '/empresa/donativo',
  },
  instituicao: {
    title: 'Registar Instituicao',
    description: 'Registe uma instituicao, apresente projetos, necessidades, ODS, KPI e documentacao para receber apoio de empresas mecenas.',
    keywords: 'registar instituicao, receber donativos, IPSS, associacoes, fundacoes, projetos sociais, ODS',
    path: '/instituicao/registo',
  },
  empresas: {
    title: 'Empresas Mecenas',
    description: 'Encontre projetos sociais para apoiar, acompanhe o donativo e documente impacto com dados, ODS e evidencias.',
    keywords: 'empresas mecenas, responsabilidade social, beneficios fiscais, donativos IRC',
    path: '/empresas',
  },
  instituicoes: {
    title: 'Projetos e Instituicoes',
    description: 'Conheca instituicoes e projetos que procuram apoio empresarial financeiro, em produtos ou servicos, ao abrigo da Lei do Mecenato.',
    keywords: 'instituicoes elegiveis, IPSS, fundacoes, associacoes, projetos sociais, mecenato empresarial',
    path: '/instituicoes',
    schemaType: 'CollectionPage',
  },
  relatorios: {
    title: 'Relatorios de Impacto',
    description: 'Relatorios de impacto para donativos empresariais com metricas, ODS, dados fiscais, evidencias e narrativa de comunicacao.',
    keywords: 'relatorio de impacto, relatorio ESG, metricas de impacto, ODS, sustentabilidade empresarial',
    path: '/relatorios',
  },
  simulador: {
    title: 'Simulador de Donativos',
    description: 'Simule donativos financeiros, em produtos ou servicos, e veja beneficio fiscal, custo real estimado e valor entregue ao projeto.',
    keywords: 'simulador lei do mecenato, deducao IRC, beneficio fiscal donativos, simulador donativos',
    path: '/simulador',
  },
  'lei-mecenato': {
    title: 'Lei do Mecenato em Portugal',
    description: 'Resumo pratico do regime fiscal do mecenato, documentos necessarios, recibo de donativo, artigo 62 do Codigo do IRC e validacao contabilistica.',
    keywords: 'lei do mecenato Portugal, artigo 62 Codigo IRC, beneficios fiscais donativos, recibo donativo',
    path: '/lei-do-mecenato',
    schemaType: 'Article',
  },
  'impacto-real': {
    title: 'Historias de Impacto',
    description: 'Veja donativos concluidos, projetos apoiados, galerias de fotografias, instituicoes beneficiarias, mecenas, ODS e resultados de impacto.',
    keywords: 'historias de impacto, projetos sociais, ODS, donativos confirmados, resultados impacto',
    path: '/historias-de-impacto',
    schemaType: 'CollectionPage',
  },
  projeto: {
    title: 'Projeto Social',
    description: 'Pagina de projeto com resumo executivo, instituicao, ODS, metas, KPI, progresso de financiamento e acesso ao donativo empresarial.',
    keywords: 'projeto social, apoiar instituicao, donativo empresa, ODS, impacto social',
    path: '/projetos',
  },
  faq: {
    title: 'FAQ Lei do Mecenato',
    description: 'Perguntas frequentes sobre Lei do Mecenato, donativos empresariais, instituicoes, relatorios de impacto, RGPD, pagamentos e deducao fiscal em IRC.',
    keywords: 'FAQ lei do mecenato, perguntas frequentes donativos, IRC, RGPD, relatorio de impacto',
    path: '/faq',
    schemaType: 'FAQPage',
  },
  privacidade: {
    title: 'Politica de Privacidade e RGPD',
    description: 'Politica de privacidade da plataforma, com informacao sobre dados tratados, bases legais, direitos RGPD, conservacao e seguranca.',
    path: '/privacidade',
  },
  termos: {
    title: 'Termos de Servico',
    description: 'Termos de utilizacao da plataforma para empresas, instituicoes e administradores, incluindo responsabilidades, documentos, dados e relatorios.',
    path: '/termos',
  },
  cookies: {
    title: 'Politica de Cookies',
    description: 'Informacao sobre cookies necessarios, armazenamento local, tecnologias semelhantes, consentimento e enquadramento RGPD.',
    path: '/cookies',
  },
  login: {
    title: 'Entrar ou Registar | Empresas e Instituicoes',
    description: 'Crie conta como empresa ou instituicao para gerir donativos, documentos, comprovativos, mensagens e relatorios.',
    path: '/entrar',
    noindex: true,
  },
  'area-privada': {
    title: 'Area Privada',
    description: 'Area reservada para empresas e instituicoes gerirem donativos, documentos, comprovativos e relatorios.',
    path: '/area-privada',
    noindex: true,
  },
  admin: {
    title: 'Administracao',
    description: 'Area de administracao da plataforma.',
    path: '/admin',
    noindex: true,
  },
}

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return DEFAULT_IMAGE
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${BASE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function truncate(value: string, max = 155) {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

function compactTitle(title: string, suffix: string) {
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cleanTitle = title.replace(new RegExp(`\\s*\\|\\s*${escapedSuffix}$`, 'i'), '').trim()
  if (!cleanTitle || cleanTitle.toLowerCase() === suffix.toLowerCase()) return suffix
  const fullTitle = `${cleanTitle} | ${suffix}`
  if (fullTitle.length <= 58) return fullTitle
  const titleBudget = Math.max(24, 58 - suffix.length - 3)
  return `${cleanTitle.slice(0, titleBudget).trim()} | ${suffix}`
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function setLink(rel: string, href: string, attrs?: Record<string, string>) {
  const selector = attrs?.hreflang ? `link[rel="${rel}"][hreflang="${attrs.hreflang}"]` : `link[rel="${rel}"]`
  let el = document.head.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
  Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value))
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove()
}

function canonicalPath(view: ViewType, fallbackPath: string) {
  if (view === 'projeto' && /^\/projetos?\//.test(window.location.pathname)) {
    return window.location.pathname
  }
  return fallbackPath
}

function currentProjectMeta(meta: MetaConfig): MetaConfig {
  const slug = window.location.pathname.split('/').filter(Boolean).pop()
  if (!slug) return meta
  const entry = findProjectEntry(slug)
  if (!entry) return meta

  const projectName = entry.project.projectName || `${entry.project.category}: ${entry.project.subcategory}`
  const description = truncate(entry.project.executiveSummary || entry.project.description || entry.institution.description)
  const image = entry.project.projectPhotoUrls?.[0] || entry.institution.logo || DEFAULT_IMAGE
  const ods = entry.project.sdgGoals.map(goal => `ODS ${goal}`).join(', ')

  return {
    ...meta,
    title: `${projectName} | ${entry.institution.name}`,
    description,
    keywords: [
      projectName,
      entry.institution.name,
      entry.institution.category,
      entry.institution.municipality,
      ods,
      'Lei do Mecenato',
      'donativo empresarial',
    ].filter(Boolean).join(', '),
    image,
    path: window.location.pathname,
  }
}

function webPageSchema(title: string, description: string, canonical: string, view: ViewType, schemaType: MetaConfig['schemaType']) {
  return {
    '@context': 'https://schema.org',
    '@type': schemaType || (view === 'impacto-real' ? 'CollectionPage' : 'WebPage'),
    name: title,
    headline: title,
    description,
    url: canonical,
    inLanguage: 'pt-PT',
    isPartOf: {
      '@type': 'WebSite',
      name: 'leidomecenato.pt',
      url: `${BASE_URL}/`,
    },
    publisher: organizationSchema(),
  }
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'leidomecenato.pt',
    url: `${BASE_URL}/`,
    logo: DEFAULT_IMAGE,
    email: 'geral@leidomecenato.pt',
    areaServed: {
      '@type': 'Country',
      name: 'Portugal',
    },
  }
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'leidomecenato.pt',
    url: `${BASE_URL}/`,
    inLanguage: 'pt-PT',
    publisher: organizationSchema(),
  }
}

function breadcrumbSchema(title: string, canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: `${BASE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title.replace(' | leidomecenato.pt', ''),
        item: canonical,
      },
    ],
  }
}

function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'A plataforma fica com alguma percentagem do donativo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Não. O donativo vai integralmente da empresa para a instituição. A plataforma cobra apenas o serviço de relatório de impacto, quando contratado.',
        },
      },
      {
        '@type': 'Question',
        name: 'Que benefício fiscal pode existir para empresas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Determinados donativos podem beneficiar de majoração fiscal ao abrigo do regime do mecenato. A elegibilidade concreta deve ser confirmada com contabilista ou entidade competente.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso doar produtos ou serviços?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A plataforma permite registar donativos financeiros, em produtos ou serviços, associando-os a necessidades concretas das instituições.',
        },
      },
    ],
  }
}

function productSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Relatórios de Impacto',
    itemListElement: [
      {
        '@type': 'Product',
        position: 1,
        name: 'Relatório de Impacto Basic',
        description: 'Relatório PDF base de impacto para donativos empresariais.',
        brand: { '@type': 'Brand', name: 'leidomecenato.pt' },
        offers: { '@type': 'Offer', price: '150', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 2,
        name: 'Relatório de Impacto Advanced',
        description: 'Relatório com Impact Score, ODS, narrativa personalizada, galeria e evidências visuais.',
        brand: { '@type': 'Brand', name: 'leidomecenato.pt' },
        offers: { '@type': 'Offer', price: '250', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 3,
        name: 'Relatório de Impacto 360º',
        description: 'Relatório de impacto com pack de comunicação para redes sociais.',
        brand: { '@type': 'Brand', name: 'leidomecenato.pt' },
        offers: { '@type': 'Offer', price: '400', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
    ],
  }
}

function projectSchema(canonical: string) {
  const slug = window.location.pathname.split('/').filter(Boolean).pop()
  if (!slug) return null
  const entry = findProjectEntry(slug)
  if (!entry) return null

  const projectName = entry.project.projectName || `${entry.project.category}: ${entry.project.subcategory}`
  const image = entry.project.projectPhotoUrls?.[0] || entry.institution.logo || DEFAULT_IMAGE
  const amount = entry.project.requestedAmount || entry.project.totalProjectCost || entry.project.estimatedValue

  return {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: projectName,
    description: truncate(entry.project.executiveSummary || entry.project.description, 240),
    url: canonical,
    image: absoluteUrl(image),
    location: [entry.institution.municipality, entry.institution.district].filter(Boolean).join(', '),
    about: entry.project.sdgGoals.map(goal => `ODS ${goal}`),
    sponsor: {
      '@type': 'Organization',
      name: entry.institution.name,
      url: canonical,
    },
    ...(amount ? {
      funding: {
        '@type': 'MonetaryGrant',
        amount: {
          '@type': 'MonetaryAmount',
          value: amount,
          currency: 'EUR',
        },
      },
    } : {}),
  }
}

export default function BrandSync({ view = 'home' }: Props) {
  const brand = useBrand()

  useEffect(() => {
    const baseMeta = viewMeta[view] || viewMeta.home!
    const meta = view === 'projeto' ? currentProjectMeta(baseMeta) : baseMeta
    const siteSuffix = brand.name || 'leidomecenato.pt'
    const title = compactTitle(meta.title, siteSuffix)
    const path = canonicalPath(view, meta.path)
    const canonical = `${BASE_URL}${path}`
    const image = absoluteUrl(meta.image || DEFAULT_IMAGE)

    document.title = title
    document.documentElement.lang = 'pt-PT'

    setMeta('description', meta.description)
    setMeta('keywords', meta.keywords || defaultKeywords)
    setMeta('robots', meta.noindex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    setMeta('googlebot', meta.noindex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    setMeta('author', siteSuffix)
    setMeta('application-name', siteSuffix)
    setMeta('language', 'pt-PT')
    setMeta('geo.region', 'PT')
    setMeta('geo.placename', 'Portugal')

    setLink('canonical', canonical)
    setLink('alternate', canonical, { hreflang: 'pt-PT' })
    setLink('alternate', canonical, { hreflang: 'x-default' })

    setMeta('og:title', title, 'property')
    setMeta('og:description', meta.description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:site_name', siteSuffix, 'property')
    setMeta('og:type', view === 'lei-mecenato' ? 'article' : 'website', 'property')
    setMeta('og:locale', 'pt_PT', 'property')
    setMeta('og:image', image, 'property')
    setMeta('og:image:secure_url', image, 'property')
    setMeta('og:image:alt', `${meta.title} - ${siteSuffix}`, 'property')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', meta.description)
    setMeta('twitter:image', image)
    setMeta('twitter:image:alt', `${meta.title} - ${siteSuffix}`)

    setJsonLd('ld-organization', organizationSchema())
    setJsonLd('ld-website', websiteSchema())
    setJsonLd('ld-page', webPageSchema(title, meta.description, canonical, view, meta.schemaType))
    setJsonLd('ld-breadcrumb', breadcrumbSchema(meta.title, canonical))

    if (view === 'faq') setJsonLd('ld-faq', faqSchema())
    else removeJsonLd('ld-faq')

    if (view === 'relatorios' || view === 'empresa') setJsonLd('ld-products', productSchema())
    else removeJsonLd('ld-products')

    const projectStructuredData = view === 'projeto' ? projectSchema(canonical) : null
    if (projectStructuredData) setJsonLd('ld-project', projectStructuredData)
    else removeJsonLd('ld-project')

    const root = document.documentElement
    root.style.setProperty('--brand-primary', brand.primaryColor)
    root.style.setProperty('--brand-secondary', brand.secondaryColor)
    root.style.setProperty('--brand-accent', brand.accentColor)
    root.style.setProperty('--brand-text', brand.textColor)
    root.style.setProperty('--brand-bg', brand.backgroundColor)
    root.style.setProperty('--brand-font-primary', brand.primaryFont)
    root.style.setProperty('--brand-font-secondary', brand.secondaryFont)
  }, [brand, view])

  return null
}
