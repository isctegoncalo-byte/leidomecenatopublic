import { Account, ChatMessage, ChatThread, ImpactContract } from '../types'

const CHATS_KEY = 'leidomecenato_chat_threads'

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

export function listThreads(): ChatThread[] {
  return readJson<ChatThread[]>(CHATS_KEY, [])
}

export function getThread(id: string): ChatThread | null {
  return listThreads().find(t => t.id === id) || null
}

export function getThreadByContractId(contractId: string): ChatThread | null {
  return listThreads().find(t => t.contractId === contractId) || null
}

export function listThreadsForAccount(account: Account): ChatThread[] {
  return listThreads()
    .filter(t => t.companyAccountId === account.id || t.institutionAccountId === account.id || t.institutionName === account.name)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function saveThread(thread: ChatThread) {
  const all = listThreads().filter(t => t.id !== thread.id)
  writeJson(CHATS_KEY, [...all, thread])
}

export function createThread(contract: ImpactContract, company: Account | null, institutionAccountId?: string, proofId?: string): ChatThread {
  const existing = getThreadByContractId(contract.id)
  if (existing) return existing

  const now = new Date().toISOString()
  const companyAccountId = company?.id || `guest-${contract.nif}`
  const companyName = company?.name || contract.company
  const thread: ChatThread = {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    contractId: contract.id,
    proofId,
    companyAccountId,
    companyName,
    institutionAccountId,
    institutionName: contract.institutionName,
    donationAmount: contract.donationAmount,
    donationType: contract.donationType,
    createdAt: now,
    updatedAt: now,
    status: 'open',
    messages: [
      {
        id: `msg-${Date.now()}-system`,
        threadId: `chat-${Date.now()}`,
        senderAccountId: 'system',
        senderName: 'Sistema',
        senderRole: 'empresa',
        body: `Chat aberto para acertar os detalhes do donativo ${contract.donationType === 'dinheiro' ? 'em dinheiro' : 'em produtos/serviços'} no valor estimado de €${contract.donationAmount.toLocaleString('pt-PT')}.`,
        createdAt: now,
      },
    ],
  }
  // Corrige threadId da primeira mensagem para o id final
  thread.messages[0].threadId = thread.id
  saveThread(thread)
  return thread
}

export function addMessage(threadId: string, sender: Account, body: string) {
  const text = body.trim()
  if (!text) return null
  const thread = getThread(threadId)
  if (!thread) return null
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    senderAccountId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: text,
    createdAt: new Date().toISOString(),
  }
  thread.messages.push(msg)
  thread.updatedAt = msg.createdAt
  saveThread(thread)
  return msg
}

export function closeThread(threadId: string) {
  const thread = getThread(threadId)
  if (!thread) return
  thread.status = 'closed'
  thread.updatedAt = new Date().toISOString()
  saveThread(thread)
}
