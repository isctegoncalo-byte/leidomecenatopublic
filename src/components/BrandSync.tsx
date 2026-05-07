import { useEffect } from 'react'
import { useBrand } from '../hooks/useBrand'
import { ViewType } from '../types'

interface Props {
  view?: ViewType
}

const BASE_URL = 'https://leidomecenato.pt'

const viewMeta: Partial<Record<ViewType, { title: string; description: string; path: string; noindex?: boolean }>> = {
  home: {
    title: 'Plataforma Nacional de Donativos e Relatórios de Impacto ESG',
    description: 'Plataforma independente para empresas fazerem donativos ao abrigo da Lei do Mecenato, instituições receberem apoio e relatórios de impacto ESG serem produzidos com dados mensuráveis.',
    path: '/',
  },
  empresas: {
    title: 'Empresas Mecenas | Donativos com benefício fiscal e impacto ESG',
    description: 'Encontre instituições, faça donativos em dinheiro ou produtos/serviços e receba um Relatório de Impacto ESG do Donativo para comunicação e sustentabilidade.',
    path: '/empresas',
  },
  instituicoes: {
    title: 'Instituições | Receber donativos ao abrigo da Lei do Mecenato',
    description: 'Registe a sua instituição, detalhe necessidades, ODS, impacto esperado, IBAN e documentação para receber donativos de empresas mecenas.',
    path: '/instituicoes',
  },
  relatorios: {
    title: 'Relatórios de Impacto ESG do Donativo',
    description: 'Conheça os relatórios de impacto ESG para donativos: base, premium e premium com pack de comunicação, com Impact Score, ODS e dados fiscais.',
    path: '/relatorios',
  },
  simulador: {
    title: 'Simulador da Lei do Mecenato | Dedução IRC 140%',
    description: 'Simule donativos em dinheiro, produtos ou serviços e veja a dedução fiscal, poupança estimada e custo real para a empresa.',
    path: '/simulador',
  },
  'impacto-real': {
    title: 'Impacto Real | Histórias e métricas de donativos',
    description: 'Veja o impacto real dos donativos: valor doado, instituições apoiadas, beneficiários e relatórios produzidos.',
    path: '/impacto-real',
  },
  'rating-impacto': {
    title: 'Rating de Impacto | Metodologia de cálculo',
    description: 'Conheça a metodologia de cálculo do Rating de Impacto, incluindo ESG, ODS, beneficiários e cobertura financeira do projeto.',
    path: '/rating-de-impacto',
  },
  projeto: {
    title: 'Projeto Social | Lei do Mecenato',
    description: 'Página própria de projeto com resumo executivo, instituição, ODS, metas e acesso ao fluxo de donativo.',
    path: '/projetos',
  },
  faq: {
    title: 'FAQ | Lei do Mecenato, Donativos e Relatórios ESG',
    description: 'Perguntas frequentes sobre Lei do Mecenato, donativos empresariais, instituições, relatórios de impacto ESG, RGPD e dedução fiscal em IRC.',
    path: '/faq',
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

// Sincroniza <title>, meta tags e variáveis CSS globais
// com a identidade da marca e a página atual.
export default function BrandSync({ view = 'home' }: Props) {
  const brand = useBrand()
  useEffect(() => {
    const meta = viewMeta[view] || viewMeta.home!
    const title = `${meta.title} | ${brand.name}`
    const canonical = `${BASE_URL}${meta.path}`

    document.title = title
    setMeta('description', meta.description)
    setMeta('robots', meta.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    setCanonical(canonical)

    setMeta('og:title', title, 'property')
    setMeta('og:description', meta.description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:site_name', brand.name, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:locale', 'pt_PT', 'property')
    setMeta('og:image', `${BASE_URL}/images/logo-leidomecenato-official.svg`, 'property')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', meta.description)
    setMeta('twitter:image', `${BASE_URL}/images/logo-leidomecenato-official.svg`)

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
