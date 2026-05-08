const paymentLinks: Record<string, string> = {
  standard: import.meta.env.VITE_STRIPE_PAYMENT_LINK_STANDARD || '',
  premium: import.meta.env.VITE_STRIPE_PAYMENT_LINK_PREMIUM || '',
  social: import.meta.env.VITE_STRIPE_PAYMENT_LINK_SOCIAL || '',
}

const genericPaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK_REPORTS || ''

export function getReportPaymentLink(tierId: string) {
  return paymentLinks[tierId] || genericPaymentLink
}

export function isPaymentLinkConfigured(tierId: string) {
  return Boolean(getReportPaymentLink(tierId))
}

export function buildPaymentUrl(baseUrl: string, params: Record<string, string | number | undefined>) {
  if (!baseUrl) return ''
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}
