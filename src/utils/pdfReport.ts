import jsPDF from 'jspdf'
import { GeneratedESGReport } from '../types'
import { ReportTemplate } from '../templates/reportTemplates'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = 6): number {
  const lines: string[] = doc.splitTextToSize(text, maxW)
  doc.text(lines, x, y)
  return y + lines.length * lh
}

function ensurePage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) { doc.addPage(); return 20 }
  return y
}

function forceDownload(pdfData: string, filename: string) {
  try {
    // Tenta com Blob
    const binary = atob(pdfData)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([array], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    console.log(' PDF descarregado via Blob')
  } catch (err1) {
    console.error('Blob download falhou:', err1)
    try {
      // Fallback: abre noutra tab
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`<html><head><title>${filename}</title></head><body><iframe src="data:application/pdf;base64,${pdfData}" style="width:100%;height:100%;border:none;"></iframe></body></html>`)
        win.document.close()
        console.log(' PDF aberto em nova tab')
      }
    } catch (err2) {
      console.error('Fallback também falhou:', err2)
      alert('Não foi possível gerar o PDF. Abre a consola (F12) para ver o erro.')
    }
  }
}

export function downloadReportPdf(report: GeneratedESGReport, template: ReportTemplate) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210; const M = 16; const contentW = W - M * 2
    const [hr, hg, hb] = hexToRgb(template.accent)

    doc.setFillColor(hr, hg, hb); doc.rect(0, 0, W, 36, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
    doc.text('Relatório de Impacto do Donativo', M, 18)
    doc.setFontSize(11); doc.text(`${template.name}  •  ${report.reportTier}`, M, 28)

    doc.setTextColor(30, 41, 59); doc.setFontSize(10); let y = 46
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text(report.company, M, y); y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    y = wrap(doc, `NIF: ${report.companyNif}`, M, y, contentW); y += 2
    y = wrap(doc, `Instituição: ${report.institution} (${report.institutionCategory})`, M, y, contentW); y += 2
    y = wrap(doc, `Data do donativo: ${report.donationDate}`, M, y, contentW); y += 2
    y = wrap(doc, `Donativo (100% p/ instituição): € ${report.donationAmount.toLocaleString('pt-PT')}`, M, y, contentW); y += 2
    y = wrap(doc, `Serviço: € ${report.reportPrice.toLocaleString()}  |  Ref: ${report.reportId}`, M, y, contentW)

    y += 6; const [sr, sg, sb] = hexToRgb(template.subAccent)
    doc.setDrawColor(sr, sg, sb); doc.setLineWidth(0.7); doc.line(M, y, W - M, y); y += 10

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('métricas de impacto', M, y); y += 8
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    y = wrap(doc, `Beneficiários diretos: ${report.scores.beneficiaries.toLocaleString()}`, M, y, contentW); y += 3
    doc.setFontSize(10)
    y = wrap(doc, `Ambiental: ${report.scores.environmental}  |  Social: ${report.scores.social}  |  Governação: ${report.scores.governance}`, M, y, contentW)
    if (report.coveragePercent !== undefined) {
      y += 3
      y = wrap(doc, `Cobertura do projeto: ${report.coveragePercent.toFixed(1)}%  (custo total: € ${(report.projectCost || 0).toLocaleString('pt-PT')})`, M, y, contentW)
    }
    y += 3
    y = wrap(doc, `Beneficiários: ${report.scores.beneficiaries.toLocaleString()}  |  Impacto/€: ${report.impactPerEuro}`, M, y, contentW)

    y += 8; y = ensurePage(doc, y, 30)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Narrativa de Impacto', M, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    y = wrap(doc, report.scores.impactNarrative, M, y, contentW)

    y += 8; y = ensurePage(doc, y, 20)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Necessidades Apoiadas', M, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    for (const need of report.relevantNeeds.slice(0, 6)) {
      y = ensurePage(doc, y, 14)
      y = wrap(doc, `• ${need.category} › ${need.subcategory}`, M, y, contentW)
      y = wrap(doc, `  ${need.impactMetric}`, M + 2, y, contentW - 4)
      if (need.estimatedValue) y = wrap(doc, `  € ${need.estimatedValue.toLocaleString('pt-PT')}  |  ${(need.beneficiaries || 0).toLocaleString()} beneficiários`, M + 2, y, contentW - 4)
      y += 2
    }

    y += 4; y = ensurePage(doc, y, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 41, 59)
    doc.text('Fotografias da Instituição / Projeto', M, y); y += 6
    const photos = report.institutionPhotoUrls || []
    const bW = 82; const bH = 56; const gap = 6
    for (let i = 0; i < 4; i++) {
      const col = i % 2; const row = Math.floor(i / 2)
      const px = M + col * (bW + gap); const py = y + row * (bH + gap)
      const photo = photos[i]
      doc.setDrawColor(200, 200, 200); doc.setFillColor(245, 245, 245)
      doc.roundedRect(px, py, bW, bH, 2, 2, 'FD')
      if (photo && photo.startsWith('data:')) {
        try { const fmt = photo.includes('png') ? 'PNG' : 'JPEG'; doc.addImage(photo, fmt, px + 1, py + 1, bW - 2, bH - 2) }
        catch { doc.setFontSize(8); doc.setTextColor(120); doc.text(`[Foto ${i + 1}]`, px + bW / 2 - 6, py + bH / 2) }
      } else { doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text(`Foto ${i + 1}`, px + bW / 2 - 6, py + bH / 2) }
    }

    y += Math.ceil(4 / 2) * (bH + gap) + 4; y = ensurePage(doc, y, 50)
    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Dados Fiscais', M, y); y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    y = wrap(doc, `Donativo: € ${report.donationAmount.toLocaleString('pt-PT')}`, M, y, contentW); y += 1
    y = wrap(doc, `Dedução IRC (140%): € ${report.irsDeduction.toLocaleString('pt-PT')}`, M, y, contentW); y += 1
    y = wrap(doc, `Poupança estimada: € ${report.ircSavings.toLocaleString('pt-PT')}`, M, y, contentW); y += 1
    y = wrap(doc, `Custo real: € ${(report.donationAmount - report.ircSavings).toFixed(2)}`, M, y, contentW)

    y += 8; y = ensurePage(doc, y, 30); doc.setFontSize(7); doc.setTextColor(100, 116, 139)
    y = wrap(doc, report.disclaimer, M, y, contentW, 4)

    if (report.reportTier.toLowerCase().includes('premium') && report.reportTier.toLowerCase().includes('redes')) {
      doc.addPage()
      const [ar, ag, ab] = hexToRgb(template.subAccent); doc.setFillColor(ar, ag, ab); doc.rect(0, 0, W, 28, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Conteúdos para Redes', M, 18)
      doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Mensagem', M, 40)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      wrap(doc, `${report.company} apoiou ${report.institution} com € ${report.donationAmount.toLocaleString('pt-PT')}. ${report.scores.beneficiaries.toLocaleString()} beneficiários.`, M, 48, contentW)
      doc.setFont('helvetica', 'bold'); doc.text('Sugestão LinkedIn', M, 68); doc.setFont('helvetica', 'normal')
      wrap(doc, `${report.scores.beneficiaries.toLocaleString()} pessoas impactadas. #ESG #Mecenato`, M, 76, contentW)
      doc.setFont('helvetica', 'bold'); doc.text('Sugestão Instagram', M, 98); doc.setFont('helvetica', 'normal')
      wrap(doc, `Impacto real. 100% do donativo entregue. `, M, 106, contentW)
    }

    // Forçar download manualmente em vez de usar doc.save()
    const pdfData = doc.output('datauristring').split(',')[1]
    forceDownload(pdfData, `relatorio-impacto-${report.reportId}.pdf`)
  } catch (err) {
    console.error(' Erro ao gerar PDF:', err)
    alert('Erro ao gerar o PDF: ' + (err instanceof Error ? err.message : String(err)))
  }
}
