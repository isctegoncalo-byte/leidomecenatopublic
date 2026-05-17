import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_DONATION_EMAIL') || 'geral@leidomecenato.org'
const FROM_EMAIL = Deno.env.get('DONATION_NOTIFICATION_FROM') || Deno.env.get('ADMIN_NOTIFICATION_FROM') || 'Lei do Mecenato <geral@leidomecenato.org>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type DonationPayload = {
  contractId?: string
  companyName?: string
  companyNif?: string
  companyEmail?: string
  institutionName?: string
  donationType?: 'dinheiro' | 'produtos' | null
  donationAmount?: number
  donationDate?: string
  reportTier?: string
  reportPrice?: number
  donationMode?: string
  notificationTitle?: string
  notificationBody?: string
  createdAt?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function badRequest(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status, headers: corsHeaders })
}

function clean(value?: string, max = 240) {
  return String(value || '').trim().slice(0, max)
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function money(value?: number) {
  return `EUR ${(Number(value) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function notificationHtml(body: string) {
  return escapeHtml(body)
    .split(/\n{2,}/)
    .map(paragraph => `<p style="margin:0 0 14px;white-space:pre-line;">${paragraph}</p>`)
    .join('')
}

async function getAuthenticatedUser(req: Request) {
  const authorization = req.headers.get('authorization') || ''
  if (!authorization.toLowerCase().startsWith('bearer ')) return null
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Response.json({ ok: false, error: 'Missing server env vars' }, { status: 500, headers: corsHeaders })
  }

  const user = await getAuthenticatedUser(req)
  if (!user?.email) return badRequest('Unauthorized', 401)

  let payload: DonationPayload
  try {
    payload = await req.json() as DonationPayload
  } catch {
    return badRequest('Invalid JSON')
  }

  const companyEmail = clean(payload.companyEmail).toLowerCase()
  const companyName = clean(payload.companyName)
  const companyNif = clean(payload.companyNif)
  const institutionName = clean(payload.institutionName)
  const contractId = clean(payload.contractId)
  const notificationTitle = clean(payload.notificationTitle) || 'Novo donativo confirmado pela empresa'
  const notificationBody = clean(payload.notificationBody, 5000)
  const amount = Number(payload.donationAmount) || 0

  if (!validEmail(companyEmail) || companyEmail !== user.email.toLowerCase()) return badRequest('Invalid company email')
  if (!companyName || !/^\d{9}$/.test(companyNif) || !institutionName || amount <= 0) return badRequest('Invalid donation payload')

  const donationType = payload.donationType === 'produtos' ? 'Produtos/servicos' : 'Apoio financeiro'
  const rows = [
    ['Empresa', companyName],
    ['Email da empresa', companyEmail],
    ['NIF da empresa', companyNif],
    ['Associacao', institutionName],
    ['Tipo de donativo', donationType],
    ['Valor indicado', money(amount)],
    ['Data do donativo', payload.donationDate ? new Date(payload.donationDate).toLocaleDateString('pt-PT') : ''],
    ['Contrato', contractId],
    ['Pack de relatorio', clean(payload.reportTier)],
    ['Preco do relatorio', money(payload.reportPrice)],
    ['Modo de donativo', clean(payload.donationMode)],
    ['Criado em', payload.createdAt ? new Date(payload.createdAt).toLocaleString('pt-PT') : ''],
  ].filter(([, value]) => Boolean(value))

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#334155;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>
  `).join('')

  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: notificationTitle,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
          <h1 style="font-size:22px;margin-bottom:8px;">${escapeHtml(notificationTitle)}</h1>
          <p style="color:#475569;">A mesma notificacao criada para a pagina da associacao foi tambem enviada para acompanhamento geral da plataforma.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:18px 0;line-height:1.55;">
            ${notificationBody ? notificationHtml(notificationBody) : `<p style="margin:0;">${escapeHtml(companyName)} confirmou um donativo para ${escapeHtml(institutionName)}.</p>`}
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:18px;border:1px solid #e2e8f0;">
            ${htmlRows}
          </table>
        </div>
      `,
    }),
  })

  if (!result.ok) {
    return Response.json({ ok: false, error: await result.text() }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ ok: true }, { headers: corsHeaders })
})
