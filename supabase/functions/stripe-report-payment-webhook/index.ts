import Stripe from 'https://esm.sh/stripe@17.6.0?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('REPORT_PURCHASE_FROM') || 'Lei do Mecenato <geral@leidomecenato.pt>'
const INTERNAL_PAYMENT_EMAIL = Deno.env.get('REPORT_PURCHASE_INTERNAL_EMAIL') || 'geral@leidomecenato.pt'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

type PackId = 'standard' | 'premium' | 'social'

const packConfirmation: Record<PackId, { title: string; text: string; delivery: string }> = {
  standard: {
    title: 'Relatorio de Impacto Basic',
    text: 'Confirmamos a compra do Relatorio de Impacto Basic. A nossa equipa vai validar os dados do donativo e preparar o relatorio base com resumo de impacto, ODS, dados fiscais e principais metricas.',
    delivery: 'Entrega prevista: ate 10 dias uteis apos validacao do donativo pela empresa e pela instituicao.',
  },
  premium: {
    title: 'Relatorio de Impacto Advanced',
    text: 'Confirmamos a compra do Relatorio de Impacto Advanced. Este pack inclui tudo do Basic, Impact Score (ISP, ICS, IROD), narrativa personalizada, galeria e evidencias visuais.',
    delivery: 'Entrega prevista: ate 10 dias uteis apos validacao do donativo pela empresa e pela instituicao.',
  },
  social: {
    title: 'Relatorio de Impacto 360º',
    text: 'Confirmamos a compra do Relatorio de Impacto 360º. Alem do Relatorio de Impacto Advanced, vamos preparar posts para comunicacao nas Redes Sociais e um ficheiro TXT com o copy de cada rede social.',
    delivery: 'Entrega prevista: relatorio ate 10 dias uteis; pack de comunicacao entregue em conjunto ou ate 2 dias uteis depois.',
  },
}

const packAmounts: Record<PackId, { base: number; vat: number; total: number }> = {
  standard: { base: 150, vat: 9, total: 159 },
  premium: { base: 250, vat: 15, total: 265 },
  social: { base: 400, vat: 24, total: 424 },
}

function detectPack(session: Stripe.Checkout.Session): PackId {
  const metadataPack = session.metadata?.pack_id as PackId | undefined
  if (metadataPack && packConfirmation[metadataPack]) return metadataPack
  const description = `${session.metadata?.report_tier || ''} ${session.metadata?.pack || ''}`.toLowerCase()
  if (description.includes('360') || description.includes('social') || description.includes('redes')) return 'social'
  if (description.includes('advanced') || description.includes('premium')) return 'premium'
  return 'standard'
}

function money(amount?: number | null, currency?: string | null) {
  const value = ((amount || 0) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${value} ${(currency || 'eur').toUpperCase()}`
}

async function getReceiptUrl(session: Stripe.Checkout.Session) {
  if (!stripe || !session.payment_intent) return ''
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
  const charges = await stripe.charges.list({ payment_intent: paymentIntentId, limit: 1 })
  return charges.data[0]?.receipt_url || ''
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) return ''
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
}

function customerId(session: Stripe.Checkout.Session) {
  if (!session.customer) return ''
  return typeof session.customer === 'string' ? session.customer : session.customer.id
}

async function persistTransaction(session: Stripe.Checkout.Session, packId: PackId, receiptUrl: string, companyNif: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return

  const contractId = session.client_reference_id || session.metadata?.contract_id || session.id
  const pack = packConfirmation[packId]
  const amounts = packAmounts[packId]
  const payload = {
    contract_id: contractId,
    company_name: session.metadata?.company_name || session.customer_details?.name || '',
    company_nif: companyNif || '',
    company_email: (session.customer_details?.email || session.customer_email || '').toLowerCase(),
    institution_name: session.metadata?.institution_name || '',
    report_tier_id: packId,
    report_tier_name: session.metadata?.report_tier || pack.title,
    report_price: amounts.base,
    report_vat: amounts.vat,
    report_total: amounts.total,
    payment_provider: 'stripe',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId(session),
    stripe_customer_id: customerId(session),
    stripe_receipt_url: receiptUrl || null,
    status: 'paid',
    currency: session.currency || 'eur',
    amount_subtotal_cents: session.amount_subtotal || null,
    amount_tax_cents: (session.total_details?.amount_tax ?? null),
    amount_total_cents: session.amount_total || null,
    raw_event: {
      mode: session.mode,
      payment_status: session.payment_status,
      customer_details: session.customer_details,
      metadata: session.metadata,
    },
    updated_at: new Date().toISOString(),
  }

  const result = await fetch(`${SUPABASE_URL}/rest/v1/transactions?on_conflict=contract_id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  })

  if (!result.ok) {
    console.warn('Nao foi possivel persistir transacao Stripe:', await result.text())
  }
}

function buildEmail(input: {
  packId: PackId
  companyName: string
  companyNif?: string
  customerEmail: string
  institutionName?: string
  amountPaid: string
  receiptUrl?: string
}) {
  const pack = packConfirmation[input.packId]
  const institutionLine = input.institutionName
    ? `<p><strong>Instituicao apoiada:</strong> ${input.institutionName}</p>`
    : ''
  const fiscalLine = input.companyNif
    ? `<p><strong>NIF/NIPC do adquirente:</strong> ${input.companyNif}</p>`
    : ''
  const receiptLine = input.receiptUrl
    ? `<p><a href="${input.receiptUrl}" style="color:#2563eb;font-weight:700;">Ver recibo de pagamento</a></p>`
    : '<p>O recibo sera enviado automaticamente pelo Stripe quando disponivel.</p>'

  return {
    subject: `Confirmacao de compra - ${pack.title}`,
    html: `
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
            <p style="margin:0;">O recibo Stripe confirma apenas o pagamento processado pela Stripe. A fatura-recibo fiscal do servico sera emitida separadamente pelo prestador atraves do Portal das Financas, com os dados fiscais da empresa adquirente.</p>
          </div>
          <p>O donativo continua a ser feito diretamente entre empresa e instituicao. Este pagamento diz respeito apenas ao servico de relatorio de impacto.</p>
          <p style="font-size:12px;color:#64748b;">Esta mensagem e automatica. Para questoes sobre o pedido, responda para geral@leidomecenato.pt.</p>
        </div>
      </div>
    `,
  }
}

function buildInternalEmail(input: {
  packId: PackId
  companyName: string
  companyNif?: string
  customerEmail: string
  institutionName?: string
  amountPaid: string
  receiptUrl?: string
  contractId: string
  checkoutSessionId: string
  paymentIntentId?: string
}) {
  const pack = packConfirmation[input.packId]
  const receiptLine = input.receiptUrl
    ? `<p><strong>Recibo Stripe:</strong> <a href="${input.receiptUrl}" style="color:#2563eb;font-weight:700;">abrir recibo</a></p>`
    : '<p><strong>Recibo Stripe:</strong> ainda nao disponivel.</p>'

  return {
    subject: `Pagamento recebido - ${pack.title} - ${input.companyName || input.customerEmail}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;max-width:680px;margin:0 auto;">
        <div style="background:#111827;color:#fff;padding:24px;border-radius:14px 14px 0 0;">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#93c5fd;font-weight:700;">Lei do Mecenato</p>
          <h1 style="margin:0;font-size:22px;">Pagamento de relatorio recebido</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 14px 14px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:18px;">
            <p><strong>Empresa:</strong> ${input.companyName || 'Nao indicada'}</p>
            <p><strong>NIF/NIPC:</strong> ${input.companyNif || 'Nao indicado'}</p>
            <p><strong>Email:</strong> ${input.customerEmail}</p>
            <p><strong>Pack:</strong> ${pack.title}</p>
            <p><strong>Valor pago:</strong> ${input.amountPaid}</p>
            ${input.institutionName ? `<p><strong>Instituicao associada:</strong> ${input.institutionName}</p>` : ''}
            <p><strong>Contrato:</strong> ${input.contractId}</p>
            <p><strong>Stripe Checkout Session:</strong> ${input.checkoutSessionId}</p>
            ${input.paymentIntentId ? `<p><strong>Payment Intent:</strong> ${input.paymentIntentId}</p>` : ''}
            ${receiptLine}
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e;">
            <p style="margin:0 0 6px;font-weight:700;">Acao interna necessaria</p>
            <p style="margin:0;">Emitir a fatura-recibo no Portal das Financas em nome da empresa pagadora, usando os dados fiscais acima. Depois atualizar o estado da fatura-recibo na area admin da plataforma.</p>
          </div>
        </div>
      </div>
    `,
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!stripe || !STRIPE_WEBHOOK_SECRET || !RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'Missing Stripe or Resend env vars' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ ok: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const customerEmail = session.customer_details?.email || session.customer_email || ''
  if (!customerEmail) return Response.json({ ok: false, error: 'Missing customer email' }, { status: 400 })

  const packId = detectPack(session)
  const receiptUrl = await getReceiptUrl(session)
  const companyNif = session.customer_details?.tax_ids?.[0]?.value || session.metadata?.company_nif || ''
  const contractId = session.client_reference_id || session.metadata?.contract_id || session.id
  const stripePaymentIntentId = paymentIntentId(session)
  await persistTransaction(session, packId, receiptUrl, companyNif)
  const email = buildEmail({
    packId,
    customerEmail,
    companyName: session.metadata?.company_name || session.customer_details?.name || '',
    companyNif,
    institutionName: session.metadata?.institution_name || '',
    amountPaid: money(session.amount_total, session.currency),
    receiptUrl,
  })
  const internalEmail = buildInternalEmail({
    packId,
    customerEmail,
    companyName: session.metadata?.company_name || session.customer_details?.name || '',
    companyNif,
    institutionName: session.metadata?.institution_name || '',
    amountPaid: money(session.amount_total, session.currency),
    receiptUrl,
    contractId,
    checkoutSessionId: session.id,
    paymentIntentId: stripePaymentIntentId,
  })

  const result = await sendEmail(customerEmail, email.subject, email.html)

  if (!result.ok) {
    return Response.json({ ok: false, error: await result.text() }, { status: 500 })
  }
  const internalResult = await sendEmail(INTERNAL_PAYMENT_EMAIL, internalEmail.subject, internalEmail.html)
  if (!internalResult.ok) {
    console.warn('Falha ao enviar email interno de pagamento:', await internalResult.text())
  }

  return Response.json({ ok: true })
})
