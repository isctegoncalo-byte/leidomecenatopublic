const STRIPE_API = 'https://api.stripe.com/v1'

function readEnv(key) {
  return process.env[key] || ''
}

async function stripeRequest(method, path, body) {
  const secretKey = readEnv('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('Defina STRIPE_SECRET_KEY antes de correr este script.')
  }

  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body) : undefined,
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json.error?.message || JSON.stringify(json))
  }
  return json
}

const siteOrigin = readEnv('SITE_ORIGIN') || 'https://leidomecenato.pt'
const vatRate = 0.06
const withVat = amount => Math.round(amount * (1 + vatRate))
const productDescription = 'Serviço de relatório de impacto para donativos empresariais na plataforma leidomecenato.pt. Preço apresentado com IVA a 6%.'

const tiers = [
  { id: 'standard', env: 'VITE_STRIPE_PAYMENT_LINK_STANDARD', name: 'Relatório de Impacto Basic', baseAmount: 15000 },
  { id: 'premium', env: 'VITE_STRIPE_PAYMENT_LINK_PREMIUM', name: 'Relatório de Impacto Advanced', baseAmount: 25000 },
  { id: 'social', env: 'VITE_STRIPE_PAYMENT_LINK_SOCIAL', name: 'Relatório de Impacto 360º', baseAmount: 40000 },
]

async function listAll(path) {
  const all = []
  let startingAfter = ''
  do {
    const params = new URLSearchParams({ limit: '100' })
    if (startingAfter) params.set('starting_after', startingAfter)
    const page = await stripeRequest('GET', `${path}?${params.toString()}`)
    all.push(...page.data)
    startingAfter = page.has_more ? page.data.at(-1)?.id || '' : ''
  } while (startingAfter)
  return all
}

async function findPaymentLinkForPrice(priceId) {
  const links = await listAll('/payment_links')
  const activeLinks = links.filter(link => link.active)
  for (const link of activeLinks) {
    const lineItems = await stripeRequest('GET', `/payment_links/${link.id}/line_items?limit=100`)
    if (lineItems.data.some(item => item.price?.id === priceId)) return link
  }
  return null
}

async function listActivePaymentLinksForProduct(productId) {
  const links = await listAll('/payment_links')
  const activeLinks = links.filter(link => link.active)
  const matches = []
  for (const link of activeLinks) {
    const lineItems = await stripeRequest('GET', `/payment_links/${link.id}/line_items?limit=100`)
    if (lineItems.data.some(item => item.price?.product === productId)) matches.push(link)
  }
  return matches
}

const products = await listAll('/products')
const created = []

for (const tier of tiers) {
  let product = products.find(item => item.metadata?.pack_id === tier.id)

  if (!product) {
    product = await stripeRequest('POST', '/products', {
      name: tier.name,
      description: productDescription,
      'metadata[pack_id]': tier.id,
      'metadata[base_amount_eur_cents]': String(tier.baseAmount),
      'metadata[vat_rate]': String(vatRate),
    })
  } else if (product.name !== tier.name || product.description !== productDescription || product.metadata?.vat_rate !== String(vatRate)) {
    product = await stripeRequest('POST', `/products/${product.id}`, {
      name: tier.name,
      description: productDescription,
      'metadata[pack_id]': tier.id,
      'metadata[base_amount_eur_cents]': String(tier.baseAmount),
      'metadata[vat_rate]': String(vatRate),
    })
  }

  const prices = await stripeRequest('GET', `/prices?product=${product.id}&active=true&limit=100`)
  let price = prices.data.find(item => item.metadata?.pack_id === tier.id && item.unit_amount === withVat(tier.baseAmount))

  if (!price) {
    price = await stripeRequest('POST', '/prices', {
      product: product.id,
      currency: 'eur',
      unit_amount: String(withVat(tier.baseAmount)),
      'metadata[pack_id]': tier.id,
      'metadata[base_amount_eur_cents]': String(tier.baseAmount),
      'metadata[vat_amount_eur_cents]': String(withVat(tier.baseAmount) - tier.baseAmount),
      'metadata[vat_rate]': String(vatRate),
    })
  }

  let paymentLink = await findPaymentLinkForPrice(price.id)
  if (!paymentLink) {
    paymentLink = await stripeRequest('POST', '/payment_links', {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
      'metadata[pack_id]': tier.id,
      'metadata[report_tier]': tier.name,
      'after_completion[type]': 'redirect',
      'after_completion[redirect][url]': `${siteOrigin}/empresa/donativo?payment=success`,
    })
  }

  const activeLinks = await listActivePaymentLinksForProduct(product.id)
  for (const link of activeLinks) {
    if (link.id !== paymentLink.id) {
      await stripeRequest('POST', `/payment_links/${link.id}`, { active: 'false' })
    }
  }

  created.push({ ...tier, productId: product.id, priceId: price.id, url: paymentLink.url })
}

console.log('\nProdutos/links Stripe em produção:')
for (const tier of created) {
  console.log(`${tier.name}: product=${tier.productId}; price=${tier.priceId}; link=${tier.url}`)
}

console.log('\nVariáveis públicas para Netlify:')
for (const tier of created) {
  console.log(`${tier.env}=${tier.url}`)
}
