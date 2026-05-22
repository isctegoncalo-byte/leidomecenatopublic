// Gerador de imagens JPG para comunicação interna
// (versão sem LinkedIn / Instagram)

import { GeneratedESGReport } from '../types'
import { generateSocialContent } from '../templates/socialTemplates'
import { getBrandIdentity } from './brandIdentity'

const SIZE = { width: 1240, height: 1754 } // A4 portrait at 150dpi

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return []
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue }
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = wrapTextLines(ctx, text, maxWidth)
  for (const line of lines) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }
  return y
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  }, 'image/jpeg', 0.92)
}

// ─── INTERNAL COMMS ──────────────────────────────
function renderInternal(ctx: CanvasRenderingContext2D, w: number, h: number, content: { title: string; body: string; cta: string }, report: GeneratedESGReport) {
  const brand = getBrandIdentity()

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // Top bar
  ctx.fillStyle = brand.primaryColor || '#0f172a'
  ctx.fillRect(0, 0, w, 130)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(` ${brand.name.toUpperCase()}`, 80, 55)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(`Comunicação Interna  •  ${brand.tagline}`, 80, 95)

  // Date / Ref
  ctx.fillStyle = '#ffffff'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(report.donationDate, w - 80, 55)
  ctx.font = '16px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(report.reportId, w - 80, 90)
  ctx.textAlign = 'left'

  // Title
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 48px sans-serif'
  ctx.textBaseline = 'top'
  let y = 200
  y = drawText(ctx, content.title, 80, y, w - 160, 56)

  // Divider
  y += 20
  ctx.fillStyle = brand.accentColor || '#fbbf24'
  ctx.fillRect(80, y, 80, 6)
  y += 40

  // Body
  ctx.fillStyle = '#334155'
  ctx.font = '24px sans-serif'
  y = drawText(ctx, content.body, 80, y, w - 160, 36)

  // KPIs box (bottom)
  const boxY = h - 320
  ctx.fillStyle = '#f1f5f9'
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath()
    ;(ctx as any).roundRect(80, boxY, w - 160, 220, 20)
    ctx.fill()
  } else {
    ctx.fillRect(80, boxY, w - 160, 220)
  }

  ctx.fillStyle = brand.primaryColor || '#0f172a'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText('RESUMO DO IMPACTO', 110, boxY + 30)

  const kpis = [
    { label: 'Empresa', value: report.company },
    { label: 'Instituição', value: report.institution },
    { label: 'Donativo', value: `€${report.donationAmount.toLocaleString('pt-PT')}` },
    { label: 'métricas de impacto', value: `${report.scores.beneficiaries.toLocaleString()} beneficiários` },
    { label: 'Beneficiários', value: report.scores.beneficiaries.toLocaleString() },
    { label: 'Dedução IRC', value: `€${report.irsDeduction.toLocaleString('pt-PT')}` },
  ]
  let ky = boxY + 70
  kpis.forEach(k => {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '16px sans-serif'
    ctx.fillText(k.label, 110, ky)
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(k.value, w - 110, ky)
    ctx.textAlign = 'left'
    ky += 28
  })

  // Footer
  ctx.fillStyle = '#94a3b8'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(content.cta, w / 2, h - 50)
  ctx.textAlign = 'left'
}

function ensureRoundRect(ctx: CanvasRenderingContext2D) {
  if (typeof (ctx as any).roundRect !== 'function') {
    (ctx as any).roundRect = function (x: number, y: number, w: number, h: number, r: number | number[]) {
      const radius = typeof r === 'number' ? [r, r, r, r] : (r.length === 4 ? r : [r[0] || 0, r[0] || 0, r[0] || 0, r[0] || 0])
      this.moveTo(x + radius[0], y)
      this.lineTo(x + w - radius[1], y)
      this.quadraticCurveTo(x + w, y, x + w, y + radius[1])
      this.lineTo(x + w, y + h - radius[2])
      this.quadraticCurveTo(x + w, y + h, x + w - radius[2], y + h)
      this.lineTo(x + radius[3], y + h)
      this.quadraticCurveTo(x, y + h, x, y + h - radius[3])
      this.lineTo(x, y + radius[0])
      this.quadraticCurveTo(x, y, x + radius[0], y)
    }
  }
}

// ─── EXPORT ──────────────────────────────────────
export function downloadInternalCommsImage(report: GeneratedESGReport, templateId: string) {
  const social = generateSocialContent(report, templateId)
  if (!social) { alert('Template não encontrado'); return }

  const canvas = document.createElement('canvas')
  canvas.width = SIZE.width
  canvas.height = SIZE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ensureRoundRect(ctx)
  renderInternal(ctx, SIZE.width, SIZE.height, social.internal, report)

  downloadCanvas(canvas, `${templateId}-comunicacao-interna.jpg`)
}

// Aliases para compatibilidade com chamadas antigas
export const downloadSocialImage = (_channel: string, report: GeneratedESGReport, templateId: string) => downloadInternalCommsImage(report, templateId)
export const downloadAllSocialImages = (report: GeneratedESGReport, templateId: string) => downloadInternalCommsImage(report, templateId)
