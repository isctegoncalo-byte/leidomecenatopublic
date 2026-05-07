// Importa uma pasta de identidade da marca e popula o BrandIdentity
//
// Estrutura esperada da pasta (todos os ficheiros são opcionais):
//
//   identidade-marca/
//   ├── brand.json              ← campos principais (nome, tagline, cores, fontes...)
//   ├── logo.png                ← logótipo principal
//   ├── logo-mono.png           ← logótipo monocromático (opcional)
//   ├── descricao.txt           ← descrição longa da marca (alternativa ao JSON)
//   ├── tom-de-voz.txt          ← tom de comunicação
//   ├── mensagens-chave.txt     ← uma mensagem por linha
//   ├── fazer.txt               ← regras "FAZER", uma por linha
//   ├── nao-fazer.txt           ← regras "NÃO FAZER", uma por linha
//   ├── disclaimer.txt          ← disclaimer legal base
//   └── contactos.json          ← {email, phone, website}

import { BrandIdentity } from './brandIdentity'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = reject
    r.readAsText(file)
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function fileBase(name: string) {
  // remove path e extensão
  const last = name.split(/[\\/]/).pop() || name
  return last.replace(/\.[^.]+$/, '').toLowerCase().trim()
}

export interface ImportReport {
  applied: string[]   // campos aplicados
  ignored: string[]   // ficheiros ignorados
  errors: string[]
}

export async function importBrandFolder(files: FileList | File[], current: BrandIdentity): Promise<{ brand: BrandIdentity; report: ImportReport }> {
  const list = Array.from(files)
  const brand: BrandIdentity = { ...current }
  const report: ImportReport = { applied: [], ignored: [], errors: [] }

  for (const file of list) {
    const base = fileBase(file.name)
    const ext = (file.name.split('.').pop() || '').toLowerCase()

    try {
      // ─── JSON principal ───────────────
      if (base === 'brand' && ext === 'json') {
        const text = await readFileAsText(file)
        const parsed = JSON.parse(text)
        Object.assign(brand, parsed)
        report.applied.push('brand.json (campos principais)')
        continue
      }

      // ─── JSON contactos ───────────────
      if (base === 'contactos' && ext === 'json') {
        const text = await readFileAsText(file)
        const parsed = JSON.parse(text)
        if (parsed.email)   brand.contactEmail = parsed.email
        if (parsed.phone)   brand.contactPhone = parsed.phone
        if (parsed.website) brand.website      = parsed.website
        report.applied.push('contactos.json')
        continue
      }

      // ─── JSON paleta ─────────────────
      if (base === 'paleta' && ext === 'json') {
        const text = await readFileAsText(file)
        const parsed = JSON.parse(text)
        if (parsed.primary)    brand.primaryColor   = parsed.primary
        if (parsed.secondary)  brand.secondaryColor = parsed.secondary
        if (parsed.accent)     brand.accentColor    = parsed.accent
        if (parsed.text)       brand.textColor      = parsed.text
        if (parsed.background) brand.backgroundColor = parsed.background
        if (Array.isArray(parsed.secondaryPalette)) brand.paletteSecondary = parsed.secondaryPalette
        report.applied.push('paleta.json')
        continue
      }

      // ─── LOGÓTIPOS ────────────────────
      if (base === 'logo' && ['png', 'jpg', 'jpeg', 'svg'].includes(ext)) {
        brand.logoUrl = await readFileAsDataUrl(file)
        report.applied.push('logo principal')
        continue
      }
      if ((base === 'logo-mono' || base === 'logo_mono' || base === 'logomono') && ['png', 'jpg', 'jpeg', 'svg'].includes(ext)) {
        brand.logoMonoUrl = await readFileAsDataUrl(file)
        report.applied.push('logo monocromático')
        continue
      }

      // ─── TXT — descrição ──────────────
      if (base === 'descricao' && ext === 'txt') {
        brand.description = (await readFileAsText(file)).trim()
        report.applied.push('descrição da marca')
        continue
      }

      // ─── TXT — tom de voz ────────────
      if ((base === 'tom-de-voz' || base === 'tom_de_voz' || base === 'tom') && ext === 'txt') {
        brand.voiceTone = (await readFileAsText(file)).trim()
        report.applied.push('tom de voz')
        continue
      }

      // ─── TXT — mensagens ─────────────
      if ((base === 'mensagens-chave' || base === 'mensagens') && ext === 'txt') {
        brand.keyMessages = (await readFileAsText(file)).split('\n').map(l => l.trim()).filter(Boolean)
        report.applied.push(`${brand.keyMessages.length} mensagens-chave`)
        continue
      }

      // ─── TXT — fazer / não fazer ────
      if (base === 'fazer' && ext === 'txt') {
        brand.doRules = (await readFileAsText(file)).split('\n').map(l => l.trim()).filter(Boolean)
        report.applied.push(`${brand.doRules.length} regras "FAZER"`)
        continue
      }
      if ((base === 'nao-fazer' || base === 'nao_fazer' || base === 'naofazer') && ext === 'txt') {
        brand.dontRules = (await readFileAsText(file)).split('\n').map(l => l.trim()).filter(Boolean)
        report.applied.push(`${brand.dontRules.length} regras "NÃO FAZER"`)
        continue
      }

      // ─── TXT — disclaimer ───────────
      if (base === 'disclaimer' && ext === 'txt') {
        brand.legalDisclaimer = (await readFileAsText(file)).trim()
        report.applied.push('disclaimer legal')
        continue
      }

      // ─── TXT — nome / tagline ───────
      if (base === 'nome' && ext === 'txt') {
        brand.name = (await readFileAsText(file)).trim()
        report.applied.push('nome da marca')
        continue
      }
      if ((base === 'tagline' || base === 'slogan') && ext === 'txt') {
        brand.tagline = (await readFileAsText(file)).trim()
        report.applied.push('tagline / slogan')
        continue
      }

      // Ignorado
      report.ignored.push(file.name)
    } catch (e) {
      report.errors.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { brand, report }
}

// ─── Gera um ficheiro JSON com todos os dados da marca para download ───
export function exportBrandAsJson(brand: BrandIdentity) {
  const blob = new Blob([JSON.stringify(brand, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `identidade-marca-${brand.name.toLowerCase().replace(/\s+/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

// Exporta a identidade atual como código TypeScript.
// Este ficheiro pode ser usado para substituir o DEFAULT_BRAND em src/utils/brandIdentity.ts
// ou para guardar uma cópia versionada no repositório.
export function exportBrandAsTypeScript(brand: BrandIdentity) {
  const code = `import { BrandIdentity } from './brandIdentity'

// Identidade da marca exportada a partir da área de administração.
// Data de exportação: ${new Date().toISOString()}
export const BRAND_IDENTITY: BrandIdentity = ${JSON.stringify(brand, null, 2)}
`

  const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brand-identity-${brand.name.toLowerCase().replace(/\s+/g, '-')}.ts`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

// ─── Gera um exemplo de pasta (descritivo) ───
export function downloadFolderTemplate() {
  const example = `# ESTRUTURA RECOMENDADA DA PASTA DE IDENTIDADE DA MARCA
#
# Cria uma pasta no teu computador com os seguintes ficheiros (todos opcionais).
# Em seguida, na área de administração, faz upload da pasta inteira.
#
# identidade-marca/
# ├── brand.json              ← todos os campos num único ficheiro
# ├── logo.png                ← logótipo principal
# ├── logo-mono.png           ← logótipo monocromático
# ├── descricao.txt           ← descrição longa
# ├── tom-de-voz.txt          ← tom de comunicação
# ├── mensagens-chave.txt     ← uma mensagem por linha
# ├── fazer.txt               ← regras FAZER (uma por linha)
# ├── nao-fazer.txt           ← regras NÃO FAZER (uma por linha)
# ├── disclaimer.txt          ← disclaimer legal
# ├── paleta.json             ← cores em JSON
# └── contactos.json          ← email/telefone/website

# ─── EXEMPLO brand.json ───
${JSON.stringify({
  name: 'Lei do Mecenato',
  tagline: 'Relatórios de Impacto de Donativos',
  description: 'Plataforma independente que produz relatórios de impacto...',
  primaryColor: '#0f172a',
  secondaryColor: '#2563eb',
  accentColor: '#fbbf24',
  primaryFont: 'Helvetica',
  secondaryFont: 'Helvetica',
}, null, 2)}

# ─── EXEMPLO paleta.json ───
${JSON.stringify({
  primary: '#0f172a',
  secondary: '#2563eb',
  accent: '#fbbf24',
  text: '#1e293b',
  background: '#ffffff',
  secondaryPalette: ['#16a34a', '#7c3aed', '#db2777'],
}, null, 2)}

# ─── EXEMPLO contactos.json ───
${JSON.stringify({
  email: 'info@leidomecenato.pt',
  phone: '+351 210 000 000',
  website: 'www.leidomecenato.pt',

}, null, 2)}

# ─── EXEMPLO mensagens-chave.txt ───
O donativo vai 100% da empresa para a instituição
Dedução de 140% no IRC ao abrigo da Lei do Mecenato
Impacto medido, reportado e verificável

# ─── EXEMPLO fazer.txt ───
Usar sempre o logótipo oficial sem modificações
Manter as cores principais
Comunicar com transparência

# ─── EXEMPLO nao-fazer.txt ───
Apresentar como organismo público
Distorcer cores do logótipo
Usar tons sensacionalistas
`
  const blob = new Blob([example], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'GUIA-PASTA-IDENTIDADE.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
