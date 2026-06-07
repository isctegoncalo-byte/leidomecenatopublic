import jsPDF from 'jspdf'
import { GeneratedESGReport } from '../types'
import { ReportTemplate } from '../templates/reportTemplates'
import { getSdgPalette, hexToRgb, SdgPalette } from './sdgPalette'
import { getLogoDataUrl } from './logoLoader'
import { getBrandIdentity } from './brandIdentity'
import { SDG_DATA, SdgInfo } from '../data/sdgs'
import { GENERAL_IMPACT_METRICS, ODS_IMPACT_METRICS } from '../data/impactMetrics'

const W = 210
const H = 297
const M = 18
const CW = W - M * 2
type SdgImageMap = Record<number, string>

// ─── Helpers ────────────────────────────────────────
function setFill(doc: jsPDF, hex: string) {
  const rgb = hexToRgb(hex)
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setText(doc: jsPDF, hex: string) {
  const rgb = hexToRgb(hex)
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function setDraw(doc: jsPDF, hex: string) {
  const rgb = hexToRgb(hex)
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function lighten(hex: string, alpha: number): [number, number, number] {
  const rgb = hexToRgb(hex)
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * (1 - alpha)),
    Math.round(rgb[1] + (255 - rgb[1]) * (1 - alpha)),
    Math.round(rgb[2] + (255 - rgb[2]) * (1 - alpha)),
  ]
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = 5): number {
  if (!text) return y
  try {
    const lines = doc.splitTextToSize(String(text), maxW)
    doc.text(lines, x, y)
    return y + lines.length * lh
  } catch {
    return y
  }
}

function reportPhotos(report: GeneratedESGReport): string[] {
  return (report.institutionPhotoUrls || []).filter(photo => typeof photo === 'string' && photo.startsWith('data:'))
}

function addReportImage(doc: jsPDF, photo: string | undefined, x: number, y: number, w: number, h: number, label = 'Fotografia') {
  setDraw(doc, '#cbd5e1')
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x, y, w, h, 3, 3, 'FD')

  if (photo && photo.startsWith('data:')) {
    try {
      const fmt = photo.includes('png') || photo.includes('svg') ? 'PNG' : 'JPEG'
      doc.addImage(photo, fmt, x + 1.2, y + 1.2, w - 2.4, h - 2.4)
      return
    } catch {
      // fallback below
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(label, x + w / 2, y + h / 2, { align: 'center' })
}

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG'
  if (dataUrl.includes('image/webp')) return 'WEBP'
  return 'PNG'
}

function addSdgImage(doc: jsPDF, sdgImages: SdgImageMap | undefined, sdg: number, x: number, y: number, w: number, h: number) {
  const dataUrl = sdgImages?.[sdg]
  if (!dataUrl) return false
  try {
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h)
    return true
  } catch {
    return false
  }
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function loadImageDataUrl(url: string) {
  if (!url || url.includes('image/svg+xml')) return null
  if (url.startsWith('data:image/')) return url
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.type.startsWith('image/') || blob.type.includes('svg')) return null
    return await blobToDataUrl(blob)
  } catch {
    return null
  }
}

async function loadSdgImageMap(sdgs: number[]): Promise<SdgImageMap> {
  const uniqueSdgs = [...new Set(sdgs)].filter(n => n >= 1 && n <= 17)
  const entries = await Promise.all(uniqueSdgs.map(async n => {
    const sdg = SDG_DATA.find(item => item.n === n)
    if (!sdg) return null
    for (const url of sdg.imgUrls) {
      const dataUrl = await loadImageDataUrl(url)
      if (dataUrl) return [n, dataUrl] as const
    }
    return null
  }))
  return Object.fromEntries(entries.filter(Boolean) as Array<readonly [number, string]>)
}

function metricLabel(key: string, sdg?: number) {
  const specific = sdg ? ODS_IMPACT_METRICS[sdg]?.find(m => m.key === key) : undefined
  const general = GENERAL_IMPACT_METRICS.find(m => m.key === key)
  return specific?.label || general?.label || key
}

function compactNeedMetrics(need: GeneratedESGReport['relevantNeeds'][number]) {
  const lines: string[] = []

  const general = Object.entries(need.generalImpactMetrics || {})
    .filter(([, value]) => value !== undefined && value !== '')
    .slice(0, 3)
    .map(([key, value]) => `${metricLabel(key)}: ${value}`)

  if (general.length) lines.push(...general)

  const ods = Object.entries(need.odsImpactMetrics || {})
    .flatMap(([sdg, metrics]) => Object.entries(metrics || {})
      .filter(([, value]) => value !== undefined && value !== '')
      .slice(0, 2)
      .map(([key, value]) => `ODS ${sdg} — ${metricLabel(key, Number(sdg))}: ${value}`))
    .slice(0, 4)

  if (ods.length) lines.push(...ods)
  return lines.slice(0, 6)
}

function addBackgroundImage(doc: jsPDF, dataUrl: string | undefined) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return false
  try {
    const fmt = dataUrl.includes('png') ? 'PNG' : 'JPEG'
    doc.addImage(dataUrl, fmt, 0, 0, W, H)
    return true
  } catch {
    return false
  }
}

function paintBackground(doc: jsPDF, palette: SdgPalette, template?: ReportTemplate, sectionId?: string) {
  const bg = sectionId ? template?.pageBackgrounds?.[sectionId] : undefined
  if (addBackgroundImage(doc, bg)) return
  setFill(doc, palette.cream)
  doc.rect(0, 0, W, H, 'F')
}

function drawCornerCircles(doc: jsPDF, palette: SdgPalette) {
  // canto superior direito
  const c1 = lighten(palette.secondary, 0.08)
  doc.setFillColor(c1[0], c1[1], c1[2])
  doc.circle(W - 5, 25, 30, 'F')
  const c2 = lighten(palette.secondary, 0.18)
  doc.setFillColor(c2[0], c2[1], c2[2])
  doc.circle(W - 18, 40, 18, 'F')

  // canto inferior esquerdo
  const c3 = lighten(palette.secondary, 0.10)
  doc.setFillColor(c3[0], c3[1], c3[2])
  doc.circle(5, H - 8, 28, 'F')
}

// ─── COVER ──────────────────────────────────────────
function drawCover(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, logoDataUrl: string, template?: ReportTemplate) {
  paintBackground(doc, palette, template, 'cover')

  // círculos decorativos grandes (lado direito)
  const c1 = lighten(palette.secondary, 0.18)
  doc.setFillColor(c1[0], c1[1], c1[2])
  doc.circle(W - 20, H - 60, 90, 'F')
  const c2 = lighten(palette.secondary, 0.30)
  doc.setFillColor(c2[0], c2[1], c2[2])
  doc.circle(W - 30, H - 50, 60, 'F')
  setFill(doc, palette.secondary)
  doc.circle(W - 35, H - 45, 35, 'F')
  // círculo topo direito
  const c3 = lighten(palette.secondary, 0.20)
  doc.setFillColor(c3[0], c3[1], c3[2])
  doc.circle(W - 15, 25, 25, 'F')

  // Logo (canto superior esquerdo)
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', M, 16, 18, 18) } catch { /* ignore */ }
  }

  // Branding (texto à direita) — usa identidade da marca
  const brand = getBrandIdentity()
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(brand.name.toUpperCase(), W - M, 25, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(brand.tagline, W - M, 30, { align: 'right' })

  // Título grande
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(40)
  doc.text('Relatório', M, 110)
  doc.text('de Impacto', M, 128)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(20)
  doc.setTextColor(80, 80, 80)
  doc.text(`${new Date().getFullYear()}`, M, 148)

  // Subtítulo
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Donativo ao abrigo da Lei do Mecenato', M, 158)
  doc.text(`ODS principal: ${palette.name}`, M, 165)

  // Linha + dados
  setDraw(doc, palette.primary)
  doc.setLineWidth(0.3)
  doc.line(M, H - 50, 100, H - 50)

  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(report.company || 'Empresa', M, H - 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(`em apoio a ${report.institution || 'Instituição'}`, M, H - 36)
  doc.text(`Ref: ${report.reportId}  •  ${report.generatedAt}`, M, H - 30)
}

// ─── SHARED HEADER & FOOTER ─────────────────────────
function drawHeader(doc: jsPDF, palette: SdgPalette, label: string) {
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(label.toUpperCase(), M, 14)
  setDraw(doc, palette.secondary)
  doc.setLineWidth(0.4)
  doc.line(M, 17, M + 30, 17)
}

function drawFooter(doc: jsPDF, palette: SdgPalette, pageNum: number) {
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`${getBrandIdentity().name}  •  ${getBrandIdentity().tagline}`, M, H - 8)
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(String(pageNum).padStart(2, '0'), W - M, H - 8, { align: 'right' })
}

function newPage(doc: jsPDF, palette: SdgPalette, title: string, eyebrow: string, pageNum: number, template?: ReportTemplate, sectionId?: string) {
  doc.addPage()
  paintBackground(doc, palette, template, sectionId)
  drawCornerCircles(doc, palette)
  drawHeader(doc, palette, eyebrow)
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.text(title, M, 40)
  drawFooter(doc, palette, pageNum)
}

// ─── PAGE 2: TOC ────────────────────────────────────
function drawTOC(doc: jsPDF, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'CONTENTS', 'Índice', 2, template, 'toc')
  const items = [
    { n: '01', title: 'Sumário Executivo', page: '03' },
    { n: '02', title: 'A Empresa & A Instituição', page: '04' },
    { n: '03', title: 'Métricas de impacto', page: '05' },
    { n: '04', title: 'Alinhamento com os ODS', page: '06' },
    { n: '05', title: 'Necessidades Apoiadas', page: '07' },
    { n: '06', title: 'Galeria do Projeto', page: '08' },
    { n: '07', title: 'Dados Fiscais & IRC', page: '09' },
  ]
  let y = 65
  for (const item of items) {
    setText(doc, palette.secondary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(item.n, M, y)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'normal')
    doc.text(item.title, M + 14, y)
    setText(doc, palette.primary)
    doc.setFont('helvetica', 'bold')
    doc.text(item.page, W - M, y, { align: 'right' })
    y += 11
  }

  // Bloco lateral
  y += 5
  setFill(doc, palette.primary)
  doc.roundedRect(M, y, CW, 38, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Sobre este relatório', M + 6, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  wrap(doc, `Este relatório de impacto foi gerado pela plataforma Lei do Mecenato com base no donativo registado e no perfil ESG da instituição. As cores refletem o ODS principal apoiado: ${palette.name} (ODS ${palette.sdg}).`, M + 6, y + 18, CW - 12, 4)
}

// ─── PAGE 3: SUMMARY ────────────────────────────────
function drawSummary(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'SUMMARY', 'Sumário Executivo', 3, template, 'summary')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text('Visão geral do impacto gerado por este donativo.', M, 47)

  let y = 58
  const photos = reportPhotos(report)
  if (photos[0]) {
    addReportImage(doc, photos[0], M, y, CW, 58, 'Fotografia do projeto')
    y += 68
  }

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(12)
  y = wrap(doc, report.scores.impactNarrative, M, y, CW, 7)

  y += 8
  const boxW = (CW - 6) / 2
  const boxH = 38

  const kpis = [
    { label: 'BENEFICIÁRIOS', value: report.scores.beneficiaries.toLocaleString(), sub: 'pessoas impactadas' },
    { label: 'BENEFICIÁRIOS', value: report.scores.beneficiaries.toLocaleString(), sub: 'pessoas impactadas' },
    { label: 'DONATIVO', value: `€ ${report.donationAmount.toLocaleString('pt-PT')}`, sub: '100% para a instituição' },
    { label: 'DEDUÇÃO IRC', value: `€ ${report.irsDeduction.toLocaleString('pt-PT')}`, sub: 'multiplicador 140%' },
  ]

  for (let i = 0; i < kpis.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = M + col * (boxW + 6)
    const yy = y + row * (boxH + 6)
    const k = kpis[i]

    doc.setFillColor(255, 255, 255)
    setDraw(doc, palette.secondary)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, yy, boxW, boxH, 3, 3, 'FD')

    setText(doc, palette.secondary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(k.label, x + 4, yy + 7)

    setText(doc, palette.primary)
    doc.setFontSize(22)
    doc.text(k.value, x + 4, yy + 21)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(k.sub, x + 4, yy + 31)
  }
}

// ─── PAGE 4: COMPANY & INSTITUTION ──────────────────
function drawCompanyInstitution(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'OVERVIEW', 'Empresa & Instituição', 4, template, 'overview')

  let y = 60
  const photos = reportPhotos(report)
  if (photos[1]) {
    addReportImage(doc, photos[1], W - M - 62, y - 4, 62, 42, 'Fotografia')
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, palette.secondary)
  doc.text('EMPRESA DOADORA', M, y)
  y += 6
  setText(doc, palette.primary)
  doc.setFontSize(18)
  doc.text(report.company, M, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`NIF/NIPC adquirente: ${report.companyNif}`, M, y); y += 5
  if (report.companyEmail) {
    doc.text(`Email: ${report.companyEmail}`, M, y); y += 5
  }
  doc.text(`Data: ${report.donationDate}`, M, y); y += 5

  let y2 = 112
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, palette.secondary)
  doc.text('INSTITUIÇÃO BENEFICIÁRIA', M, y2)
  y2 += 6
  setText(doc, palette.primary)
  doc.setFontSize(18)
  doc.text(report.institution, M, y2)
  y2 += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`Categoria: ${report.institutionCategory}`, M, y2); y2 += 5
  doc.text(`Beneficiários/ano: ${report.scores.beneficiaries.toLocaleString()}`, M, y2); y2 += 5

  if (report.institutionThankYouMessage) {
    y2 += 8
    doc.setFillColor(240, 253, 244)
    setDraw(doc, '#86efac')
    doc.roundedRect(M, y2, CW, 42, 4, 4, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(22, 101, 52)
    doc.text('Mensagem de agradecimento da instituição', M + 6, y2 + 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(60, 60, 60)
    wrap(doc, `"${report.institutionThankYouMessage}"`, M + 6, y2 + 17, CW - 12, 5)
    y2 += 50
  }

  // Bloco mensagem
  y = Math.max(y, y2) + 14
  setFill(doc, palette.primary)
  doc.roundedRect(M, y, CW, 62, 4, 4, 'F')
  setText(doc, palette.secondary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('NARRATIVA DE IMPACTO', M + 7, y + 11)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  wrap(doc, `"${report.scores.impactNarrative}"`, M + 7, y + 22, CW - 14, 6.5)

  // Highlights
  y += 74
  doc.setTextColor(22, 163, 74)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Pontos Fortes', M, y)
  doc.setTextColor(220, 38, 38)
  doc.text('Riscos', M + CW / 2 + 3, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let yA = y
  for (const h of report.scores.highlights.slice(0, 3)) {
    setText(doc, palette.secondary)
    doc.text('•', M, yA)
    doc.setTextColor(60, 60, 60)
    yA = wrap(doc, h, M + 4, yA, CW / 2 - 8, 4.8)
    yA += 1
  }

  let yB = y
  for (const r of report.scores.risks.slice(0, 3)) {
    setText(doc, palette.secondary)
    doc.text('•', M + CW / 2 + 3, yB)
    doc.setTextColor(60, 60, 60)
    yB = wrap(doc, r, M + CW / 2 + 7, yB, CW / 2 - 8, 4.8)
    yB += 1
  }
}

// ─── PAGE 5: SCORES ─────────────────────────────────

// ─── PAGE 6: SDG ────────────────────────────────────
function drawSDG(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate, sdgImages?: SdgImageMap) {
  newPage(doc, palette, 'ALIGNED SDGs', 'Alinhamento ODS', 6, template, 'sdg')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text('Objetivos de Desenvolvimento Sustentável apoiados', M, 50)

  let y = 65
  for (const sdg of report.sdgAlignment.slice(0, 10)) {
    const isPrimary = sdg === palette.sdg
    if (isPrimary) {
      setFill(doc, palette.primary)
    } else {
      doc.setFillColor(245, 245, 245)
    }
    doc.roundedRect(M, y, CW, 14, 2, 2, 'F')
    if (isPrimary) {
      doc.setTextColor(255, 255, 255)
    } else {
      doc.setTextColor(60, 60, 60)
    }
    const hasImage = addSdgImage(doc, sdgImages, sdg, M + 3, y + 2, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`ODS ${sdg}`, M + (hasImage ? 17 : 6), y + 9)
    doc.setFont('helvetica', 'normal')
    doc.text(`— ${getSdgLabel(sdg)}`, M + (hasImage ? 33 : 22), y + 9)
    if (isPrimary) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text('PRINCIPAL', W - M - 6, y + 9, { align: 'right' })
    }
    y += 16
  }
}

// ─── PAGE 7: NEEDS ──────────────────────────────────
function drawNeeds(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'NEEDS', 'Necessidades Apoiadas', 7, template, 'needs')

  let y = 60
  for (const n of report.relevantNeeds.slice(0, 5)) {
    if (y + 38 > H - 25) break
    doc.setFillColor(255, 255, 255)
    setDraw(doc, palette.secondary)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, 36, 3, 3, 'FD')

    const pillarColors: Record<string, string> = { E: '#16a34a', S: '#2563eb', G: '#7c3aed' }
    const pColor = pillarColors[n.esgPillar] || '#6b7280'
    setFill(doc, pColor)
    doc.roundedRect(M + 4, y + 4, 8, 8, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(n.esgPillar, M + 8, y + 9.5, { align: 'center' })

    setText(doc, palette.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`${n.category} › ${n.subcategory}`, M + 16, y + 9)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(60, 60, 60)
    wrap(doc, n.impactMetric, M + 16, y + 17, CW - 22, 5.2)

    const metrics = compactNeedMetrics(n)
    if (metrics.length > 0) {
      doc.setFontSize(7.2)
      doc.setTextColor(100, 116, 139)
      wrap(doc, `Métricas: ${metrics.join(' • ')}`, M + 16, y + 27, CW - 22, 3.8)
    }

    if (n.estimatedValue) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      setText(doc, palette.secondary)
      doc.text(`€ ${n.estimatedValue.toLocaleString('pt-PT')}`, W - M - 4, y + 9, { align: 'right' })
    }
    if (n.beneficiaries) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`${n.beneficiaries.toLocaleString()} beneficiários`, W - M - 4, y + 15, { align: 'right' })
    }

    y += 40
  }
}

// ─── PAGE 8: GALLERY ────────────────────────────────
function drawGallery(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'GALLERY', 'Galeria do Projeto', 8, template, 'gallery')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text('Fotografias carregadas pela instituição apoiada', M, 50)

  const photos = reportPhotos(report)
  const bW = (CW - 6) / 2
  const bH = 88

  for (let i = 0; i < 4; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = M + col * (bW + 6)
    const y = 60 + row * (bH + 6)
    const photo = photos[i]

    addReportImage(doc, photo, x, y, bW, bH, `Foto ${i + 1}`)

    doc.setFillColor(255, 255, 255)
    doc.roundedRect(x + 4, y + bH - 12, 28, 7, 2, 2, 'F')
    setText(doc, palette.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(`FOTO ${i + 1}`, x + 18, y + bH - 7.2, { align: 'center' })
  }
}

function drawSdgImpactGrid(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, sdgImages?: SdgImageMap) {
  doc.addPage()
  paintBackground(doc, palette)
  drawCornerCircles(doc, palette)
  setText(doc, palette.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('SDG IMPACT', M, 40)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text('Alinhamento visual com os Objetivos de Desenvolvimento Sustentável.', M, 48)

  const sdgs = report.sdgAlignment
  const bW = 30
  const gap = 4
  let x = M
  let y = 60

  for (let i = 0; i < sdgs.length; i++) {
    const sdgNum = sdgs[i]
    const sdg = SDG_DATA.find((s: SdgInfo) => s.n === sdgNum)
    if (!sdg) continue

    if (x + bW > W - M) {
      x = M
      y += bW + gap
    }

    if (!addSdgImage(doc, sdgImages, sdg.n, x, y, bW, bW)) {
      doc.setFillColor(...hexToRgb(sdg.color))
      doc.rect(x, y, bW, bW, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.text(String(sdg.n), x + bW / 2, y + bW / 2, { align: 'center' })
    }

    x += bW + gap
  }
  
  drawFooter(doc, palette, 9)
}

// ─── PAGE 9: FISCAL ─────────────────────────────────
function drawFiscal(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  newPage(doc, palette, 'FISCAL DATA', 'Dados Fiscais', 9, template, 'fiscal')

  let y = 60
  const rows = [
    ['Empresa', report.company],
    ['NIF', report.companyNif],
    ['Instituição beneficiária', report.institution],
    ['Data do donativo', report.donationDate],
    ['Referência', report.reportId],
    ['Enquadramento', 'Art. 62.º Código do IRC'],
  ]
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(label, M, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text(value, W - M, y, { align: 'right' })
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(M, y + 2, W - M, y + 2)
    y += 8
  }

  // Cálculo
  y += 6
  setFill(doc, palette.primary)
  doc.roundedRect(M, y, CW, 50, 4, 4, 'F')
  setText(doc, palette.secondary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('CÁLCULO DE BENEFÍCIOS FISCAIS', M + 6, y + 9)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Donativo: € ${report.donationAmount.toLocaleString('pt-PT')}`, M + 6, y + 18)
  doc.text(`× 1,4 (Lei do Mecenato) = Base Dedução IRC: € ${report.irsDeduction.toLocaleString('pt-PT')}`, M + 6, y + 25)
  doc.text(`Poupança fiscal estimada (21% IRC): € ${report.ircSavings.toLocaleString('pt-PT')}`, M + 6, y + 32)
  doc.setFont('helvetica', 'bold')
  doc.text(`Custo real: € ${(report.donationAmount - report.ircSavings).toFixed(2)}`, M + 6, y + 41)

  // Disclaimer
  y += 60
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  wrap(doc, report.disclaimer, M, y, CW, 4)
}

// ─── PREMIUM EXTRA PAGES (10-15) ─────────────────────
function drawPremiumExtraPages(doc: jsPDF, report: GeneratedESGReport, palette: SdgPalette, template?: ReportTemplate) {
  const pages = [
    {
      title: 'METODOLOGIA ESG', eyebrow: 'Apêndice Metodológico', page: 10,
      body: `A análise de impacto organiza os dados declarados pela instituição, os ODS associados, os KPIs do projeto, a dimensão dos beneficiários e as evidências documentais recolhidas.`,
    },
    {
      title: 'BENEFICIÁRIOS', eyebrow: 'Métricas de Impacto', page: 11,
      body: `O donativo apresenta impacto direto estimado em ${report.scores.beneficiaries.toLocaleString()} beneficiários. O indicador de impacto por euro doado é ${report.impactPerEuro}. Estes dados são calculados com base nas necessidades submetidas pela instituição e nos indicadores de impacto declarados.`,
    },
    {
      title: 'RISCOS & MITIGAÇÃO', eyebrow: 'Análise ESG', page: 12,
      body: `Foram considerados os seguintes riscos no projeto: ${report.scores.risks.join('; ')}. A mitigação recomendada passa pela monitorização periódica, recolha de evidências, confirmação documental e acompanhamento da execução pela instituição beneficiária.`,
    },
    {
      title: 'PLANO DE IMPACTO', eyebrow: 'Roadmap', page: 13,
      body: `Recomenda-se que a empresa acompanhe o impacto em três momentos: confirmação documental do donativo, validação da aplicação pela instituição e recolha de evidências visuais ou quantitativas. A instituição deve atualizar o estado das necessidades apoiadas e fornecer dados de execução sempre que possível.`,
    },
    {
      title: 'COMUNICAÇÃO', eyebrow: 'Conteúdo Institucional', page: 14,
      body: `Este donativo pode ser comunicado como uma ação de responsabilidade social com impacto validado. Mensagem recomendada: a empresa ${report.company} apoiou ${report.institution} com um donativo de €${report.donationAmount.toLocaleString('pt-PT')}, contribuindo para ${report.sdgAlignment.map(s => `ODS ${s}`).join(', ')} e gerando impacto em ${report.scores.beneficiaries.toLocaleString()} beneficiários.`,
    },
    {
      title: 'ANEXO FINAL', eyebrow: 'Documentação', page: 15,
      body: `Este relatório deve ser acompanhado, para efeitos fiscais, pela declaração/recibo emitido pela instituição beneficiária ao abrigo da Lei do Mecenato. A plataforma Lei do Mecenato é uma iniciativa privada independente e não substitui validação contabilística ou fiscal.`,
    },
  ]

  pages.forEach(p => {
    newPage(doc, palette, p.title, p.eyebrow, p.page, template, 'summary')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(70, 70, 70)
    wrap(doc, p.body, M, 62, CW, 7)
  })
}

function downloadSocialCopyTxt(report: GeneratedESGReport) {
  const copy = `FACEBOOK
${report.company} apoiou ${report.institution} com um donativo de €${report.donationAmount.toLocaleString('pt-PT')} ao abrigo da Lei do Mecenato. O apoio gerou impacto em ${report.scores.beneficiaries.toLocaleString()} beneficiários e está alinhado com ${report.sdgAlignment.map(s => `ODS ${s}`).join(', ')}.

INSTAGRAM
Impacto real. Donativo de €${report.donationAmount.toLocaleString('pt-PT')} de ${report.company} para ${report.institution}. ${report.scores.beneficiaries.toLocaleString()} beneficiários. #LeiDoMecenato #ImpactoSocial #ESG

LINKEDIN
A ${report.company} apoiou ${report.institution} através de um donativo de €${report.donationAmount.toLocaleString('pt-PT')}. O Relatório de Impacto documenta impacto direto em ${report.scores.beneficiaries.toLocaleString()} beneficiários e alinhamento com ${report.sdgAlignment.map(s => `ODS ${s}`).join(', ')}.

Nota: 100% do donativo foi entregue diretamente à instituição beneficiária.`

  const blob = new Blob([copy], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `copy-redes-sociais-${report.reportId}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

function getSdgLabel(sdg: number): string {
  const labels: Record<number, string> = {
    1: 'Erradicação da Pobreza', 2: 'Fome Zero', 3: 'Saúde de Qualidade',
    4: 'Educação de Qualidade', 5: 'Igualdade de Género', 6: 'Água Potável',
    7: 'Energias Renováveis', 8: 'Trabalho Digno', 9: 'Indústria e Inovação',
    10: 'Redução das Desigualdades', 11: 'Cidades Sustentáveis', 12: 'Consumo Sustentável',
    13: 'Ação Climática', 14: 'Vida Abaixo d\'Água', 15: 'Vida Terrestre',
    16: 'Paz e Justiça', 17: 'Parcerias',
  }
  return labels[sdg] || ''
}

// ─── DOWNLOAD ───────────────────────────────────────
function downloadPdfBlob(doc: jsPDF, filename: string) {
  try {
    const dataUrl = doc.output('datauristring')
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    console.log(' PDF descarregado:', filename)
  } catch (err) {
    console.error(' Falha no download:', err)
    alert('Erro ao guardar PDF: ' + (err instanceof Error ? err.message : String(err)))
  }
}

// ─── MAIN ───────────────────────────────────────────
export async function downloadSustainabilityReport(report: GeneratedESGReport, template?: ReportTemplate) {
  console.log(' A gerar relatório Sustainability...')
  try {
    const palette = getSdgPalette(report.sdgAlignment)
    console.log(' Palette:', palette.name, '(ODS', palette.sdg + ')')

    const logoDataUrl = await getLogoDataUrl()
    console.log(' Logo carregado:', logoDataUrl ? 'OK' : 'em falta (segue sem logo)')

    const sdgImages = await loadSdgImageMap(report.sdgAlignment)
    console.log('Imagens ODS carregadas:', Object.keys(sdgImages).length)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    console.log(' jsPDF instanciado')

    const tierName = report.reportTier.toLowerCase()
    const isPremium = tierName.includes('advanced') || tierName.includes('360') || tierName.includes('premium')
    const hasSocialPack = tierName.includes('360') || tierName.includes('redes') || tierName.includes('sociais') || tierName.includes('pack')

    drawCover(doc, report, palette, logoDataUrl, template)
    console.log(' Capa OK')

    if (isPremium) {
      drawTOC(doc, palette, template)
      drawSummary(doc, report, palette, template)
      drawCompanyInstitution(doc, report, palette, template)
    drawSDG(doc, report, palette, template, sdgImages)
    drawNeeds(doc, report, palette, template)
    drawGallery(doc, report, palette, template)
    drawSdgImpactGrid(doc, report, palette, sdgImages) // New Page with SDG Icons
    drawFiscal(doc, report, palette, template)
    drawPremiumExtraPages(doc, report, palette, template)
    if (hasSocialPack) downloadSocialCopyTxt(report)
  } else {
    // Relatório base: 6 páginas incluindo capa
    drawSummary(doc, report, palette, template)
    drawCompanyInstitution(doc, report, palette, template)
    drawNeeds(doc, report, palette, template)
    drawSdgImpactGrid(doc, report, palette, sdgImages) // New Page with SDG Icons
    drawFiscal(doc, report, palette, template)
  }

    downloadPdfBlob(doc, `relatorio-impacto-${report.reportId}.pdf`)
  } catch (err) {
    console.error(' Erro ao gerar relatório:', err)
    alert('Erro ao gerar PDF: ' + (err instanceof Error ? err.message : String(err)))
  }
}
