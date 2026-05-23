import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'email-previews')
const AUTH_DIR = path.join(ROOT, 'supabase', 'email-templates')

const samples = {
  '{{ .ConfirmationURL }}': 'https://leidomecenato.pt/entrar#token-exemplo',
  '{{ .SiteURL }}': 'https://leidomecenato.pt',
  '{{ .Email }}': 'teste@leidomecenato.pt',
  '{{ .NewEmail }}': 'novo-email@leidomecenato.pt',
}

const authTemplates = [
  ['confirm-signup.html', 'Confirmacao de conta'],
  ['reset-password.html', 'Recuperacao de palavra-passe'],
  ['invite-user.html', 'Convite de utilizador'],
  ['magic-link.html', 'Magic link'],
  ['change-email.html', 'Alteracao de email'],
]

function renderSupabaseTemplate(html) {
  return Object.entries(samples).reduce((out, [key, value]) => out.replaceAll(key, value), html)
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function shell(title, body) {
  return `<!doctype html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#eef2f7;padding:24px;">
    ${body}
  </body>
</html>`
}

function row(label, value) {
  return `<tr>
    <td style="padding:11px 14px;border-bottom:1px solid #e4ebf3;font-size:13px;font-weight:700;color:#415466;width:38%;">${escapeHtml(label)}</td>
    <td style="padding:11px 14px;border-bottom:1px solid #e4ebf3;font-size:14px;color:#172033;">${escapeHtml(value)}</td>
  </tr>`
}

function registrationNotificationPreview() {
  const rows = [
    ['Tipo', 'Empresa'],
    ['Nome', 'Empresa Teste, SA'],
    ['Email', 'teste@leidomecenato.pt'],
    ['NIF', '514789321'],
    ['Setor de atividade', 'Tecnologia'],
    ['Data de registo', '23/05/2026, 10:30'],
  ].map(([label, value]) => row(label, value)).join('')

  return shell('Novo registo na plataforma', `
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
                  <div style="display:inline-block;background:#eef8f4;border:1px solid #cfe9df;color:#1f654f;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;margin:0 0 20px;">Empresa</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e4ebf3;border-radius:10px;overflow:hidden;">${rows}</table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`)
}

function donationNotificationPreview() {
  const body = `A empresa Empresa Teste, SA (NIF 514789321) submeteu um donativo à instituição Instituição Teste, no valor indicado de EUR 5.000,00, com comprovativo associado.

O comprovativo está disponível na aba "Donativos" da área privada. Para validar o donativo, a instituição deve confirmar o valor recebido e submeter o recibo/declaração de donativo ao abrigo da Lei do Mecenato.`

  const rows = [
    ['Empresa', 'Empresa Teste, SA'],
    ['Email da empresa', 'teste@leidomecenato.pt'],
    ['NIF da empresa', '514789321'],
    ['Associacao', 'Instituição Teste'],
    ['Tipo de donativo', 'Apoio financeiro'],
    ['Valor indicado', 'EUR 5.000,00'],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#334155;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>`).join('')

  const notificationHtml = escapeHtml(body)
    .split(/\n{2,}/)
    .map(paragraph => `<p style="margin:0 0 14px;white-space:pre-line;">${paragraph}</p>`)
    .join('')

  return shell('Novo donativo confirmado pela empresa', `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;background:#ffffff;padding:28px;border-radius:16px;">
      <h1 style="font-size:22px;margin-bottom:8px;">Novo donativo confirmado pela empresa</h1>
      <p style="color:#475569;">A mesma notificacao criada para a pagina da associacao foi tambem enviada para acompanhamento geral da plataforma.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:18px 0;line-height:1.55;">${notificationHtml}</div>
      <table style="width:100%;border-collapse:collapse;margin-top:18px;border:1px solid #e2e8f0;">${rows}</table>
    </div>`)
}

function reportPurchasePreview(pack = 'premium') {
  const packs = {
    standard: ['Relatorio de Impacto', 'Confirmamos a compra do Relatorio de Impacto. A nossa equipa vai validar os dados do donativo e preparar o relatorio base com resumo de impacto, ODS, dados fiscais e principais metricas.'],
    premium: ['Relatorio de Impacto Premium', 'Confirmamos a compra do Relatorio de Impacto Premium. Este pack inclui analise detalhada, narrativa de impacto, evidencias visuais, ODS e dados prontos para relatorio de sustentabilidade.'],
    social: ['Relatorio de Impacto Premium + Pack Redes Sociais', 'Confirmamos a compra do Relatorio de Impacto Premium com Pack Redes Sociais. Alem do relatorio premium, vamos preparar textos e imagens para comunicacao institucional.'],
  }
  const [title, text] = packs[pack]
  return shell(`Confirmacao de compra - ${title}`, `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;">
      <div style="background:#0f172a;color:#fff;padding:28px;border-radius:16px 16px 0 0;">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#93c5fd;font-weight:700;">Lei do Mecenato</p>
        <h1 style="margin:0;font-size:24px;">Confirmacao de compra</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px;">
        <p>Ola, Empresa Teste, SA.</p>
        <p>${escapeHtml(text)}</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
          <p><strong>Pack adquirido:</strong> ${escapeHtml(title)}</p>
          <p><strong>Valor pago:</strong> 199,00 EUR</p>
          <p><strong>Instituicao apoiada:</strong> Instituição Teste</p>
          <p><strong>Prazo:</strong> Entrega prevista: ate 10 dias uteis apos validacao do donativo pela empresa e pela instituicao.</p>
        </div>
      </div>
    </div>`)
}

await mkdir(OUT, { recursive: true })

const previews = []
for (const [file, label] of authTemplates) {
  const raw = await readFile(path.join(AUTH_DIR, file), 'utf8')
  const rendered = renderSupabaseTemplate(raw)
  const outFile = `auth-${file}`
  await writeFile(path.join(OUT, outFile), rendered)
  previews.push([label, outFile])
}

const generated = [
  ['Notificacao de novo registo para admin', 'function-registration-notification.html', registrationNotificationPreview()],
  ['Notificacao de donativo para admin', 'function-donation-notification.html', donationNotificationPreview()],
  ['Confirmacao compra relatorio standard', 'function-report-purchase-standard.html', reportPurchasePreview('standard')],
  ['Confirmacao compra relatorio premium', 'function-report-purchase-premium.html', reportPurchasePreview('premium')],
  ['Confirmacao compra relatorio social', 'function-report-purchase-social.html', reportPurchasePreview('social')],
]

for (const [label, file, html] of generated) {
  await writeFile(path.join(OUT, file), html)
  previews.push([label, file])
}

const index = shell('Previews de emails - Lei do Mecenato', `
  <main style="max-width:900px;margin:0 auto;font-family:Arial,sans-serif;color:#0f172a;background:#fff;border:1px solid #dfe6ef;border-radius:16px;padding:28px;">
    <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.08em;color:#2f7d68;font-size:12px;font-weight:700;">Lei do Mecenato</p>
    <h1 style="margin:0 0 12px;">Previews de emails</h1>
    <p style="margin:0 0 24px;color:#475569;">Estes ficheiros servem para validacao visual local. Os envios reais dependem da configuracao Supabase Auth, SMTP e Resend.</p>
    <ul style="display:grid;gap:10px;padding:0;list-style:none;">
      ${previews.map(([label, file]) => `<li><a href="./${file}" style="display:block;padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;color:#0f172a;text-decoration:none;font-weight:700;">${escapeHtml(label)}</a></li>`).join('')}
    </ul>
  </main>`)

await writeFile(path.join(OUT, 'index.html'), index)

console.log(`Email previews generated in ${OUT}`)
