import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_REGISTRATION_EMAIL') || 'geral@leidomecenato.pt'
const FROM_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_FROM') || 'Lei do Mecenato <geral@leidomecenato.pt>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RegistrationPayload = {
  role?: string
  email?: string
  name?: string
  nif?: string
  companyActivity?: string
  institutionLegalName?: string
  institutionCategory?: string
  registeredAt?: string
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

function clean(value?: string) {
  return String(value || '').trim().slice(0, 240)
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })
}

function buildText(rows: string[][]) {
  return [
    'Novo registo na plataforma Lei do Mecenato.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')
}

function buildRegistrationEmail(rows: string[][], name: string, role: string) {
  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:11px 14px;border-bottom:1px solid #e4ebf3;font-size:13px;font-weight:700;color:#415466;width:38%;">${escapeHtml(label)}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #e4ebf3;font-size:14px;color:#172033;">${escapeHtml(value)}</td>
    </tr>
  `).join('')

  return {
    subject: `Novo registo: ${name || role}`,
    text: buildText(rows),
    html: `
      <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f5f7fb;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:680px;background:#ffffff;border:1px solid #dfe6ef;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;background:#12313f;color:#ffffff;">
                    <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#a8d8c7;font-weight:700;">Lei do Mecenato</p>
                    <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;">Novo registo na plataforma</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 32px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#34495e;">Foi criada uma nova conta e os dados iniciais foram submetidos para acompanhamento administrativo.</p>
                    <div style="display:inline-block;background:#eef8f4;border:1px solid #cfe9df;color:#1f654f;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;margin:0 0 20px;">${escapeHtml(role)}</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e4ebf3;border-radius:10px;overflow:hidden;">
                      ${htmlRows}
                    </table>
                    <div style="background:#f8fafc;border:1px solid #e4ebf3;border-radius:10px;padding:16px;margin-top:22px;">
                      <p style="margin:0;font-size:14px;line-height:1.55;color:#53657a;">Próximo passo sugerido: validar o perfil na área de administração e confirmar se os documentos obrigatórios foram submetidos.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e4ebf3;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#738299;">Mensagem automática enviada para ${escapeHtml(ADMIN_EMAIL)}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  }
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

  let payload: RegistrationPayload
  try {
    payload = await req.json() as RegistrationPayload
  } catch {
    return badRequest('Invalid JSON')
  }
  const email = clean(payload.email).toLowerCase()
  const name = clean(payload.name)
  const nif = clean(payload.nif)
  if (!validEmail(email) || email !== user.email.toLowerCase()) return badRequest('Invalid registration email')
  if (!name || !/^\d{9}$/.test(nif)) return badRequest('Invalid registration payload')

  const role = payload.role === 'instituicao' ? 'Instituição' : 'Empresa'
  const rows = [
    ['Tipo', role],
    ['Nome', name],
    ['Email', email],
    ['NIF', nif],
    ['Setor de atividade', clean(payload.companyActivity)],
    ['Denominação legal', clean(payload.institutionLegalName)],
    ['Área de atuação', clean(payload.institutionCategory)],
    ['Data de registo', formatDate(payload.registeredAt)],
  ].filter(([, value]) => Boolean(value))
  const emailContent = buildRegistrationEmail(rows, name || email, role)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return Response.json({ ok: false, error: text }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ ok: true }, { headers: corsHeaders })
})
