import { ImpactContract, PlatformNotification, ViewType } from '../types'

const NOTIFICATIONS_KEY = 'leidomecenato_notifications'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listNotifications(): PlatformNotification[] {
  return readJson<PlatformNotification[]>(NOTIFICATIONS_KEY, [])
}

export function saveNotification(notification: PlatformNotification) {
  const all = listNotifications().filter(n => n.id !== notification.id)
  writeJson(NOTIFICATIONS_KEY, [...all, notification])
}

export function createNotification(input: Omit<PlatformNotification, 'id' | 'createdAt' | 'read'>) {
  const notification: PlatformNotification = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  }
  saveNotification(notification)
  return notification
}

export function listNotificationsForAccount(accountId: string, role?: 'empresa' | 'instituicao', name?: string) {
  return listNotifications().filter(n =>
    n.recipientAccountId === accountId ||
    (!!role && n.recipientRole === role && !n.recipientAccountId) ||
    (!!name && n.recipientName === name)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function markNotificationRead(id: string) {
  writeJson(NOTIFICATIONS_KEY, listNotifications().map(n => n.id === id ? { ...n, read: true } : n))
}

export function markAllNotificationsRead(accountId: string) {
  writeJson(NOTIFICATIONS_KEY, listNotifications().map(n => n.recipientAccountId === accountId ? { ...n, read: true } : n))
}

function action(view: ViewType, label: string) {
  return { actionView: view, actionLabel: label }
}

export function createDonationIntentNotification(contract: ImpactContract, institutionAccountId?: string) {
  if (!institutionAccountId) return null

  const kind = contract.donationType === 'dinheiro' ? 'em dinheiro' : 'em produtos/serviços'
  const title = `Novo donativo ${kind} para validação`
  const body = `
A empresa ${contract.company} (NIF ${contract.nif}) submeteu um donativo ${kind} à instituição ${contract.institutionName}, no valor indicado de €${contract.donationAmount.toLocaleString('pt-PT')}, com comprovativo de transferência/documento associado.

O comprovativo está disponível na aba "Donativos" da área privada. Para validar o donativo, a instituição deve confirmar o valor recebido e submeter o recibo/declaração de donativo ao abrigo da Lei do Mecenato.

Após receção do donativo, a instituição deverá:

1. Confirmar na área privada que o donativo foi recebido;
2. Emitir recibo/declaração de donativo ao abrigo da Lei do Mecenato;
3. Disponibilizar esse recibo à empresa mecenas;
4. Preencher a mensagem de agradecimento que será integrada no Relatório ESG;
5. Confirmar que o donativo não teve qualquer contrapartida comercial.

O recibo/declaração de donativo deve incluir:
- Identificação da entidade beneficiária;
- Identificação do mecenas: ${contract.company}, NIF ${contract.nif};
- Valor do donativo: €${contract.donationAmount.toLocaleString('pt-PT')};
- Data do donativo;
- Referência ao enquadramento legal: Lei do Mecenato / artigo 62.º do Código do IRC;
- Indicação de que o donativo não tem contrapartida.
  `.trim()

  return createNotification({
    recipientAccountId: institutionAccountId,
    recipientRole: 'instituicao',
    recipientName: contract.institutionName,
    kind: 'donation-intent',
    title,
    body,
    relatedContractId: contract.id,
    ...action('area-privada' as ViewType, 'Ver donativo'),
  })
}

export function createCompanyDonationRegisteredNotification(contract: ImpactContract, companyAccountId?: string) {
  if (!companyAccountId) return null

  return createNotification({
    recipientAccountId: companyAccountId,
    recipientRole: 'empresa',
    kind: 'donation-registered',
    title: 'Intenção de donativo registada',
    body: `A intenção de donativo à instituição ${contract.institutionName}, no valor de €${contract.donationAmount.toLocaleString('pt-PT')}, foi registada. O Relatório ESG só ficará disponível após confirmação da empresa e da instituição.`,
    relatedContractId: contract.id,
    ...action('comprovativos' as ViewType, 'Confirmar donativo'),
  })
}
