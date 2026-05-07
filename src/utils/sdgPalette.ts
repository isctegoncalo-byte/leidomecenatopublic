// Palette for the report based on the dominant SDG of the donation.
// Each SDG produces a coordinated colour scheme.

export interface SdgPalette {
  sdg: number
  name: string
  primary: string       // dark accent (cover, headings)
  secondary: string     // light accent (rings, highlights)
  cream: string         // page background tint
  textOnPrimary: string
}

const PALETTES: Record<number, SdgPalette> = {
  1:  { sdg: 1,  name: 'Erradicação da Pobreza',     primary: '#7B1426', secondary: '#E5243B', cream: '#fff5f5', textOnPrimary: '#ffffff' },
  2:  { sdg: 2,  name: 'Fome Zero',                  primary: '#7C5C0E', secondary: '#DDA63A', cream: '#fffaf0', textOnPrimary: '#ffffff' },
  3:  { sdg: 3,  name: 'Saúde de Qualidade',         primary: '#1D5E22', secondary: '#4C9F38', cream: '#f3faf3', textOnPrimary: '#ffffff' },
  4:  { sdg: 4,  name: 'Educação de Qualidade',      primary: '#6E0E1B', secondary: '#C5192D', cream: '#fff5f5', textOnPrimary: '#ffffff' },
  5:  { sdg: 5,  name: 'Igualdade de Género',        primary: '#7A1810', secondary: '#FF3A21', cream: '#fff5f3', textOnPrimary: '#ffffff' },
  6:  { sdg: 6,  name: 'Água Potável',               primary: '#1B4F73', secondary: '#26BDE2', cream: '#f1faff', textOnPrimary: '#ffffff' },
  7:  { sdg: 7,  name: 'Energias Renováveis',        primary: '#7A5C00', secondary: '#FCC30B', cream: '#fffbe7', textOnPrimary: '#3d2f00' },
  8:  { sdg: 8,  name: 'Trabalho Digno',             primary: '#52102C', secondary: '#A21942', cream: '#fdf3f7', textOnPrimary: '#ffffff' },
  9:  { sdg: 9,  name: 'Indústria e Inovação',       primary: '#7A2A14', secondary: '#FD6925', cream: '#fff5ef', textOnPrimary: '#ffffff' },
  10: { sdg: 10, name: 'Redução das Desigualdades',  primary: '#6F0A37', secondary: '#DD1367', cream: '#fdf2f7', textOnPrimary: '#ffffff' },
  11: { sdg: 11, name: 'Cidades Sustentáveis',       primary: '#7A4E12', secondary: '#FD9D24', cream: '#fff8ef', textOnPrimary: '#ffffff' },
  12: { sdg: 12, name: 'Consumo Sustentável',        primary: '#5C4416', secondary: '#BF8B2E', cream: '#fdf8ee', textOnPrimary: '#ffffff' },
  13: { sdg: 13, name: 'Ação Climática',             primary: '#1F4023', secondary: '#3F7E44', cream: '#f3f8f4', textOnPrimary: '#ffffff' },
  14: { sdg: 14, name: 'Vida Abaixo d\'Água',        primary: '#053F5C', secondary: '#0A97D9', cream: '#eff8fc', textOnPrimary: '#ffffff' },
  15: { sdg: 15, name: 'Vida Terrestre',             primary: '#2A5C14', secondary: '#56C02B', cream: '#f4faef', textOnPrimary: '#ffffff' },
  16: { sdg: 16, name: 'Paz e Justiça',              primary: '#093A52', secondary: '#00689D', cream: '#eef6fa', textOnPrimary: '#ffffff' },
  17: { sdg: 17, name: 'Parcerias',                  primary: '#0B2435', secondary: '#19486A', cream: '#eff3f7', textOnPrimary: '#ffffff' },
}

const FALLBACK: SdgPalette = {
  sdg: 0, name: 'Genérico',
  primary: '#1f2937', secondary: '#6366f1', cream: '#f8fafc', textOnPrimary: '#ffffff',
}

export function getSdgPalette(sdgList: number[]): SdgPalette {
  if (!sdgList || sdgList.length === 0) return FALLBACK
  const main = sdgList[0]
  return PALETTES[main] || FALLBACK
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}
