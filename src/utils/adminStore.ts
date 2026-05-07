import { ReportTemplate, reportTemplates as defaultReportTemplates, defaultReportAdvanced } from '../templates/reportTemplates'
import { SocialTemplate, socialTemplates as defaultSocialTemplates } from '../templates/socialTemplates'

const ADMIN_PIN = 'mecenato2025'
const RT_KEY = 'leidomecenato_report_templates'
const ST_KEY = 'leidomecenato_social_templates'
const ADMIN_SESSION = 'leidomecenato_admin'

export function adminLogin(pin: string): boolean {
  if (pin === ADMIN_PIN) {
    localStorage.setItem(ADMIN_SESSION, '1')
    return true
  }
  return false
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION)
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(ADMIN_SESSION) === '1'
}

// ─── Report templates ────────────────────────────
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}

export function getReportTemplates(): ReportTemplate[] {
  return readJson<ReportTemplate[]>(RT_KEY, defaultReportTemplates).map(template => ({
    ...defaultReportAdvanced,
    ...template,
    sections: template.sections || defaultReportTemplates[0].sections,
  }))
}

export function saveReportTemplate(template: ReportTemplate) {
  const all = getReportTemplates().filter(t => t.id !== template.id)
  localStorage.setItem(RT_KEY, JSON.stringify([...all, template]))
}

export function deleteReportTemplate(id: string) {
  const all = getReportTemplates().filter(t => t.id !== id)
  localStorage.setItem(RT_KEY, JSON.stringify(all))
}

export function resetReportTemplates() {
  localStorage.removeItem(RT_KEY)
}

// ─── Social templates ────────────────────────────
export function getSocialTemplates(): SocialTemplate[] {
  return readJson<SocialTemplate[]>(ST_KEY, defaultSocialTemplates)
}

export function saveSocialTemplate(template: SocialTemplate) {
  const all = getSocialTemplates().filter(t => t.id !== template.id)
  localStorage.setItem(ST_KEY, JSON.stringify([...all, template]))
}

export function deleteSocialTemplate(id: string) {
  const all = getSocialTemplates().filter(t => t.id !== id)
  localStorage.setItem(ST_KEY, JSON.stringify(all))
}

export function resetSocialTemplates() {
  localStorage.removeItem(ST_KEY)
}
