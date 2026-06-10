import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PUBLIC = path.join(ROOT, 'public')
const TMP = path.join(ROOT, '.seo-tmp')
const BASE_URL = 'https://leidomecenato.pt'
const DEFAULT_IMAGE = `${BASE_URL}/images/logo-leidomecenato-official.svg`
const TODAY = new Date().toISOString().slice(0, 10)

const publicRoutes = [
  {
    path: '/',
    title: 'Lei do Mecenato',
    description: 'Plataforma para empresas encontrarem projetos elegiveis, simularem beneficios fiscais em IRC e documentarem impacto social ao abrigo da Lei do Mecenato.',
    keywords: 'lei do mecenato, donativos empresas, beneficios fiscais IRC, impacto social, projetos sociais, IPSS Portugal',
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/lei-do-mecenato',
    title: 'Lei do Mecenato em Portugal',
    description: 'Resumo pratico do regime fiscal do mecenato, documentos necessarios, recibo de donativo, artigo 62 do Codigo do IRC e validacao contabilistica.',
    keywords: 'lei do mecenato Portugal, artigo 62 Codigo IRC, beneficios fiscais donativos, recibo donativo',
    priority: '0.95',
    changefreq: 'monthly',
    schemaType: 'Article',
  },
  {
    path: '/simulador',
    title: 'Simulador de Donativos',
    description: 'Simule donativos financeiros, em produtos ou servicos, e veja beneficio fiscal, custo real estimado e valor entregue ao projeto.',
    keywords: 'simulador lei do mecenato, deducao IRC, beneficio fiscal donativos, simulador donativos',
    priority: '0.95',
    changefreq: 'monthly',
  },
  {
    path: '/empresa/donativo',
    title: 'Donativo Empresarial',
    description: 'Escolha um projeto, registe um donativo financeiro, em produtos ou servicos, e documente o impacto gerado pela empresa mecenas.',
    keywords: 'donativo empresarial, responsabilidade social empresas, relatorio de impacto, donativos em produtos, ESG',
    priority: '0.95',
    changefreq: 'weekly',
  },
  {
    path: '/instituicao/registo',
    title: 'Registar Instituicao',
    description: 'Registe uma instituicao, apresente projetos, necessidades, ODS, KPI e documentacao para receber apoio de empresas mecenas.',
    keywords: 'registar instituicao, receber donativos, IPSS, associacoes, fundacoes, projetos sociais, ODS',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/empresas',
    title: 'Empresas Mecenas',
    description: 'Encontre projetos sociais para apoiar, acompanhe o donativo e documente impacto com dados, ODS e evidencias.',
    keywords: 'empresas mecenas, responsabilidade social, beneficios fiscais, donativos IRC',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/instituicoes',
    title: 'Projetos e Instituicoes',
    description: 'Conheca instituicoes e projetos que procuram apoio empresarial financeiro, em produtos ou servicos, ao abrigo da Lei do Mecenato.',
    keywords: 'instituicoes elegiveis, IPSS, fundacoes, associacoes, projetos sociais, mecenato empresarial',
    priority: '0.9',
    changefreq: 'weekly',
    schemaType: 'CollectionPage',
  },
  {
    path: '/relatorios',
    title: 'Relatorios de Impacto',
    description: 'Relatorios de impacto para donativos empresariais com metricas, ODS, dados fiscais, evidencias e narrativa de comunicacao.',
    keywords: 'relatorio de impacto, relatorio ESG, metricas de impacto, ODS, sustentabilidade empresarial',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/historias-de-impacto',
    title: 'Historias de Impacto',
    description: 'Veja donativos concluidos, projetos apoiados, galerias de fotografias, instituicoes beneficiarias, mecenas, ODS e resultados de impacto.',
    keywords: 'historias de impacto, projetos sociais, ODS, donativos confirmados, resultados impacto',
    priority: '0.8',
    changefreq: 'weekly',
    schemaType: 'CollectionPage',
  },
  {
    path: '/faq',
    title: 'FAQ Lei do Mecenato',
    description: 'Perguntas frequentes sobre Lei do Mecenato, donativos empresariais, instituicoes, relatorios de impacto, RGPD, pagamentos e deducao fiscal em IRC.',
    keywords: 'FAQ lei do mecenato, perguntas frequentes donativos, IRC, RGPD, relatorio de impacto',
    priority: '0.7',
    changefreq: 'monthly',
    schemaType: 'FAQPage',
  },
  {
    path: '/privacidade',
    title: 'Politica de Privacidade e RGPD',
    description: 'Politica de privacidade da plataforma, com informacao sobre dados tratados, bases legais, direitos RGPD, conservacao e seguranca.',
    keywords: 'privacidade, RGPD, protecao de dados, leidomecenato',
    priority: '0.45',
    changefreq: 'yearly',
  },
  {
    path: '/termos',
    title: 'Termos de Servico',
    description: 'Termos de utilizacao da plataforma para empresas, instituicoes e administradores, incluindo responsabilidades, documentos, dados e relatorios.',
    keywords: 'termos de servico, plataforma lei do mecenato, responsabilidades',
    priority: '0.45',
    changefreq: 'yearly',
  },
  {
    path: '/cookies',
    title: 'Politica de Cookies',
    description: 'Informacao sobre cookies necessarios, armazenamento local, tecnologias semelhantes, consentimento e enquadramento RGPD.',
    keywords: 'cookies, armazenamento local, RGPD, consentimento',
    priority: '0.4',
    changefreq: 'yearly',
  },
]

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncate(value, max = 155) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}...`
}

function absoluteUrl(value) {
  if (!value) return DEFAULT_IMAGE
  if (/^https?:\/\//i.test(value)) return value
  return `${BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function routeUrl(route) {
  return `${BASE_URL}${route.path === '/' ? '/' : route.path}`
}

function replaceOrInsert(html, regex, tag) {
  if (regex.test(html)) return html.replace(regex, tag)
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

function setTitle(html, title) {
  return replaceOrInsert(html, /<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
}

function compactTitle(title) {
  const suffix = 'leidomecenato.pt'
  const cleanTitle = String(title || '').replace(/\s*\|\s*leidomecenato\.pt$/i, '').trim()
  if (!cleanTitle || cleanTitle.toLowerCase() === suffix) return suffix
  const fullTitle = `${cleanTitle} | ${suffix}`
  if (fullTitle.length <= 58) return fullTitle
  const titleBudget = Math.max(24, 58 - suffix.length - 3)
  return `${cleanTitle.slice(0, titleBudget).trim()} | ${suffix}`
}

function setMeta(html, attr, name, content) {
  const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${name}["'][^>]*>`, 'i')
  return replaceOrInsert(html, regex, `<meta ${attr}="${esc(name)}" content="${esc(content)}" />`)
}

function setLink(html, rel, href, extra = '') {
  const key = extra ? `${rel}${extra}` : rel
  const regex = extra
    ? new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*${extra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`, 'i')
    : new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i')
  const attrs = extra ? ` ${extra}` : ''
  return replaceOrInsert(html, regex, `<link rel="${esc(rel)}" href="${esc(href)}"${attrs} />`.replace(key, key))
}

function schemaBase() {
  return {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'leidomecenato.pt',
      url: `${BASE_URL}/`,
      logo: DEFAULT_IMAGE,
      email: 'geral@leidomecenato.pt',
      areaServed: { '@type': 'Country', name: 'Portugal' },
    },
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'leidomecenato.pt',
      url: `${BASE_URL}/`,
      inLanguage: 'pt-PT',
    },
  }
}

function routeSchemas(route) {
  const { organization, website } = schemaBase()
  const canonical = routeUrl(route)
  const page = {
    '@context': 'https://schema.org',
    '@type': route.schemaType || 'WebPage',
    name: route.title,
    headline: route.title,
    description: route.description,
    url: canonical,
    inLanguage: 'pt-PT',
    isPartOf: { '@type': 'WebSite', name: 'leidomecenato.pt', url: `${BASE_URL}/` },
    publisher: organization,
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: route.title, item: canonical },
    ],
  }
  return [organization, website, page, breadcrumb, ...(route.extraSchemas || [])]
}

function fallbackHtml(route) {
  const links = publicRoutes
    .filter(item => item.path !== route.path)
    .slice(0, 6)
    .map(item => `<li><a href="${esc(item.path)}">${esc(item.title)}</a></li>`)
    .join('')
  const details = route.details?.length
    ? `<ul>${route.details.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    : ''

  return [
    '<main style="max-width:960px;margin:48px auto;padding:0 24px;font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">',
    `<p style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb">leidomecenato.pt</p>`,
    `<h1>${esc(route.title)}</h1>`,
    `<p>${esc(route.description)}</p>`,
    details,
    links ? `<nav aria-label="Paginas principais"><ul>${links}</ul></nav>` : '',
    '</main>',
  ].join('')
}

function injectSeo(html, route) {
  const canonical = routeUrl(route)
  const fullTitle = compactTitle(route.title)
  const image = absoluteUrl(route.image)
  let out = html

  out = out
    .replace(/(href|src)="\.\/(favicon\.svg|site\.webmanifest|images\/)/g, '$1="/$2')

  out = setTitle(out, fullTitle)
  out = setMeta(out, 'name', 'description', route.description)
  out = setMeta(out, 'name', 'keywords', route.keywords)
  out = setMeta(out, 'name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
  out = setMeta(out, 'name', 'googlebot', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
  out = setMeta(out, 'property', 'og:title', fullTitle)
  out = setMeta(out, 'property', 'og:description', route.description)
  out = setMeta(out, 'property', 'og:url', canonical)
  out = setMeta(out, 'property', 'og:type', route.schemaType === 'Article' ? 'article' : 'website')
  out = setMeta(out, 'property', 'og:image', image)
  out = setMeta(out, 'property', 'og:image:secure_url', image)
  out = setMeta(out, 'property', 'og:image:alt', route.title)
  out = setMeta(out, 'name', 'twitter:title', fullTitle)
  out = setMeta(out, 'name', 'twitter:description', route.description)
  out = setMeta(out, 'name', 'twitter:image', image)
  out = setMeta(out, 'name', 'twitter:image:alt', route.title)
  out = setLink(out, 'canonical', canonical)
  out = setLink(out, 'alternate', canonical, 'hreflang="pt-PT"')
  out = setLink(out, 'alternate', canonical, 'hreflang="x-default"')

  const schemaBlock = routeSchemas(route)
    .map((schema, index) => `<script id="seo-prerender-${index}" type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ')

  out = out.replace(/<!-- seo-prerender:start -->[\s\S]*?<!-- seo-prerender:end -->\n?/i, '')
  out = out.replace('</head>', `    <!-- seo-prerender:start -->\n    ${schemaBlock}\n    <!-- seo-prerender:end -->\n  </head>`)
  out = out.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${fallbackHtml(route)}</div>`)

  return out
}

async function loadProjects() {
  await mkdir(TMP, { recursive: true })
  const entry = path.join(TMP, 'project-data.mjs')
  const output = path.join(TMP, 'project-data.bundle.mjs')

  await writeFile(entry, `
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { listProjectEntries, projectSlug } = await import('../src/utils/projectCatalog.ts');
export default listProjectEntries().map(({ institution, project }) => ({
  slug: projectSlug(institution, project),
  institution: {
    name: institution.name,
    category: institution.category,
    municipality: institution.municipality,
    district: institution.district,
    description: institution.description,
    logo: institution.logo
  },
  project: {
    projectName: project.projectName,
    category: project.category,
    subcategory: project.subcategory,
    description: project.description,
    executiveSummary: project.executiveSummary,
    sdgGoals: project.sdgGoals,
    projectPhotoUrls: project.projectPhotoUrls,
    requestedAmount: project.requestedAmount,
    totalProjectCost: project.totalProjectCost,
    estimatedValue: project.estimatedValue,
    beneficiaries: project.beneficiaries
  }
}));
`)

  await build({
    entryPoints: [entry],
    outfile: output,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent',
  })

  const mod = await import(`${pathToFileURL(output).href}?t=${Date.now()}`)
  await rm(TMP, { recursive: true, force: true })
  return mod.default || []
}

function projectRoute(entry) {
  const projectTitle = entry.project.projectName || `${entry.project.category}: ${entry.project.subcategory}`
  const description = truncate(entry.project.executiveSummary || entry.project.description || entry.institution.description)
  const amount = entry.project.requestedAmount || entry.project.totalProjectCost || entry.project.estimatedValue
  const ods = (entry.project.sdgGoals || []).map(goal => `ODS ${goal}`).join(', ')
  const image = entry.project.projectPhotoUrls?.[0] || entry.institution.logo || DEFAULT_IMAGE

  return {
    path: `/projeto/${entry.slug}`,
    title: `${projectTitle} | ${entry.institution.name}`,
    description,
    keywords: [
      projectTitle,
      entry.institution.name,
      entry.institution.category,
      entry.institution.municipality,
      ods,
      'Lei do Mecenato',
      'donativo empresarial',
    ].filter(Boolean).join(', '),
    image,
    priority: '0.75',
    changefreq: 'weekly',
    details: [
      entry.institution.municipality && `Localizacao: ${entry.institution.municipality}`,
      ods && `Objetivos de Desenvolvimento Sustentavel: ${ods}`,
      amount && `Valor de referencia: EUR ${Number(amount).toLocaleString('pt-PT')}`,
      entry.project.beneficiaries && `Beneficiarios estimados: ${Number(entry.project.beneficiaries).toLocaleString('pt-PT')}`,
    ].filter(Boolean),
    extraSchemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Project',
        name: projectTitle,
        description,
        url: `${BASE_URL}/projeto/${entry.slug}`,
        image: absoluteUrl(image),
        location: [entry.institution.municipality, entry.institution.district].filter(Boolean).join(', '),
        about: entry.project.sdgGoals?.map(goal => `ODS ${goal}`) || [],
        sponsor: {
          '@type': 'Organization',
          name: entry.institution.name,
        },
        ...(amount ? {
          funding: {
            '@type': 'MonetaryGrant',
            amount: {
              '@type': 'MonetaryAmount',
              value: Number(amount),
              currency: 'EUR',
            },
          },
        } : {}),
      },
    ],
  }
}

async function writeRoute(baseHtml, route) {
  const html = injectSeo(baseHtml, route)
  if (route.path === '/') {
    await writeFile(path.join(DIST, 'index.html'), html)
    return
  }
  const folder = path.join(DIST, ...route.path.split('/').filter(Boolean))
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, 'index.html'), html)
}

async function writeSitemap(routes, filePath) {
  const urls = routes
    .map(route => [
      '  <url>',
      `    <loc>${esc(routeUrl(route))}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      '  </url>',
    ].join('\n'))
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  await writeFile(filePath, xml)
}

async function main() {
  const baseHtml = await readFile(path.join(DIST, 'index.html'), 'utf8')
  const projects = await loadProjects()
  const routes = [...publicRoutes, ...projects.map(projectRoute)]

  await Promise.all(routes.map(route => writeRoute(baseHtml, route)))
  await writeSitemap(routes, path.join(DIST, 'sitemap.xml'))
  await writeSitemap(routes, path.join(PUBLIC, 'sitemap.xml'))

  console.log(`SEO prerender concluido: ${routes.length} paginas estaticas geradas; ${projects.length} projetos no sitemap.`)
}

main().catch(async error => {
  await rm(TMP, { recursive: true, force: true })
  console.error(error)
  process.exit(1)
})
