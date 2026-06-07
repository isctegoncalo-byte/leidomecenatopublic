export type ReportPackId = 'standard' | 'premium' | 'social'

export interface ReportPurchaseEmailInput {
  packId: ReportPackId
  companyName: string
  companyNif?: string
  customerEmail: string
  institutionName?: string
  amountPaid: string
  receiptUrl?: string
}

const packConfirmation: Record<ReportPackId, { title: string; text: string; delivery: string }> = {
  standard: {
    title: 'Relatório de Impacto Basic',
    text: 'Confirmamos a compra do Relatório de Impacto Basic. A nossa equipa vai validar os dados do donativo e preparar o relatório base com resumo de impacto, ODS, dados fiscais e principais métricas.',
    delivery: 'Entrega prevista: até 10 dias úteis após validação do donativo pela empresa e pela instituição.',
  },
  premium: {
    title: 'Relatório de Impacto Advanced',
    text: 'Confirmamos a compra do Relatório de Impacto Advanced. Este pack inclui tudo do Basic, Impact Score (ISP™, ICS™, IROD™), narrativa personalizada, galeria e evidências visuais.',
    delivery: 'Entrega prevista: até 10 dias úteis após validação do donativo pela empresa e pela instituição.',
  },
  social: {
    title: 'Relatório de Impacto 360º',
    text: 'Confirmamos a compra do Relatório de Impacto 360º. Além do Relatório de Impacto Advanced, vamos preparar posts para comunicação nas Redes Sociais e um ficheiro TXT com o copy de cada rede social.',
    delivery: 'Entrega prevista: relatório até 10 dias úteis; pack de comunicação entregue em conjunto ou até 2 dias úteis depois.',
  },
}

export function buildReportPurchaseEmail(input: ReportPurchaseEmailInput) {
  const pack = packConfirmation[input.packId] || packConfirmation.premium
  const subject = `Confirmacao de compra - ${pack.title}`
  const institutionLine = input.institutionName
    ? `<p><strong>Instituição apoiada:</strong> ${input.institutionName}</p>`
    : ''
  const fiscalLine = input.companyNif
    ? `<p><strong>NIF/NIPC do adquirente:</strong> ${input.companyNif}</p>`
    : ''
  const receiptLine = input.receiptUrl
    ? `<p><a href="${input.receiptUrl}" style="color:#2563eb;font-weight:700;">Ver recibo de pagamento</a></p>`
    : '<p>O recibo sera enviado automaticamente pelo Stripe quando disponivel.</p>'

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;max-width:640px;margin:0 auto;">
      <div style="background:#0f172a;color:#fff;padding:28px;border-radius:16px 16px 0 0;">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#93c5fd;font-weight:700;">Lei do Mecenato</p>
        <h1 style="margin:0;font-size:24px;">Confirmacao de compra</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px;">
        <p>Ola, ${input.companyName || 'empresa'}.</p>
        <p>${pack.text}</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
          <p><strong>Pack adquirido:</strong> ${pack.title}</p>
          <p><strong>Adquirente:</strong> ${input.companyName || 'Empresa'}</p>
          ${fiscalLine}
          <p><strong>Valor pago:</strong> ${input.amountPaid}</p>
          ${institutionLine}
          <p><strong>Prazo:</strong> ${pack.delivery}</p>
        </div>
        ${receiptLine}
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;margin:20px 0;color:#92400e;font-size:13px;">
          <p style="margin:0 0 6px;font-weight:700;">Nota fiscal</p>
          <p style="margin:0;">O recibo Stripe confirma apenas o pagamento processado pela Stripe. A fatura-recibo fiscal do serviço será emitida separadamente pelo prestador através do Portal das Finanças, com os dados fiscais da empresa adquirente.</p>
        </div>
        <p>O donativo continua a ser feito diretamente entre empresa e instituição. Este pagamento diz respeito apenas ao serviço de relatório de impacto.</p>
        <p style="font-size:12px;color:#64748b;">Esta mensagem é automática. Para questões sobre o pedido, responda para geral@leidomecenato.pt.</p>
      </div>
    </div>
  `.trim()

  const text = [
    'Lei do Mecenato - Confirmacao de compra',
    '',
    `Ola, ${input.companyName || 'empresa'}.`,
    pack.text,
    '',
    `Pack adquirido: ${pack.title}`,
    `Adquirente: ${input.companyName || 'Empresa'}`,
    input.companyNif ? `NIF/NIPC do adquirente: ${input.companyNif}` : '',
    `Valor pago: ${input.amountPaid}`,
    input.institutionName ? `Instituição apoiada: ${input.institutionName}` : '',
    `Prazo: ${pack.delivery}`,
    input.receiptUrl ? `Recibo: ${input.receiptUrl}` : 'O recibo sera enviado automaticamente pelo Stripe quando disponivel.',
    'Nota fiscal: O recibo Stripe confirma apenas o pagamento processado pela Stripe. A fatura-recibo fiscal do serviço será emitida separadamente pelo prestador através do Portal das Finanças, com os dados fiscais da empresa adquirente.',
    '',
    'O donativo continua a ser feito diretamente entre empresa e instituição. Este pagamento diz respeito apenas ao serviço de relatório de impacto.',
  ].filter(Boolean).join('\n')

  return { subject, html, text }
}
