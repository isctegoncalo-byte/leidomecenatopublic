const STRIPE_API = 'https://api.stripe.com/v1'

function readEnv(key) {
  return process.env[key] || ''
}

async function stripeRequest(path, body) {
  const secretKey = readEnv('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('Defina STRIPE_SECRET_KEY antes de correr este script.')
  }

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json.error?.message || JSON.stringify(json))
  }
  return json
}

const siteOrigin = readEnv('SITE_ORIGIN') || 'https://leidomecenato.pt'
const webhookUrl = readEnv('STRIPE_WEBHOOK_URL') || 'https://pucqlcfqkdxznjeoihkv.supabase.co/functions/v1/stripe-report-payment-webhook'
const vatRate = 0.06
const withVat = amount => Math.round(amount * (1 + vatRate))

const tiers = [
  { id: 'standard', env: 'VITE_STRIPE_PAYMENT_LINK_STANDARD', name: 'Relatório de Impacto Basic', baseAmount: 15000 },
  { id: 'premium', env: 'VITE_STRIPE_PAYMENT_LINK_PREMIUM', name: 'Relatório de Impacto Advanced', baseAmount: 25000 },
  { id: 'social', env: 'VITE_STRIPE_PAYMENT_LINK_SOCIAL', name: 'Relatório de Impacto 360º', baseAmount: 40000 },
]

const created = []

for (const tier of tiers) {
  const product = await stripeRequest('/products', {
    name: tier.name,
    description: 'Serviço de relatório de impacto para donativos empresariais na plataforma leidomecenato.pt. Preço apresentado com IVA a 6%.',
    'metadata[pack_id]': tier.id,
    'metadata[base_amount_eur_cents]': String(tier.baseAmount),
    'metadata[vat_rate]': String(vatRate),
  })

  const price = await stripeRequest('/prices', {
    product: product.id,
    currency: 'eur',
    unit_amount: String(withVat(tier.baseAmount)),
    'metadata[pack_id]': tier.id,
    'metadata[base_amount_eur_cents]': String(tier.baseAmount),
    'metadata[vat_amount_eur_cents]': String(withVat(tier.baseAmount) - tier.baseAmount),
    'metadata[vat_rate]': String(vatRate),
  })

  const paymentLink = await stripeRequest('/payment_links', {
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1',
    'metadata[pack_id]': tier.id,
    'metadata[report_tier]': tier.name,
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': `${siteOrigin}/empresa/donativo?payment=success`,
  })

  created.push({ ...tier, productId: product.id, priceId: price.id, url: paymentLink.url })
}

const webhook = await stripeRequest('/webhook_endpoints', {
  url: webhookUrl,
  'enabled_events[0]': 'checkout.session.completed',
  description: 'leidomecenato.pt - confirmação de compra de relatório de impacto',
})

console.log('\nVariáveis públicas para Netlify/local:')
for (const tier of created) {
  console.log(`${tier.env}=${tier.url}`)
}

console.log('\nSegredos para Supabase Edge Function:')
console.log('STRIPE_SECRET_KEY=<a mesma chave usada neste script>')
console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
console.log('RESEND_API_KEY=<chave Resend para envio de emails>')
console.log('REPORT_PURCHASE_FROM=Lei do Mecenato <geral@leidomecenato.pt>')

console.log('\nProdutos criados:')
for (const tier of created) {
  console.log(`- ${tier.name}: product=${tier.productId}; price=${tier.priceId}; link=${tier.url}`)
}
