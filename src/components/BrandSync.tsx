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
    description: 'Plataforma para empresas encontrarem instituições elegíveis, simularem benefícios fiscais em IRC e gerarem relatórios de impacto ESG ao abrigo da Lei do Mecenato.',
    keywords: 'lei do mecenato, donativos empresas, benefícios fiscais IRC, relatório ESG, impacto social, IPSS Portugal',
    path: '/',
  },
  empresa: {
    title: 'Fazer Donativo Empresarial | Relatório de Impacto ESG',
    description: 'Escolha uma instituição, registe um donativo financeiro, em produtos ou serviços e pague o relatório de impacto ESG com checkout seguro.',
    keywords: 'donativo empresarial, relatório de impacto, responsabilidade social empresas, donativos em produtos, ESG',
    path: '/empresa/donativo',
  },
  instituicao: {
    title: 'Registar Instituição | Receber Donativos de Empresas',
    description: 'Registe uma instituição, apresente projetos, necessidades, ODS, IBAN e documentação para receber apoio de empresas mecenas.',
    keywords: 'registar instituição, receber donativos, IPSS, projetos sociais, ODS, mecenato',
    path: '/instituicao/registo',
  },
  empresas: {
    title: 'Empresas Mecenas | Donativos com Benefício Fiscal e Impacto ESG',
    description: 'Encontre instituições, apoie projetos sociais e documente o impacto do donativo com dados ESG, ODS e simulação fiscal.',
    keywords: 'empresas mecenas, responsabilidade social, benefícios fiscais, donativos IRC',
    path: '/empresas',
  },
  instituicoes: {
    title: 'Instituicoes Elegiveis | Projetos para Mecenato Empresarial',
    description: 'Conheça instituições e projetos que procuram apoio empresarial financeiro, em produtos ou serviços ao abrigo da Lei do Mecenato.',
    keywords: 'instituições elegíveis, IPSS, fundações, associações, projetos sociais',
    path: '/instituicoes',
  },
  relatorios: {
    title: 'Relatórios de Impacto ESG para Donativos',
    description: 'Relatórios de impacto para donativos empresariais com Impact Score, ODS, dados fiscais, evidências, narrativa ESG e pack de comunicação.',
    keywords: 'relatório ESG, relatório de impacto, Impact Score, ODS, sustentabilidade empresarial',
    path: '/relatorios',
  },
  simulador: {
    title: 'Simulador Lei do Mecenato | Dedução IRC de Donativos',
    description: 'Simule donativos financeiros, em produtos ou serviços e veja dedução fiscal, poupança estimada, custo real e valor para projetos sociais.',
    keywords: 'simulador lei do mecenato, dedução IRC, benefício fiscal donativos, simulador donativos',
    path: '/simulador',
  },
  'lei-mecenato': {
    title: 'Lei do Mecenato em Portugal | Benefícios Fiscais e Documentos',
    description: 'Resumo prático do regime fiscal do mecenato, artigo 62.º do EBF, documentos necessários, checklist RGPD e validação contabilística.',
    keywords: 'lei do mecenato Portugal, estatuto benefícios fiscais, artigo 62 EBF, documentos donativo',
    path: '/lei-do-mecenato',
  },
  'impacto-real': {
    title: 'Impacto Real | Histórias, Projetos e Métricas de Donativos',
    description: 'Veja projetos concluídos, donativos confirmados, instituições apoiadas, ODS, beneficiários e resultados de impacto.',
    keywords: 'impacto real, projetos sociais, ODS, donativos confirmados, resultados impacto',
    path: '/impacto-real',
  },
  projeto: {
    title: 'Projeto Social para Apoiar | Lei do Mecenato',
    description: 'Página de projeto com resumo executivo, instituição, contactos, ODS, metas, progresso de financiamento e acesso ao donativo empresarial.',
    keywords: 'projeto social, apoiar instituição, donativo empresa, ODS, impacto social',
    path: '/projetos',
  },
  faq: {
    title: 'FAQ | Lei do Mecenato, Donativos, IRC, ESG e RGPD',
    description: 'Perguntas frequentes sobre Lei do Mecenato, donativos empresariais, instituições, relatórios de impacto ESG, RGPD, pagamentos e dedução fiscal em IRC.',
    keywords: 'FAQ lei do mecenato, perguntas frequentes donativos, IRC, RGPD, ESG',
    path: '/faq',
  },
  privacidade: {
    title: 'Política de Privacidade e RGPD',
    description: 'Política de privacidade da plataforma, com informação sobre dados tratados, bases legais, direitos RGPD, conservação, segurança e CNPD.',
    path: '/privacidade',
  },
  termos: {
    title: 'Termos de Servico | Lei do Mecenato',
    description: 'Termos de utilização da plataforma para empresas, instituições e administradores, incluindo responsabilidades, documentos, dados e relatórios.',
    path: '/termos',
  },
  cookies: {
    title: 'Política de Cookies e Armazenamento Local',
    description: 'Informação sobre cookies necessários, armazenamento local, tecnologias semelhantes, consentimento e enquadramento RGPD.',
    path: '/cookies',
  },
  login: {
    title: 'Entrar ou Registar | Empresas e Instituições',
    description: 'Crie conta como empresa ou instituição para gerir donativos, documentos, comprovativos, chats e relatórios ESG.',
    path: '/entrar',
    noindex: true,
  },
  'area-privada': {
    title: 'Área Privada',
    description: 'Área reservada para empresas e instituições gerirem donativos, documentos, comprovativos e relatórios ESG.',
    path: '/area-privada',
    noindex: true,
  },
  admin: {
    title: 'Administração',
    description: 'Área de administração da plataforma.',
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
          text: 'Não. O donativo vai 100% da empresa para a instituição. A plataforma cobra apenas o serviço de relatório de impacto.',
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
    name: 'Packs de Relatório de Impacto',
    itemListElement: [
      {
        '@type': 'Product',
        position: 1,
        name: 'Relatório de Impacto',
        description: 'Relatório PDF de impacto para donativos empresariais.',
        offers: { '@type': 'Offer', price: '150', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 2,
        name: 'Relatório de Impacto Premium',
        description: 'Relatório premium com análise ESG, ODS, narrativa e evidências.',
        offers: { '@type': 'Offer', price: '250', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'Product',
        position: 3,
        name: 'Relatório de Impacto Premium + Pack Redes Sociais',
        description: 'Relatório premium com pack de comunicação para redes sociais.',
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
