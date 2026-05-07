const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_REGISTRATION_EMAIL') || 'geral@leidomecenato.pt'
const FROM_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_FROM') || 'Lei do Mecenato <geral@leidomecenato.pt>'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  if (!RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'Missing RESEND_API_KEY' }, { status: 500, headers: corsHeaders })
  }

  const payload = await req.json() as RegistrationPayload
  const role = payload.role === 'instituicao' ? 'Instituicao' : 'Empresa'
  const rows = [
    ['Tipo', role],
    ['Nome', payload.name || ''],
    ['Email', payload.email || ''],
    ['NIF', payload.nif || ''],
    ['Setor de atividade', payload.companyActivity || ''],
    ['Denominacao legal', payload.institutionLegalName || ''],
    ['Area de atuacao', payload.institutionCategory || ''],
    ['Data de registo', payload.registeredAt ? new Date(payload.registeredAt).toLocaleString('pt-PT') : ''],
  ].filter(([, value]) => Boolean(value))

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#334155;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>
  `).join('')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `Novo registo na plataforma: ${payload.name || payload.email || role}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
          <h1 style="font-size:22px;margin-bottom:8px;">Novo registo na plataforma</h1>
          <p style="color:#475569;">Foi criada uma nova conta na plataforma Lei do Mecenato.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:18px;border:1px solid #e2e8f0;">
            ${htmlRows}
          </table>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return Response.json({ ok: false, error: text }, { status: 500, headers: corsHeaders })
  }

  return Response.json({ ok: true }, { headers: corsHeaders })
})
