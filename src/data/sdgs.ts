// 17 ODS - Objetivos de Desenvolvimento Sustentavel.
// Preferimos as imagens oficiais carregadas no Supabase Storage.
// Padrao atual: images/ODS/ods-1-pt.png ... images/ODS/ods-17-pt.png.
// Se a imagem remota falhar, cada ODS tem uma imagem SVG local gerada em data URI.

export interface SdgInfo {
  n: number
  label: string
  fullLabel: string
  color: string
  icon: string
  url: string
  imgUrl: string
  imgUrls: string[]
}

type RawSdg = Omit<SdgInfo, 'imgUrl' | 'imgUrls'>

const defaultOdsSupabaseUrl = 'https://pucqlcfqkdxznjeoihkv.supabase.co'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultOdsSupabaseUrl
const odsBucket = import.meta.env.VITE_SUPABASE_ODS_BUCKET || 'images'
const odsFolder = import.meta.env.VITE_SUPABASE_ODS_FOLDER || 'ODS'

const odsFiles = (n: number) => {
  const padded = String(n).padStart(2, '0')
  return [
    `ods-${n}-pt.png`,
    `ods-${padded}-pt.png`,
    `${padded}.png`,
    `${n}.png`,
    `${padded}.jpg`,
    `${n}.jpg`,
    `${padded}.webp`,
    `${n}.webp`,
    `ODS${padded}.png`,
    `ODS${n}.png`,
    `ods-${padded}.png`,
    `ods-${n}.png`,
    `ods_${padded}.png`,
    `ods_${n}.png`,
    `ODS_${padded}.png`,
    `ODS_${n}.png`,
    `ODS-${padded}.png`,
    `ODS-${n}.png`,
    `ODS-${padded}-PT.png`,
    `ODS-${n}-PT.png`,
    `E-WEB-Goal-${padded}.png`,
    `E-Goal-${padded}.png`,
    `S-WEB-Goal-${padded}.png`,
    `S-Goal-${padded}.png`,
  ]
}

const supabaseImg = (fileName: string) => {
  if (!supabaseUrl) return ''
  const base = supabaseUrl.replace(/\/$/, '')
  const path = [odsFolder.replace(/^\/|\/$/g, ''), fileName].filter(Boolean).join('/')
  return `${base}/storage/v1/object/public/${odsBucket}/${path}`
}

const escapeSvg = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const svgTile = (sdg: RawSdg) => {
  const lines = sdg.label.split('\n').map(escapeSvg)
  const lineY = lines.length === 1 ? [108] : lines.length === 2 ? [96, 119] : [84, 107, 130]
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="${sdg.color}"/>
      <text x="18" y="54" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900">${sdg.n}</text>
      ${lines.map((line, i) => `<text x="18" y="${lineY[i] || 130}" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="${lines.length > 2 ? 22 : 25}" font-weight="900">${line}</text>`).join('')}
      <rect x="18" y="174" width="220" height="2" fill="#fff" opacity=".55"/>
      <text x="238" y="226" text-anchor="end" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900">ODS</text>
      <text x="18" y="226" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" opacity=".9">Objetivos de Desenvolvimento Sustentavel</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const withImages = (sdg: RawSdg): SdgInfo => {
  const generated = svgTile(sdg)
  const remoteUrls = odsFiles(sdg.n).map(supabaseImg).filter(Boolean)
  const imgUrls = [...remoteUrls, generated]
  return { ...sdg, imgUrl: imgUrls[0], imgUrls }
}

const RAW_SDG_DATA: RawSdg[] = [
  { n: 1, label: 'ERRADICAR\nA POBREZA', fullLabel: 'Erradicar a Pobreza', color: '#E5243B', icon: '1', url: 'https://unric.org/pt/ods-1/' },
  { n: 2, label: 'ERRADICAR\nA FOME', fullLabel: 'Erradicar a Fome', color: '#DDA63A', icon: '2', url: 'https://unric.org/pt/ods-2/' },
  { n: 3, label: 'SAUDE\nDE QUALIDADE', fullLabel: 'Saude de Qualidade', color: '#4C9F38', icon: '3', url: 'https://unric.org/pt/ods-3/' },
  { n: 4, label: 'EDUCACAO\nDE QUALIDADE', fullLabel: 'Educacao de Qualidade', color: '#C5192D', icon: '4', url: 'https://unric.org/pt/ods-4/' },
  { n: 5, label: 'IGUALDADE\nDE GENERO', fullLabel: 'Igualdade de Genero', color: '#FF3A21', icon: '5', url: 'https://unric.org/pt/ods-5/' },
  { n: 6, label: 'AGUA POTAVEL\nE SANEAMENTO', fullLabel: 'Agua Potavel e Saneamento', color: '#26BDE2', icon: '6', url: 'https://unric.org/pt/ods-6/' },
  { n: 7, label: 'ENERGIAS\nRENOVAVEIS', fullLabel: 'Energias Renovaveis e Acessiveis', color: '#FCC30B', icon: '7', url: 'https://unric.org/pt/ods-7/' },
  { n: 8, label: 'TRABALHO DIGNO\nE CRESCIMENTO', fullLabel: 'Trabalho Digno e Crescimento Economico', color: '#A21942', icon: '8', url: 'https://unric.org/pt/ods-8/' },
  { n: 9, label: 'INDUSTRIA\nINOVACAO\nINFRAESTRUTURAS', fullLabel: 'Industria, Inovacao e Infraestruturas', color: '#FD6925', icon: '9', url: 'https://unric.org/pt/ods-9/' },
  { n: 10, label: 'REDUZIR AS\nDESIGUALDADES', fullLabel: 'Reduzir as Desigualdades', color: '#DD1367', icon: '10', url: 'https://unric.org/pt/ods-10/' },
  { n: 11, label: 'CIDADES E\nCOMUNIDADES\nSUSTENTAVEIS', fullLabel: 'Cidades e Comunidades Sustentaveis', color: '#FD9D24', icon: '11', url: 'https://unric.org/pt/ods-11/' },
  { n: 12, label: 'PRODUCAO E\nCONSUMO\nSUSTENTAVEIS', fullLabel: 'Producao e Consumo Sustentaveis', color: '#BF8B2E', icon: '12', url: 'https://unric.org/pt/ods-12/' },
  { n: 13, label: 'ACAO\nCLIMATICA', fullLabel: 'Acao Climatica', color: '#3F7E44', icon: '13', url: 'https://unric.org/pt/ods-13/' },
  { n: 14, label: 'PROTEGER\nA VIDA\nMARINHA', fullLabel: 'Proteger a Vida Marinha', color: '#0A97D9', icon: '14', url: 'https://unric.org/pt/ods-14/' },
  { n: 15, label: 'PROTEGER\nA VIDA\nTERRESTRE', fullLabel: 'Proteger a Vida Terrestre', color: '#56C02B', icon: '15', url: 'https://unric.org/pt/ods-15/' },
  { n: 16, label: 'PAZ JUSTICA\nE INSTITUICOES\nEFICAZES', fullLabel: 'Paz, Justica e Instituicoes Eficazes', color: '#00689D', icon: '16', url: 'https://unric.org/pt/ods-16/' },
  { n: 17, label: 'PARCERIAS\nPARA OS\nOBJETIVOS', fullLabel: 'Parcerias para os Objetivos', color: '#19486A', icon: '17', url: 'https://unric.org/pt/ods-17/' },
]

export const SDG_DATA: SdgInfo[] = RAW_SDG_DATA.map(withImages)
