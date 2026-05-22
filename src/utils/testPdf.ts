// Teste mínimo: um PDF simples com jsPDF
// Se isto não funcionar, o problema é com o jsPDF import
import jsPDF from 'jspdf'

export function testPdf() {
  try {
    console.log(' A iniciar teste de PDF...')
    console.log('jsPDF:', typeof jsPDF)
    const doc = new jsPDF()
    console.log(' jsPDF instanciado')
    doc.setFontSize(20)
    doc.text('Teste PDF', 20, 30)
    doc.setFontSize(12)
    doc.text('Se estás a ler isto, o jsPDF funciona.', 20, 50)
    doc.save('test-pdf.pdf')
    console.log(' PDF guardado com sucesso')
  } catch (err) {
    console.error(' ERRO ao gerar PDF:', err)
    alert('Erro ao gerar PDF: ' + err)
  }
}
