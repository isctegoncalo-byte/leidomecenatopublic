import Stripe from 'https://esm.sh/stripe@17.6.0?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('REPORT_PURCHASE_FROM') || 'Lei do Mecenato <geral@leidomecenato.pt>'

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null

type PackId = 'standard' | 'premium' | 'social'

const packConfirmation: Record<PackId, { title: string; text: string; delivery: string }> = {
  standard: {
    title: 'Relatorio de Impacto',
    text: 'Confirmamos a compra do Relatorio de Impacto. A nossa equipa vai validar os dados do donativo e preparar o relatorio base com resumo de impacto, ODS, dados fiscais e principais metricas.',
    delivery: 'Entrega prevista: ate 10 dias uteis apos validacao do donativo pela empresa e pela instituicao.',
  },
  premium: {
    title: 'Relatorio de Impacto Premium',
    text: 'Confirmamos a compra do Relatorio de Impacto Premium. Este pack inclui analise detalhada, Impact Score, narrativa de impacto, evidencias visuais, ODS, riscos ESG e dados prontos para relatorio de sustentabilidade.',
    delivery: 'Entrega prevista: ate 10 dias uteis apos validacao do donativo pela empresa e pela instituicao.',
  },
  social: {
    title: 'Relatorio de Impacto Premium + Pack Redes Sociais',
    text: 'Confirmamos a compra do Relatorio de Impacto Premium com Pack Redes Sociais. Alem do relatorio premium, vamos preparar textos e imagens para comunicacao institucional em Facebook, Instagram e LinkedIn.',
    delivery: 'Entrega prevista: relatorio ate 10 dias uteis; pack de comunicacao entregue em conjunto ou ate 2 dias uteis depois.',
  },
}

function detectPack(session: Stripe.Checkout.Session): PackId {
  const metadataPack = session.metadata?.pack_id as PackId | undefined
  if (metadataPack && packConfirmation[metadataPack]) return metadataPack
  const description = `${session.metadata?.report_tier || ''} ${session.metadata?.pack || ''}`.toLowerCase()
  if (description.includes('social') || description.includes('redes')) return 'social'
  if (description.includes('premium')) return 'premium'
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

function buildEmail(input: {
  packId: PackId
  companyName: string
  customerEmail: string
  institutionName?: string
  amountPaid: string
  receiptUrl?: string
}) {
  const pack = packConfirmation[input.packId]
  const institutionLine = input.institutionName
    ? `<p><strong>Instituicao apoiada:</strong> ${input.institutionName}</p>`
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
            <p><strong>Valor pago:</strong> ${input.amountPaid}</p>
            ${institutionLine}
            <p><strong>Prazo:</strong> ${pack.delivery}</p>
          </div>
          ${receiptLine}
          <p>O donativo continua a ser feito diretamente entre empresa e instituicao. Este pagamento diz respeito apenas ao servico de relatorio de impacto.</p>
          <p style="font-size:12px;color:#64748b;">Esta mensagem e automatica. Para questoes sobre o pedido, responda para geral@leidomecenato.pt.</p>
        </div>
      </div>
    `,
  }
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
  const email = buildEmail({
    packId,
    customerEmail,
    companyName: session.metadata?.company_name || session.customer_details?.name || '',
    institutionName: session.metadata?.institution_name || '',
    amountPaid: money(session.amount_total, session.currency),
    receiptUrl,
  })

  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: email.subject,
      html: email.html,
    }),
  })

  if (!result.ok) {
    return Response.json({ ok: false, error: await result.text() }, { status: 500 })
  }

  return Response.json({ ok: true })
})
