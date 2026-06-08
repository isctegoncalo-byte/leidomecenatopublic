import { ViewType } from '../types'

const CONSENT_KEY = 'leidomecenato_cookie_consent_v2'
const LEGACY_CONSENT_KEY = 'leidomecenato_cookie_consent_v1'
const CAMPAIGN_KEY = 'leidomecenato_campaign_attribution'

type CookieConsentValue = {
  essential: true
  analytics: boolean
  acceptedAt: string
  version: 2
}

type AnalyticsEventName =
  | 'page_view'
  | 'login_success'
  | 'logout'
  | 'click_find_project'
  | 'open_project'
  | 'filter_project_sdg'
  | 'start_company_registration'
  | 'start_institution_registration'
  | 'select_report_tier'
  | 'stripe_checkout_started'
  | 'donation_intent_created'
  | 'donation_confirmation_success'

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''
const SEARCH_CONSOLE_TOKEN = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || ''

function nowIso() {
  return new Date().toISOString()
}

function safeParse(raw: string | null): CookieConsentValue | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentValue>
    if (parsed.version === 2 && parsed.essential === true) {
      return {
        essential: true,
        analytics: Boolean(parsed.analytics),
        acceptedAt: parsed.acceptedAt || nowIso(),
        version: 2,
      }
    }
  } catch {
    return null
  }
  return null
}

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null
  const current = safeParse(localStorage.getItem(CONSENT_KEY))
  if (current) return current
  if (localStorage.getItem(LEGACY_CONSENT_KEY) === 'accepted') {
    const migrated: CookieConsentValue = {
      essential: true,
      analytics: false,
      acceptedAt: nowIso(),
      version: 2,
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(migrated))
    return migrated
  }
  return null
}

export function analyticsAllowed() {
  return Boolean(GA_ID && getCookieConsent()?.analytics)
}

export function setCookieConsent(analytics: boolean) {
  const consent: CookieConsentValue = {
    essential: true,
    analytics,
    acceptedAt: nowIso(),
    version: 2,
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent('leidomecenato:cookie-consent', { detail: consent }))
  if (analytics) initAnalytics()
}

function stripUnsafeParams(params: AnalyticsParams = {}) {
  const blocked = ['email', 'name', 'nif', 'phone', 'contact', 'amount', 'donation_amount', 'company', 'institution']
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      const normalized = key.toLowerCase()
      return !blocked.some(blockedKey => normalized.includes(blockedKey))
    })
  )
}

export function captureCampaignParams() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const campaign = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
    referrer: document.referrer ? new URL(document.referrer).hostname : '',
    capturedAt: nowIso(),
  }
  if (Object.values(campaign).some(Boolean)) {
    sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign))
  }
}

function appendSearchConsoleMeta() {
  if (!SEARCH_CONSOLE_TOKEN || document.querySelector('meta[name="google-site-verification"]')) return
  const meta = document.createElement('meta')
  meta.name = 'google-site-verification'
  meta.content = SEARCH_CONSOLE_TOKEN
  document.head.appendChild(meta)
}

export function initAnalytics() {
  if (typeof window === 'undefined') return
  appendSearchConsoleMeta()
  if (!analyticsAllowed()) return
  if (document.querySelector(`script[data-ga-id="${GA_ID}"]`)) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    anonymize_ip: true,
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  script.dataset.gaId = GA_ID
  document.head.appendChild(script)
}

export function trackPageView(view: ViewType, path = window.location.pathname) {
  if (!analyticsAllowed()) return
  initAnalytics()
  window.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href.split('?')[0],
    page_path: path,
    app_view: view,
  })
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsParams = {}) {
  if (!analyticsAllowed()) return
  initAnalytics()
  window.gtag?.('event', name, stripUnsafeParams(params))
}

