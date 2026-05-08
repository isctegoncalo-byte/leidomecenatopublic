import { useEffect } from 'react'
import { useBrand } from '../hooks/useBrand'
import { ViewType } from '../types'

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
}

const viewMeta: Partial<Record<ViewType, MetaConfig>> = {
  home: {
    title: 'Lei do Mecenato para Empresas | Donativos, IRC e Impacto ESG',
    description: 'Plataforma para empresas encontrarem instituicoes elegiveis, simularem beneficios fiscais em IRC e gerarem relatorios de impacto ESG ao abrigo da Lei do Mecenato.',
    keywords: 'lei do mecenato, donativos empresas, beneficios fiscais IRC, relatorio ESG, impacto social, IPSS Portugal',
    path: '/',
  },
  empresa: {
    title: 'Fazer Donativo Empresarial | Relatorio de Impacto ESG',
    description: 'Escolha uma instituicao, registe um donativo em dinheiro, produtos ou servicos e pague o relatorio de impacto ESG com checkout seguro.',
    keywords: 'donativo empresarial, relatorio de impacto, responsabilidade social empresas, donativos em produtos, ESG',
    path: '/empresa/donativo',
  },
  instituicao: {
    title: 'Registar Instituicao | Receber Donativos de Empresas',
    description: 'Registe uma instituicao, apresente projetos, necessidades, ODS, IBAN e documentacao para receber apoio de empresas mecenas.',
    keywords: 'registar instituicao, receber donativos, IPSS, projetos sociais, ODS, mecenato',
    path: '/instituicao/registo',
  },
  empresas: {
    title: 'Empresas Mecenas | Donativos com Beneficio Fiscal e Impacto ESG',
    description: 'Encontre instituicoes, apoie projetos sociais e documente o impacto do donativo com dados ESG, ODS e simulacao fiscal.',
    keywords: 'empresas mecenas, responsabilidade social, beneficios fiscais, donativos IRC',
    path: '/empresas',
  },
  instituicoes: {
    title: 'Instituicoes Elegiveis | Projetos para Mecenato Empresarial',
    description: 'Conheca instituicoes e projetos que procuram apoio empresarial em dinheiro, produtos ou servicos ao abrigo da Lei do Mecenato.',
    keywords: 'instituicoes elegiveis, IPSS, fundacoes, associacoes, projetos sociais',
    path: '/instituicoes',
  },
  relatorios: {
    title: 'Relatorios de Impacto ESG para Donativos',
    description: 'Relatorios de impacto para donativos empresariais com Impact Score, ODS, dados fiscais, evidencias, narrativa ESG e pack de comunicacao.',
    keywords: 'relatorio ESG, relatorio de impacto, Impact Score, ODS, sustentabilidade empresarial',
    path: '/relatorios',
  },
  simulador: {
    title: 'Simulador Lei do Mecenato | Deducao IRC de Donativos',
    description: 'Simule donativos em dinheiro, produtos ou servicos e veja deducao fiscal, poupanca estimada, custo real e valor para projetos sociais.',
    keywords: 'simulador lei do mecenato, deducao IRC, beneficio fiscal donativos, simulador donativos',
    path: '/simulador',
  },
  'lei-mecenato': {
    title: 'Lei do Mecenato em Portugal | Beneficios Fiscais e Documentos',
    description: 'Resumo pratico do regime fiscal do mecenato, artigo 62 do EBF, documentos necessarios, checklist RGPD e validacao contabilistica.',
    keywords: 'lei do mecenato Portugal, estatuto beneficios fiscais, artigo 62 EBF, documentos donativo',
    path: '/lei-do-mecenato',
  },
  'impacto-real': {
    title: 'Impacto Real | Historias, Projetos e Metricas de Donativos',
    description: 'Veja projetos concluidos, donativos confirmados, instituicoes apoiadas, ODS, beneficiarios e ratings de impacto.',
    keywords: 'impacto real, projetos sociais, ODS, donativos confirmados, rating impacto',
    path: '/impacto-real',
  },
  'rating-impacto': {
    title: 'Rating de Impacto | Metodologia ESG, ODS e Beneficiarios',
    description: 'Conheca a metodologia de calculo do Rating de Impacto, com criterios ESG, ODS, beneficiarios, urgencia, cobertura financeira e evidencias.',
    keywords: 'rating de impacto, metodologia ESG, Impact Score, ODS, metricas sociais',
    path: '/rating-de-impacto',
  },
  projeto: {
    title: 'Projeto Social para Apoiar | Lei do Mecenato',
    description: 'Pagina de projeto com resumo executivo, instituicao, contactos, ODS, metas, progresso de financiamento e acesso ao donativo empresarial.',
    keywords: 'projeto social, apoiar instituicao, donativo empresa, ODS, impacto social',
    path: '/projetos',
  },
  faq: {
    title: 'FAQ | Lei do Mecenato, Donativos, IRC, ESG e RGPD',
    description: 'Perguntas frequentes sobre Lei do Mecenato, donativos empresariais, instituicoes, relatorios de impacto ESG, RGPD, pagamentos e deducao fiscal em IRC.',
    keywords: 'FAQ lei do mecenato, perguntas frequentes donativos, IRC, RGPD, ESG',
    path: '/faq',
  },
  privacidade: {
    title: 'Politica de Privacidade e RGPD',
    description: 'Politica de privacidade da plataforma, com informacao sobre dados tratados, bases legais, direitos RGPD, conservacao, seguranca e CNPD.',
    path: '/privacidade',
  },
  termos: {
    title: 'Termos de Servico | Lei do Mecenato',
    description: 'Termos de utilizacao da plataforma para empresas, instituicoes e administradores, incluindo responsabilidades, documentos, dados e relatorios.',
    path: '/termos',
  },
  cookies: {
    title: 'Politica de Cookies e Armazenamento Local',
    description: 'Informacao sobre cookies necessarios, armazenamento local, tecnologias semelhantes, consentimento e enquadramento RGPD.',
    path: '/cookies',
  },
  login: {
    title: 'Entrar ou Registar | Empresas e Instituicoes',
    description: 'Crie conta como empresa ou instituicao para gerir donativos, documentos, comprovativos, chats e relatorios ESG.',
    path: '/entrar',
    noindex: true,
  },
  'area-privada': {
    title: 'Area Privada',
    description: 'Area reservada para empresas e instituicoes gerirem donativos, documentos, comprovativos e relatorios ESG.',
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

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = url
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

function pageSchema(title: string, description: string, canonical: string, view: ViewType) {
  const type = view === 'faq' ? 'FAQPage' : 'WebPage'
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description,
    url: canonical,
    inLanguage: 'pt-PT',
    isPartOf: {
      '@type': 'WebSite',
      name: 'leidomecenato.pt',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'leidomecenato.pt',
      url: BASE_URL,
      logo: DEFAULT_IMAGE,
    },
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
        name: 'Inicio',
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
          text: 'Nao. O donativo vai 100% da empresa para a instituicao. A plataforma cobra apenas o servico de relatorio de impacto.',
        },
      },
      {
        '@type': 'Question',
        name: 'Que beneficio fiscal pode existir para empresas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Determinados donativos podem beneficiar de majoracao fiscal ao abrigo do regime do mecenato. A elegibilidade concreta deve ser confirmada com contabilista ou entidade competente.',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso doar produtos ou servicos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A plataforma permite registar donativos em dinheiro, produtos ou servicos, associando-os a necessidades concretas das instituicoes.',
        },
      },
    ],
  }
}

function productSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Packs de Relatorio de Impacto',
    itemListElement: [
      {
        '@type': 'Product',
        position: 1,
        name: 'Relatorio de Impacto',
        description: 'Relatorio PDF de impacto para donativos empresariais.',
        offers: { '@type': 'Offer', price: '150', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 2,
        name: 'Relatorio de Impacto Premium',
        description: 'Relatorio premium com analise ESG, ODS, narrativa e evidencias.',
        offers: { '@type': 'Offer', price: '250', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 3,
        name: 'Relatorio de Impacto Premium + Pack Redes Sociais',
        description: 'Relatorio premium com pack de comunicacao para redes sociais.',
        offers: { '@type': 'Offer', price: '400', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
    ],
  }
}

export default function BrandSync({ view = 'home' }: Props) {
  const brand = useBrand()

  useEffect(() => {
    const meta = viewMeta[view] || viewMeta.home!
    const title = `${meta.title} | ${brand.name}`
    const path = canonicalPath(view, meta.path)
    const canonical = `${BASE_URL}${path}`

    document.title = title
    document.documentElement.lang = 'pt-PT'

    setMeta('description', meta.description)
    setMeta('robots', meta.noindex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    setMeta('googlebot', meta.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    setMeta('author', brand.name)
    setMeta('application-name', brand.name)
    if (meta.keywords) setMeta('keywords', meta.keywords)
    setCanonical(canonical)

    setMeta('og:title', title, 'property')
    setMeta('og:description', meta.description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:site_name', brand.name, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:locale', 'pt_PT', 'property')
    setMeta('og:image', DEFAULT_IMAGE, 'property')
    setMeta('og:image:alt', `${brand.name} - Lei do Mecenato`, 'property')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', meta.description)
    setMeta('twitter:image', DEFAULT_IMAGE)
    setMeta('twitter:image:alt', `${brand.name} - Lei do Mecenato`)

    setJsonLd('ld-page', pageSchema(title, meta.description, canonical, view))
    setJsonLd('ld-breadcrumb', breadcrumbSchema(meta.title, canonical))
    if (view === 'faq') setJsonLd('ld-faq', faqSchema())
    else removeJsonLd('ld-faq')
    if (view === 'relatorios' || view === 'empresa') setJsonLd('ld-products', productSchema())
    else removeJsonLd('ld-products')

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
