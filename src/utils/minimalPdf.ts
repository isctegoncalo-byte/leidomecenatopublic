// PDF mínimo: gera um documento simples com jsPDF
import jsPDF from 'jspdf'

function downloadBinaryPdf(pdfString: string, filename: string) {
  const binary = atob(pdfString.split(',')[1])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
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
}

export function generateMinimalPdf(): boolean {
  try {
    const doc = new jsPDF()
    doc.setFontSize(24)
    doc.text('Relatório de Impacto do Donativo', 20, 30)
    doc.setFontSize(12)
    doc.text('Exemplo de demonstração', 20, 50)
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(20, 55, 190, 55)
    doc.setFontSize(10)
    doc.text('Empresa: TechGlobal Portugal, SA', 20, 68)
    doc.text('NIF: 514 789 321', 20, 75)
    doc.text('Instituição: Associação Crescer Juntos', 20, 82)
    doc.text('Donativo: 10.000 EUR (100% para a instituição)', 20, 89)
    doc.text('', 20, 96)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('métricas de impacto', 20, 106)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Beneficiários: 1.200', 20, 113)
    doc.text('Beneficiários: 1.200', 20, 120)
    doc.text('Dedução IRC 140%: 14.000 EUR', 20, 127)
    doc.text('Poupança estimada: 2.940 EUR', 20, 134)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Este é um exemplo de demonstração com dados simulados.', 20, 150)
    doc.text('Na versão final, este relatório inclui fotografias, análise ESG detalhada e conteúdos para redes.', 20, 157)

    // Gerar como dataurlstring e forçar download
    const dataUrl = doc.output('datauristring')
    downloadBinaryPdf(dataUrl, 'relatorio-exemplo-lei-do-mecenato.pdf')
    return true
  } catch (e) {
    console.error('PDF generation failed:', e)
    alert('Erro ao gerar PDF: ' + (e instanceof Error ? e.message : String(e)))
    return false
  }
}
