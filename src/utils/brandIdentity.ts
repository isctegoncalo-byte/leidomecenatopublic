// Kit de Identidade da Marca — Lei do Mecenato
// Os valores aqui guardados são aplicados automaticamente
// nos PDFs gerados, nas imagens sociais e nos documentos.

const BRAND_KEY = 'leidomecenato_brand_identity'

export interface BrandIdentity {
  // Identidade básica
  name: string
  tagline: string
  description: string

  // Logo
  logoUrl: string
  logoMonoUrl: string  // versão monocromática (opcional)

  // Cores
  primaryColor: string       // cor principal (header, títulos)
  secondaryColor: string     // cor de destaque
  accentColor: string        // cor de acento (CTAs, ícones)
  textColor: string
  backgroundColor: string

  // Paleta secundária (3 cores adicionais)
  paletteSecondary: string[]

  // Tipografia
  primaryFont: string        // família de fonte para títulos
  secondaryFont: string      // família de fonte para corpo
  fontSizeBase: number       // tamanho base em px (referencial)

  // Comunicação
  voiceTone: string          // tom de comunicação
  keyMessages: string[]      // 3-5 mensagens-chave

  // Regras
  doRules: string[]          // o que fazer
  dontRules: string[]        // o que não fazer

  // Contactos
  contactEmail: string
  contactPhone: string
  website: string


  // Disclaimer base
  legalDisclaimer: string
}

export const DEFAULT_BRAND: BrandIdentity = {
  name: 'Lei do Mecenato',
  tagline: 'Relatórios de Impacto de Donativos',
  description: 'Plataforma independente que produz relatórios de impacto sobre donativos feitos ao abrigo da Lei do Mecenato. O donativo vai sempre, na totalidade, da empresa para a instituição.',

  logoUrl: '/images/logo-leidomecenato-official.svg',
  logoMonoUrl: '',

  primaryColor: '#0f172a',
  secondaryColor: '#2563eb',
  accentColor: '#fbbf24',
  textColor: '#1e293b',
  backgroundColor: '#ffffff',

  paletteSecondary: ['#16a34a', '#7c3aed', '#db2777'],

  primaryFont: 'Helvetica',
  secondaryFont: 'Helvetica',
  fontSizeBase: 14,

  voiceTone: 'Profissional, claro, transparente e orientado a dados. Tom institucional mas acessível. Sem jargão técnico desnecessário.',
  keyMessages: [
    'O donativo vai 100% da empresa para a instituição',
    'Dedução de 140% no IRC ao abrigo da Lei do Mecenato',
    'Impacto medido, reportado e verificável',
    'Iniciativa privada independente — não somos um organismo público',
    'Modelo Win-Win-Win: empresa, instituição e sociedade ganham',
  ],

  doRules: [
    'Usar sempre o logótipo oficial sem modificações',
    'Manter as cores principais (#0f172a, #2563eb)',
    'Comunicar com transparência e dados verificáveis',
    'Reforçar a independência da plataforma',
    'Mencionar que o donativo vai 100% à instituição',
  ],
  dontRules: [
    'Apresentar como organismo público ou oficial',
    'Sugerir que somos uma entidade certificadora',
    'Esticar, distorcer ou alterar cores do logótipo',
    'Usar tons sensacionalistas ou de "caridade"',
    'Omitir o caráter privado e independente da plataforma',
  ],

  contactEmail: 'info@leidomecenato.pt',
  contactPhone: '+351 210 000 000',
  website: 'www.leidomecenato.pt',


  legalDisclaimer: 'A Lei do Mecenato é uma iniciativa privada independente, sem qualquer vínculo a organismos públicos. Não é uma entidade certificadora oficial. Os benefícios fiscais devem ser confirmados com um TOC ao abrigo do artigo 62.º do Código do IRC.',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch { return fallback }
}

export function getBrandIdentity(): BrandIdentity {
  const brand = readJson<BrandIdentity>(BRAND_KEY, DEFAULT_BRAND)
  if (!brand.logoUrl || brand.logoUrl === '/images/logo-lei-do-mecenato.png') {
    brand.logoUrl = DEFAULT_BRAND.logoUrl
  }
  return brand
}

export function saveBrandIdentity(brand: BrandIdentity) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(brand))
}

export function resetBrandIdentity() {
  localStorage.removeItem(BRAND_KEY)
}
