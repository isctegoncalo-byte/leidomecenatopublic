// 17 ODS — Objetivos de Desenvolvimento Sustentável.
// O site tenta carregar primeiro as imagens oficiais no Supabase Storage.
// Se não existirem ou o bucket não estiver público, usa o fallback local/visual.

export interface SdgInfo {
  n: number
  label: string          // texto exato do tile oficial
  fullLabel: string
  color: string
  icon: string
  url: string
  imgUrl: string
  imgUrls: string[]
}

const localImg = (n: number) => `/images/ods/ods-${String(n).padStart(2, '0')}.png`

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const odsBucket = import.meta.env.VITE_SUPABASE_ODS_BUCKET || 'images'
const odsFolder = import.meta.env.VITE_SUPABASE_ODS_FOLDER || 'ODS'
const odsFile = (n: number) => `ods-${n}-pt.png`
const supabaseImg = (n: number) => {
  if (!supabaseUrl) return ''
  const base = supabaseUrl.replace(/\/$/, '')
  const path = [odsFolder.replace(/^\/|\/$/g, ''), odsFile(n)].filter(Boolean).join('/')
  return `${base}/storage/v1/object/public/${odsBucket}/${path}`
}

const IMG_URLS = (n: number) => [supabaseImg(n), localImg(n)].filter(Boolean)
const IMG = (n: number) => IMG_URLS(n)[0]

export const SDG_DATA: SdgInfo[] = [
  { n: 1,  label: 'ERRADICAÇÃO\nDA POBREZA',                fullLabel: 'Erradicação da Pobreza',                          color: '#E5243B', icon: '👨‍👩‍👧‍👦', url: 'https://unric.org/pt/ods-1/', imgUrl: IMG(1), imgUrls: IMG_URLS(1) },
  { n: 2,  label: 'ACABAR\nCOM A FOME',                      fullLabel: 'Fome Zero e Agricultura Sustentável',             color: '#DDA63A', icon: '🍲',       url: 'https://unric.org/pt/ods-2/', imgUrl: IMG(2), imgUrls: IMG_URLS(2) },
  { n: 3,  label: 'VIDA\nSAUDÁVEL',                          fullLabel: 'Saúde e Bem-Estar',                               color: '#4C9F38', icon: '💚',       url: 'https://unric.org/pt/ods-3/', imgUrl: IMG(3), imgUrls: IMG_URLS(3) },
  { n: 4,  label: 'EDUCAÇÃO\nDE QUALIDADE',                  fullLabel: 'Educação de Qualidade',                           color: '#C5192D', icon: '📖',       url: 'https://unric.org/pt/ods-4/', imgUrl: IMG(4), imgUrls: IMG_URLS(4) },
  { n: 5,  label: 'IGUALDADE\nDE GÉNERO',                    fullLabel: 'Igualdade de Género',                             color: '#FF3A21', icon: '⚧',       url: 'https://unric.org/pt/ods-5/', imgUrl: IMG(5), imgUrls: IMG_URLS(5) },
  { n: 6,  label: 'ÁGUA E\nSANEAMENTO',                      fullLabel: 'Água Potável e Saneamento',                       color: '#26BDE2', icon: '💧',       url: 'https://unric.org/pt/ods-6/', imgUrl: IMG(6), imgUrls: IMG_URLS(6) },
  { n: 7,  label: 'ENERGIA ACESSÍVEL\nE LIMPA',              fullLabel: 'Energias Renováveis e Acessíveis',                color: '#FCC30B', icon: '☀️',       url: 'https://unric.org/pt/ods-7/', imgUrl: IMG(7), imgUrls: IMG_URLS(7) },
  { n: 8,  label: 'TRABALHO DECENTE E\nCRESCIMENTO\nECONÓMICO', fullLabel: 'Trabalho Digno e Crescimento Económico',     color: '#A21942', icon: '📈',       url: 'https://unric.org/pt/ods-8/', imgUrl: IMG(8), imgUrls: IMG_URLS(8) },
  { n: 9,  label: 'INOVAÇÃO E\nINFRAESTRUTURAS',             fullLabel: 'Inovação e Infraestruturas',                      color: '#FD6925', icon: '🏗️',       url: 'https://unric.org/pt/ods-9/', imgUrl: IMG(9), imgUrls: IMG_URLS(9) },
  { n: 10, label: 'REDUZIR AS\nDESIGUALDADES',               fullLabel: 'Reduzir as Desigualdades',                        color: '#DD1367', icon: '⚖️',       url: 'https://unric.org/pt/ods-10/', imgUrl: IMG(10), imgUrls: IMG_URLS(10) },
  { n: 11, label: 'CIDADES E\nCOMUNIDADES\nSUSTENTÁVEIS',    fullLabel: 'Cidades e Comunidades Sustentáveis',              color: '#FD9D24', icon: '🏙️',       url: 'https://unric.org/pt/ods-11/', imgUrl: IMG(11), imgUrls: IMG_URLS(11) },
  { n: 12, label: 'CONSUMO E\nPRODUÇÃO\nRESPONSÁVEIS',       fullLabel: 'Consumo e Produção Responsáveis',                 color: '#BF8B2E', icon: '♾️',       url: 'https://unric.org/pt/ods-12/', imgUrl: IMG(12), imgUrls: IMG_URLS(12) },
  { n: 13, label: 'AÇÃO CONTRA A\nMUDANÇA GLOBAL\nDO CLIMA', fullLabel: 'Ação Contra a Mudança Global do Clima',          color: '#3F7E44', icon: '🌍',       url: 'https://unric.org/pt/ods-13/', imgUrl: IMG(13), imgUrls: IMG_URLS(13) },
  { n: 14, label: 'VIDA NA\nÁGUA',                          fullLabel: 'Vida na Água',                                    color: '#0A97D9', icon: '🐟',       url: 'https://unric.org/pt/ods-14/', imgUrl: IMG(14), imgUrls: IMG_URLS(14) },
  { n: 15, label: 'VIDA\nTERRESTRE',                        fullLabel: 'Vida Terrestre',                                 color: '#56C02B', icon: '🌳',       url: 'https://unric.org/pt/ods-15/', imgUrl: IMG(15), imgUrls: IMG_URLS(15) },
  { n: 16, label: 'PAZ, JUSTIÇA E\nINSTITUIÇÕES\nEFICAZES',  fullLabel: 'Paz, Justiça e Instituições Eficazes',           color: '#00689D', icon: '🕊️',       url: 'https://unric.org/pt/ods-16/', imgUrl: IMG(16), imgUrls: IMG_URLS(16) },
  { n: 17, label: 'PARCERIAS PARA O\nDESENVOLVIMENTO',       fullLabel: 'Parcerias para o Desenvolvimento',              color: '#19486A', icon: '🤝',       url: 'https://unric.org/pt/ods-17/', imgUrl: IMG(17), imgUrls: IMG_URLS(17) },
]
