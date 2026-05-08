import { useEffect, useMemo, useState } from 'react'
import { Account, ViewType, DonationProof, UploadedDoc, PlatformNotification, ChatThread, NeedItem, InstitutionRegistration } from '../types'
import { logout } from '../utils/authStore'
import { addDoc, deleteDoc, listDocs, readFileAsDataUrl } from '../utils/docsStore'
import {
  listProofsForCompany,
  listProofsForInstitution,
  setCompanyConfirmation,
  setInstitutionConfirmation,
  rejectProof,
} from '../utils/proofStore'
import { sampleInstitutions } from '../data/institutions'
import { generateESGReport } from '../utils/esgEngine'
import { downloadSustainabilityReport } from '../utils/sustainabilityPdf'
import { REPORT_TIERS } from '../types'
import { createNotification, listNotificationsForAccount, markAllNotificationsRead, markNotificationRead } from '../utils/notificationStore'
import { addMessage, listThreadsForAccount } from '../utils/chatStore'
import { findInstitutionRegistration, saveInstitutionRegistration } from '../utils/institutionRegistry'
import { deleteDocReal, listDocsReal, logoutReal, realBackendEnabled, uploadDocReal } from '../utils/supabaseBackend'
import { isProjectComplete, projectProgress, projectSecured, projectTarget, supportTypeLabel } from '../utils/projectFunding'
import { PROJECT_TYPE_LIMIT_MESSAGE, ProjectSupportType, hasActiveProjectOfType, nextAvailableProjectType } from '../utils/projectLimits'
import SdgGrid from './SdgGrid'
import SdgIcon from './SdgIcon'
import { GENERAL_IMPACT_METRICS, ODS_IMPACT_METRICS, MetricDefinition } from '../data/impactMetrics'
import { ACCEPTED_DOCUMENT_INPUT, ACCEPTED_IMAGE_INPUT, validateDocumentUpload, validateImageUpload } from '../utils/uploadSecurity'

interface Props {
  account: Account
  onLogout: () => void
  setCurrentView: (v: ViewType) => void
}

type Tab = 'perfil' | 'documentos' | 'donativos' | 'comprovativos' | 'relatorios-esg' | 'notificacoes' | 'chat' | 'projetos'

const STATUS_LABEL: Record<DonationProof['status'], { text: string; color: string; bg: string }> = {
  'pending-company':     { text: 'Aguarda confirmação da empresa', color: 'text-amber-700', bg: 'bg-amber-100' },
  'pending-institution': { text: 'Aguarda confirmação da instituição', color: 'text-blue-700', bg: 'bg-blue-100' },
  'confirmed':           { text: '✓ Validado por ambas as partes', color: 'text-green-700', bg: 'bg-green-100' },
  'rejected':            { text: '✕ Rejeitado', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function PrivateAreaPage({ account, onLogout, setCurrentView }: Props) {
  const [tab, setTab] = useState<Tab>('perfil')
  const [refreshTick, force] = useState(0)
  const [realDocs, setRealDocs] = useState<UploadedDoc[]>([])
  const refresh = () => force(x => x + 1)

  const localDocs = useMemo(() => listDocs(account.id), [account.id, tab])
  const docs = realBackendEnabled() ? realDocs : localDocs
  const proofs = useMemo(() => account.role === 'empresa'
    ? listProofsForCompany(account.id)
    : listProofsForInstitution(account.id),
  [account.id, account.role, tab])
  const notifications = useMemo(() =>
    listNotificationsForAccount(account.id, account.role, account.name),
  [account.id, account.name, account.role, tab])
  const chatThreads = useMemo(() => listThreadsForAccount(account), [account.id, account.name, tab])

  useEffect(() => {
    let alive = true
    if (!realBackendEnabled()) return
    listDocsReal(account.id).then(items => {
      if (alive) setRealDocs(items)
    })
    return () => { alive = false }
  }, [account.id, tab, refreshTick])

  const handleLogout = () => {
    void logoutReal()
    logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header da área */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-10">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-300 font-bold mb-1">Área Privada</p>
            <h1 className="text-2xl md:text-3xl font-black">{account.name}</h1>
            <p className="text-blue-200 text-sm mt-1">
              {account.role === 'empresa' ? '🏢 Conta de Empresa' : '🏛️ Conta de Instituição'} • {account.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentView('home')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold py-2 px-4 rounded-xl">
              Site público
            </button>
            <button onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-xl">
              Sair
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 max-w-6xl flex overflow-x-auto">
          {(() => {
            const baseTabs: { id: Tab; label: string }[] = [
              { id: 'perfil',         label: '👤 Perfil' },
              { id: 'donativos',      label: '💶 Donativos' },
            ]
            if (account.role === 'instituicao') {
              baseTabs.splice(1, 0, { id: 'documentos', label: '📁 Documentos' })
              baseTabs.splice(2, 0, { id: 'projetos', label: '📋 Projetos' })
            }
            // Notificações para empresas e instituições
            const unread = notifications.filter((n: PlatformNotification) => !n.read).length
            baseTabs.push({ id: 'notificacoes', label: `📨 Notificações${unread ? ` (${unread})` : ''}` })
            baseTabs.push({ id: 'chat', label: `💬 Chat${chatThreads.length ? ` (${chatThreads.length})` : ''}` })

            // Apenas as empresas têm acesso à tab de Relatórios ESG
            if (account.role === 'empresa') {
              baseTabs.push({ id: 'relatorios-esg', label: '📊 Relatórios ESG' })
            }
            return baseTabs
          })().map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {tab === 'perfil' && (
          <div className="space-y-6">
            <ProfileTab account={account} />
            {account.role === 'empresa' && <DocumentsTab account={account} docs={docs} onChange={refresh} />}
          </div>
        )}
        {tab === 'documentos' && account.role === 'instituicao' && (
          <DocumentsTab account={account} docs={docs} onChange={refresh} />
        )}
        {tab === 'projetos' && account.role === 'instituicao' && (
          <InstitutionProjectsTab account={account} docs={docs} />
        )}
        {tab === 'donativos' && (
          <div className="space-y-6">
            <DonationsTab account={account} proofs={proofs} setCurrentView={setCurrentView} />
            <ProofsTab account={account} proofs={proofs} onChange={refresh} />
          </div>
        )}
        {tab === 'relatorios-esg' && account.role === 'empresa' && (
          <ESGReportsTab account={account} proofs={proofs} />
        )}
        {tab === 'notificacoes' && (
          <NotificationsTab account={account} notifications={notifications} onChange={refresh} />
        )}
        {tab === 'chat' && (
          <ChatTab account={account} threads={chatThreads} onChange={refresh} />
        )}
      </div>
    </div>
  )
}

// ─── CHAT ─────────────────────────────────────────
function ChatTab({ account, threads, onChange }: { account: Account; threads: ChatThread[]; onChange: () => void }) {
  const [selectedId, setSelectedId] = useState(threads[0]?.id || '')
  const [message, setMessage] = useState('')

  const selected = threads.find(t => t.id === selectedId) || threads[0]

  const send = () => {
    if (!selected || !message.trim()) return
    addMessage(selected.id, account, message)
    setMessage('')
    onChange()
  }

  if (threads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Ainda não existem conversas abertas.
        <p className="text-xs text-slate-400 mt-2">Quando uma empresa manifestar intenção de doar, será aberto um chat entre a empresa e a instituição.</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Lista de conversas */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">Conversas</h2>
          <p className="text-xs text-slate-500">Detalhes de donativos em curso</p>
        </div>
        <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
          {threads.map(t => {
            const peer = account.role === 'empresa' ? t.institutionName : t.companyName
            const last = t.messages[t.messages.length - 1]
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition ${selected?.id === t.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{peer}</p>
                    <p className="text-xs text-slate-500">€ {t.donationAmount.toLocaleString('pt-PT')} • {t.donationType === 'dinheiro' ? 'Dinheiro' : 'Produtos/Serviços'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.status === 'open' ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                {last && <p className="text-xs text-slate-400 mt-2 truncate">{last.senderName}: {last.body}</p>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[560px]">
        {selected ? (
          <>
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="font-black text-slate-900">
                {account.role === 'empresa' ? selected.institutionName : selected.companyName}
              </h2>
              <p className="text-xs text-slate-500">
                Donativo de € {selected.donationAmount.toLocaleString('pt-PT')} • {selected.donationType === 'dinheiro' ? 'Dinheiro' : 'Produtos/Serviços'}
              </p>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-slate-50">
              {selected.messages.map(msg => {
                const mine = msg.senderAccountId === account.id
                const system = msg.senderAccountId === 'system'
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                      system ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      mine ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      {!mine && !system && <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{msg.senderName}</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(msg.createdAt).toLocaleString('pt-PT')}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  rows={2}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl resize-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Escreva uma mensagem para acertar detalhes do donativo..."
                />
                <button onClick={send} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl">
                  Enviar
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Enter para enviar • Shift+Enter para nova linha</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─── PROJECTS / NEEDS (instituições) ──────────────
const REQUIRED_INSTITUTION_PROJECT_DOCS = [
  'Comprovativo NIF',
  'Relatórios de Atividades e Contas (último aprovado)',
  'Estatutos',
  'Comprovativo IBAN',
]

function InstitutionProjectsTab({ account, docs }: { account: Account; docs: UploadedDoc[] }) {
  const existing = findInstitutionRegistration(account.name)
  const confirmedProofs = listProofsForInstitution(account.id)
  const missingRequiredDocs = REQUIRED_INSTITUTION_PROJECT_DOCS.filter(required =>
    !docs.some(doc => doc.category === required)
  )
  const [needs, setNeeds] = useState<NeedItem[]>(existing?.needs || [])
  const [form, setForm] = useState<NeedItem>({
    id: `need-${Date.now()}`,
    category: '',
    subcategory: '',
    description: '',
    supportType: 'dinheiro',
    implementationPhase: 'candidatura',
    quantity: '',
    projectPhotoUrls: [],
    requestedAmount: undefined,
    productOrService: '',
    totalProjectCost: undefined,
    securedFunding: 0,
    estimatedValue: undefined,
    status: 'ativo',
    urgency: 'media',
    sdgGoals: [],
    esgPillar: 'S',
    impactMetric: '',
    beneficiaries: undefined,
  })
  const [error, setError] = useState('')

  const isCompleteForLimit = (need: NeedItem) => isProjectComplete(need, confirmedProofs, account.name)
  const hasActiveProjectType = (type: ProjectSupportType) => hasActiveProjectOfType(needs, type, isCompleteForLimit)
  const nextProjectType = () => nextAvailableProjectType(needs, isCompleteForLimit)

  useEffect(() => {
    const selectedType = form.supportType === 'produtos' ? 'produtos' : 'dinheiro'
    if (hasActiveProjectType(selectedType)) {
      const availableType = nextProjectType()
      if (availableType) setForm(prev => ({ ...prev, supportType: availableType }))
    }
  }, [needs, form.supportType])

  const resetForm = () => setForm({
    id: `need-${Date.now()}`,
    category: '',
    subcategory: '',
    description: '',
    supportType: nextProjectType() || 'dinheiro',
    implementationPhase: 'candidatura',
    quantity: '',
    projectPhotoUrls: [],
    requestedAmount: undefined,
    productOrService: '',
    totalProjectCost: undefined,
    securedFunding: 0,
    estimatedValue: undefined,
    status: 'ativo',
    urgency: 'media',
    sdgGoals: [],
    esgPillar: 'S',
    impactMetric: '',
    beneficiaries: undefined,
  })

  const persist = (nextNeeds: NeedItem[]) => {
    const registration: InstitutionRegistration = {
      name: account.name,
      legalName: account.institutionLegalName || account.name,
      nif: account.nif,
      type: 'Instituição',
      category: account.institutionCategory || '',
      founded: '',
      description: existing?.description || '',
      mission: existing?.mission || '',
      address: existing?.address || '',
      municipality: existing?.municipality || '',
      district: existing?.district || '',
      postalCode: existing?.postalCode || '',
      phone: existing?.phone || '',
      email: account.email,
      website: existing?.website || '',
      linktreeUrl: existing?.linktreeUrl || '',
      facebookUrl: existing?.facebookUrl || '',
      instagramUrl: existing?.instagramUrl || '',
      linkedinUrl: existing?.linkedinUrl || '',
      tiktokUrl: existing?.tiktokUrl || '',
      iban: existing?.iban || '',
      fullTimeStaff: existing?.fullTimeStaff || 0,
      partTimeStaff: existing?.partTimeStaff || 0,
      volunteers: existing?.volunteers || 0,
      annualBudget: existing?.annualBudget || '',
      peopleReachedPerYear: existing?.peopleReachedPerYear || 0,
      mainActivities: existing?.mainActivities || '',
      pastAchievements: existing?.pastAchievements || '',
      logoUrl: existing?.logoUrl || account.institutionLogoUrl || '',
      photoUrls: existing?.photoUrls || [],
      needs: nextNeeds,
      statutes: existing?.statutes || false,
      utilidadePublica: existing?.utilidadePublica || false,
      lastAccountsApproved: existing?.lastAccountsApproved || false,
    }
    saveInstitutionRegistration(registration)
  }

  const addProject = () => {
    if (missingRequiredDocs.length > 0) {
      setError(`Antes de criar um novo projeto, carregue os documentos obrigatórios em falta: ${missingRequiredDocs.join(', ')}.`)
      return
    }
    if (form.supportType && hasActiveProjectType(form.supportType as ProjectSupportType)) {
      setError(PROJECT_TYPE_LIMIT_MESSAGE)
      return
    }
    if (!form.category || !form.subcategory || !form.description || !form.impactMetric || form.sdgGoals.length === 0 || !form.supportType || !form.implementationPhase) {
      setError('Preencha categoria, subcategoria, descrição, tipo de apoio, fase de implementação, métrica de impacto e pelo menos 1 ODS.')
      return
    }
    if (form.supportType === 'dinheiro' && !form.requestedAmount) {
      setError('Indique quanto dinheiro pretende angariar para este projeto.')
      return
    }
    if (form.supportType === 'produtos' && !form.productOrService?.trim()) {
      setError('Especifique que produto ou serviço pretende receber.')
      return
    }
    if (!form.totalProjectCost) {
      setError('Indique o custo total do projeto específico.')
      return
    }
    if (form.securedFunding === undefined) {
      setError('Indique a verba já assegurada para este projeto, mesmo que seja 0.')
      return
    }
    if ((form.securedFunding || 0) > form.totalProjectCost) {
      setError('A verba já assegurada não pode ser superior ao custo total do projeto.')
      return
    }
    const normalized = {
      ...form,
      id: `need-${Date.now()}`,
      estimatedValue: form.requestedAmount || form.totalProjectCost,
      status: isProjectComplete(form, confirmedProofs, account.name) ? 'concluido' as const : 'ativo' as const,
    }
    const next = [...needs, normalized]
    setNeeds(next)
    persist(next)
    resetForm()
    setError('')
  }

  const removeProject = (id: string) => {
    const next = needs.filter(n => n.id !== id)
    setNeeds(next)
    persist(next)
  }

  const toggleSDG = (sdg: number) => {
    setForm(prev => ({ ...prev, sdgGoals: prev.sdgGoals.includes(sdg) ? prev.sdgGoals.filter(s => s !== sdg) : [...prev.sdgGoals, sdg] }))
  }

  const parseMetricValue = (value: string, type: MetricDefinition['type']) => type === 'number' ? (Number(value) || '') : value

  const updateGeneralMetric = (metric: MetricDefinition, value: string) => {
    setForm(prev => ({
      ...prev,
      generalImpactMetrics: {
        ...(prev.generalImpactMetrics || {}),
        [metric.key]: parseMetricValue(value, metric.type) as string | number,
      },
    }))
  }

  const updateOdsMetric = (sdg: number, metric: MetricDefinition, value: string) => {
    setForm(prev => ({
      ...prev,
      odsImpactMetrics: {
        ...(prev.odsImpactMetrics || {}),
        [sdg]: {
          ...(prev.odsImpactMetrics?.[sdg] || {}),
          [metric.key]: parseMetricValue(value, metric.type) as string | number,
        },
      },
    }))
  }

  const handleProjectPhotoChange = (photoIdx: number, file?: File) => {
    if (!file) return
    const validationError = validateImageUpload(file)
    if (validationError) {
      setError(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => {
        const next = [...(prev.projectPhotoUrls || [])].slice(0, 5)
        next[photoIdx] = String(reader.result || '')
        return { ...prev, projectPhotoUrls: next.filter(Boolean).slice(0, 5) }
      })
    }
    reader.readAsDataURL(file)
  }

  const removeProjectPhoto = (photoIdx: number) => {
    setForm(prev => ({ ...prev, projectPhotoUrls: (prev.projectPhotoUrls || []).filter((_, i) => i !== photoIdx) }))
  }

  const MetricInput = ({
    metric,
    value,
    onChange,
  }: {
    metric: MetricDefinition
    value: string | number | undefined
    onChange: (value: string) => void
  }) => {
    if (metric.type === 'select') {
      return (
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1">{metric.label}</span>
          <select value={String(value || '')} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
            <option value="">Selecionar...</option>
            {metric.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      )
    }
    return (
      <label className="block">
        <span className="block text-xs font-semibold text-slate-600 mb-1">{metric.label}</span>
        <input
          type={metric.type === 'number' ? 'number' : 'text'}
          value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          placeholder={metric.placeholder}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
        />
      </label>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-700 text-sm">
        <strong>📋 Projetos para apoio:</strong> adicione necessidades/projetos que a sua instituição pretende divulgar a empresas mecenas.
      </div>

      <div className={`rounded-2xl border p-5 text-sm ${missingRequiredDocs.length ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
        <strong>Documentos obrigatórios para criar projetos:</strong>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {REQUIRED_INSTITUTION_PROJECT_DOCS.map(label => {
            const uploaded = !missingRequiredDocs.includes(label)
            return (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className={uploaded ? 'text-green-600' : 'text-amber-600'}>{uploaded ? '✓' : '!'}</span>
                <span className="font-semibold">{label}</span>
              </div>
            )
          })}
        </div>
        {missingRequiredDocs.length > 0 && (
          <p className="mt-3 text-xs">
            Para desbloquear a criação de projetos, vá à tab "Documentos" e carregue estes ficheiros nas categorias indicadas.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Novo projeto / necessidade</h2>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Categoria *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="Subcategoria *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          <select value={form.supportType || 'dinheiro'} onChange={e => setForm({ ...form, supportType: e.target.value as NeedItem['supportType'] })} className="px-4 py-3 border border-slate-300 rounded-xl">
            <option value="dinheiro" disabled={hasActiveProjectType('dinheiro')}>Pretendo dinheiro</option>
            <option value="produtos" disabled={hasActiveProjectType('produtos')}>Pretendo produto/serviço</option>
          </select>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 md:col-span-2">
            Cada instituição pode ter no máximo 1 projeto ativo a pedir dinheiro e 1 projeto ativo a pedir produto/serviço.
          </p>
          <select value={form.implementationPhase || 'candidatura'} onChange={e => setForm({ ...form, implementationPhase: e.target.value as NeedItem['implementationPhase'] })} className="px-4 py-3 border border-slate-300 rounded-xl">
            <option value="candidatura">Em fase de candidatura</option>
            <option value="a-decorrer">A decorrer</option>
          </select>
          {form.supportType === 'dinheiro' ? (
            <input type="number" value={form.requestedAmount ?? ''} onChange={e => setForm({ ...form, requestedAmount: Number(e.target.value) || undefined })} placeholder="Verba pretendida (€) *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          ) : (
            <input value={form.productOrService || ''} onChange={e => setForm({ ...form, productOrService: e.target.value })} placeholder="Produto/serviço pretendido *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          )}
          <input type="number" value={form.totalProjectCost ?? ''} onChange={e => setForm({ ...form, totalProjectCost: Number(e.target.value) || undefined })} placeholder="Custo total do projeto (€) *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          <input type="number" value={form.securedFunding ?? ''} onChange={e => setForm({ ...form, securedFunding: e.target.value === '' ? 0 : Number(e.target.value) })} placeholder="Verba já assegurada (€) *" className="px-4 py-3 border border-slate-300 rounded-xl" />
          <input type="number" value={form.beneficiaries ?? ''} onChange={e => setForm({ ...form, beneficiaries: Number(e.target.value) || undefined })} placeholder="Beneficiários diretos" className="px-4 py-3 border border-slate-300 rounded-xl" />
          <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value as NeedItem['urgency'] })} className="px-4 py-3 border border-slate-300 rounded-xl">
            <option value="alta">Urgência alta</option>
            <option value="media">Urgência média</option>
            <option value="baixa">Urgência baixa</option>
          </select>
          <select value={form.esgPillar} onChange={e => setForm({ ...form, esgPillar: e.target.value as NeedItem['esgPillar'] })} className="px-4 py-3 border border-slate-300 rounded-xl">
            <option value="E">Ambiental</option>
            <option value="S">Social</option>
            <option value="G">Governação</option>
          </select>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descrição detalhada *" className="md:col-span-2 px-4 py-3 border border-slate-300 rounded-xl resize-none" />
          <input value={form.impactMetric} onChange={e => setForm({ ...form, impactMetric: e.target.value })} placeholder="Métrica de impacto *" className="md:col-span-2 px-4 py-3 border border-slate-300 rounded-xl" />
          <input value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Quantidade / unidade" className="md:col-span-2 px-4 py-3 border border-slate-300 rounded-xl" />
        </div>
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-700 mb-3">ODS alinhados *</p>
          <SdgGrid selected={form.sdgGoals} onToggle={toggleSDG} />
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="font-black text-slate-900 mb-2">Métricas gerais do projeto</h3>
          <p className="text-xs text-slate-500 mb-4">Estas métricas são transversais a todos os projetos e serão usadas no Relatório de Impacto ESG.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {GENERAL_IMPACT_METRICS.map(metric => (
              <MetricInput
                key={metric.key}
                metric={metric}
                value={form.generalImpactMetrics?.[metric.key as keyof typeof form.generalImpactMetrics] as string | number | undefined}
                onChange={value => updateGeneralMetric(metric, value)}
              />
            ))}
          </div>
        </div>

        {form.sdgGoals.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="font-black text-blue-900 mb-2">Métricas específicas por ODS</h3>
            <p className="text-xs text-blue-700 mb-4">Estas métricas mudam consoante os ODS selecionados e enriquecem o relatório final.</p>
            <div className="space-y-5">
              {form.sdgGoals.map(sdg => {
                const metrics = ODS_IMPACT_METRICS[sdg] || []
                if (metrics.length === 0) return null
                return (
                  <div key={sdg} className="bg-white border border-blue-100 rounded-xl p-4">
                    <h4 className="font-bold text-slate-800 mb-3">ODS {sdg}</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {metrics.map(metric => (
                        <MetricInput
                          key={`${sdg}-${metric.key}`}
                          metric={metric}
                          value={form.odsImpactMetrics?.[sdg]?.[metric.key]}
                          onChange={value => updateOdsMetric(sdg, metric, value)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-black text-slate-900 mb-2">Galeria de fotos do projeto</h3>
          <p className="text-xs text-slate-500 mb-4">Opcional. Pode carregar até 5 fotos para aparecerem na página pública deste projeto.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, photoIdx) => {
              const photo = form.projectPhotoUrls?.[photoIdx]
              return (
                <div key={photoIdx} className="rounded-xl border border-slate-200 bg-white p-2">
                  <label className="block cursor-pointer">
                    <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                      {photo ? (
                        <img src={photo} alt={`Foto ${photoIdx + 1} do projeto`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="px-2 text-center text-xs text-slate-400">Foto {photoIdx + 1}</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_INPUT}
                      onChange={e => handleProjectPhotoChange(photoIdx, e.target.files?.[0])}
                      className="hidden"
                    />
                    <span className="block text-center text-xs font-bold text-blue-700">{photo ? 'Substituir' : 'Carregar'}</span>
                  </label>
                  {photo && (
                    <button onClick={() => removeProjectPhoto(photoIdx)} className="mt-1 w-full text-xs font-bold text-red-600">
                      Remover
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <button
          onClick={addProject}
          disabled={!nextProjectType()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl"
        >
          {nextProjectType() ? '+ Adicionar projeto' : 'Limite de projetos ativos atingido'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Projetos atuais ({needs.length})</h2>
        {needs.length === 0 ? <p className="text-slate-500 text-sm">Ainda não existem projetos registados.</p> : (
          <div className="space-y-3">
            {needs.map(n => (
              <div key={n.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{n.category} › {n.subcategory}</p>
                    <p className="text-sm text-slate-500 mt-1">{n.impactMetric}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <span><strong>{supportTypeLabel(n)}:</strong> {n.supportType === 'produtos' ? n.productOrService : `€ ${projectTarget(n).toLocaleString('pt-PT')}`}</span>
                      <span><strong>Custo total:</strong> € {(n.totalProjectCost || n.estimatedValue || 0).toLocaleString('pt-PT')}</span>
                      <span><strong>Fase:</strong> {n.implementationPhase === 'a-decorrer' ? 'A decorrer' : 'Em fase de candidatura'}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Angariado: € {projectSecured(n, confirmedProofs, account.name).toLocaleString('pt-PT')}</span>
                        <span>{projectProgress(n, confirmedProofs, account.name)}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${isProjectComplete(n, confirmedProofs, account.name) ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${projectProgress(n, confirmedProofs, account.name)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {n.sdgGoals.map(s => <SdgIcon key={s} n={s} size="sm" className="rounded-md" />)}
                      {(n.projectPhotoUrls || []).length > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{(n.projectPhotoUrls || []).length} foto{(n.projectPhotoUrls || []).length > 1 ? 's' : ''}</span>}
                      {isProjectComplete(n, confirmedProofs, account.name) && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Concluído</span>}
                    </div>
                  </div>
                  <button onClick={() => removeProject(n.id)} className="text-red-600 text-sm font-bold">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PROFILE ─────────────────────────────────────
function ProfileTab({ account }: { account: Account }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-black text-slate-900 mb-4">Dados da Conta</h2>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Row label="Tipo de conta" value={account.role === 'empresa' ? 'Empresa' : 'Instituição'} />
        <Row label="Nome" value={account.name} />
        <Row label="NIF" value={account.nif} />
        <Row label="Email" value={account.email} />
        {account.companyActivity && <Row label="Setor" value={account.companyActivity} />}
        {account.institutionLegalName && <Row label="Denominação Legal" value={account.institutionLegalName} />}
        {account.institutionCategory && <Row label="Área de Atuação" value={account.institutionCategory} />}
        <Row label="Conta criada" value={new Date(account.createdAt).toLocaleDateString('pt-PT')} />
      </dl>
    </div>
  )
}

// ─── NOTIFICATIONS ───────────────────────────────
function NotificationsTab({ account, notifications, onChange }: { account: Account; notifications: PlatformNotification[]; onChange: () => void }) {
  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Ainda não existem notificações.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-700 text-sm">
        <strong>📨 Notificações:</strong> aqui aparecem intenções de donativo, confirmações, rejeições e avisos sobre relatórios ESG.
        <button onClick={() => { markAllNotificationsRead(account.id); onChange() }} className="ml-3 underline font-bold">Marcar todas como lidas</button>
      </div>
      {notifications.map(n => (
        <article key={n.id} className={`bg-white rounded-2xl border p-6 ${n.read ? 'border-slate-200' : 'border-blue-300 shadow-md'}`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('pt-PT')}</p>
              <h3 className="font-black text-slate-900 text-lg">{n.title}</h3>
              <p className="text-sm text-slate-500">{notificationKindLabel(n.kind)}</p>
            </div>
            {!n.read && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Nova</span>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono">
            {n.body}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { markNotificationRead(n.id); onChange() }}
              className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-xl">
              Marcar como lida
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function notificationKindLabel(kind: PlatformNotification['kind']) {
  const labels: Record<PlatformNotification['kind'], string> = {
    'donation-intent': 'Intenção de donativo',
    'donation-registered': 'Donativo registado',
    'company-confirmed': 'Confirmação da empresa',
    'institution-confirmed': 'Confirmação da instituição',
    'donation-confirmed': 'Donativo confirmado',
    'donation-rejected': 'Donativo rejeitado',
    'report-available': 'Relatório ESG disponível',
    'document-uploaded': 'Documento carregado',
  }
  return labels[kind]
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-bold text-slate-800 text-right">{value}</dd>
    </div>
  )
}

// ─── DOCUMENTS ───────────────────────────────────
function DocumentsTab({
  account, docs, onChange,
}: { account: Account; docs: UploadedDoc[]; onChange: () => void }) {
  const [category, setCategory] = useState(account.role === 'instituicao' ? 'Comprovativo NIF' : 'Outro')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const categories = account.role === 'empresa'
    ? ['Documento da empresa', 'Comprovativo de pagamento', 'Comprovativo de transferência', 'Fatura/Recibo', 'Outro']
    : [
        'Comprovativo NIF',
        'Relatórios de Atividades e Contas (último aprovado)',
        'Estatutos',
        'Comprovativo IBAN',
        'Reconhecimento de Utilidade Pública',
        'Comprovativo de receção',
        'Outro',
      ]

  const handleUpload = async (file?: File) => {
    if (!file) return
    setError('')
    const validationError = validateDocumentUpload(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setUploading(true)
    try {
      if (realBackendEnabled()) {
        const res = await uploadDocReal(account.id, category, file)
        if (!res.ok) {
          setError(res.error)
          return
        }
      } else {
        const dataUrl = await readFileAsDataUrl(file)
        addDoc({
          ownerId: account.id,
          name: file.name,
          category,
          dataUrl,
          size: file.size,
        })
      }
      onChange()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: UploadedDoc) => {
    setError('')
    if (realBackendEnabled()) {
      const res = await deleteDocReal(doc)
      if (!res.ok) {
        setError(res.error)
        return
      }
    } else {
      deleteDoc(doc.id)
    }
    onChange()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Carregar Documento</h2>
        {realBackendEnabled() && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Backend real ativo: os ficheiros serao guardados no Supabase.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="block">
            <span className="block text-sm font-semibold text-slate-600 mb-2">Ficheiro</span>
            <div className="border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center gap-3">
              <span className="text-2xl">📎</span>
              <span className="text-sm text-slate-600 flex-1">{uploading ? 'A carregar...' : 'Selecionar ficheiro (PDF, imagem, doc...)'}</span>
              <input type="file" accept={ACCEPTED_DOCUMENT_INPUT} className="hidden" disabled={uploading}
                onChange={e => handleUpload(e.target.files?.[0])} />
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Documentos Carregados ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-slate-500 text-sm">Ainda não existem documentos carregados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map(d => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {d.category} • {(d.size / 1024).toFixed(1)} KB • {new Date(d.uploadedAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <a href={d.dataUrl} download={d.name}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Descarregar</a>
                <button onClick={() => void handleDelete(d)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold">Apagar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── DONATIONS ──────────────────────────────────
function DonationsTab({
  account, proofs, setCurrentView,
}: { account: Account; proofs: DonationProof[]; setCurrentView: (v: ViewType) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-black text-slate-900">Histórico de Donativos</h2>
          {account.role === 'empresa' && (
            <button onClick={() => setCurrentView('empresa')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-xl">
              + Novo Donativo
            </button>
          )}
        </div>
        {proofs.length === 0 ? (
          <p className="text-slate-500 text-sm">Ainda não existem donativos registados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proofs.map(p => {
              const status = STATUS_LABEL[p.status]
              return (
                <li key={p.id} className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800">{p.institutionName}</p>
                      <p className="text-xs text-slate-500">
                        € {p.amount.toLocaleString('pt-PT')} • {p.date}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── PROOFS ─────────────────────────────────────
function ProofsTab({
  account, proofs, onChange,
}: { account: Account; proofs: DonationProof[]; onChange: () => void }) {
  const [thankYouMessages, setThankYouMessages] = useState<Record<string, string>>({})
  const [companyInvoices, setCompanyInvoices] = useState<Record<string, { name: string; dataUrl: string; size: number }>>({})
  const [institutionReceipts, setInstitutionReceipts] = useState<Record<string, { name: string; dataUrl: string; size: number }>>({})
  const [confirmedAmounts, setConfirmedAmounts] = useState<Record<string, number>>({})
  const [uploadError, setUploadError] = useState('')

  const confirmedAmountFor = (proof: DonationProof) =>
    confirmedAmounts[proof.id] ?? proof.confirmedAmount ?? proof.institutionConfirmedAmount ?? proof.companyConfirmedAmount ?? proof.amount

  const validateConfirmedAmount = (proof: DonationProof) => {
    const amount = confirmedAmountFor(proof)
    if (!amount || amount <= 0) {
      alert('Indique o valor confirmado do donativo. Este valor será usado para atualizar a barra de progresso do projeto.')
      return null
    }
    return amount
  }

  const handleMandatoryDocUpload = async (
    proofId: string,
    file: File | undefined,
    type: 'company-invoice' | 'institution-receipt'
  ) => {
    if (!file) return
    const validationError = validateDocumentUpload(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }
    setUploadError('')
    const dataUrl = await readFileAsDataUrl(file)
    const payload = { name: file.name, dataUrl, size: file.size }
    if (type === 'company-invoice') {
      setCompanyInvoices(prev => ({ ...prev, [proofId]: payload }))
    } else {
      setInstitutionReceipts(prev => ({ ...prev, [proofId]: payload }))
    }
  }

  const confirmInstitutionProof = (proof: DonationProof) => {
    const message = (thankYouMessages[proof.id] || proof.institutionThankYouMessage || '').trim()
    const receipt = institutionReceipts[proof.id]
    if (!message) {
      alert('Antes de confirmar, escreva uma mensagem de agradecimento até 1000 caracteres. Esta mensagem fará parte do Relatório ESG.')
      return
    }
    if (message.length > 1000) {
      alert('A mensagem de agradecimento deve ter no máximo 1000 caracteres.')
      return
    }
    if (!receipt && !proof.institutionReceiptFileDataUrl) {
      alert('Antes de confirmar, carregue o recibo de donativo emitido ao abrigo da Lei do Mecenato.')
      return
    }
    const confirmedAmount = validateConfirmedAmount(proof)
    if (!confirmedAmount) return
    setInstitutionConfirmation(proof.id, true, message, receipt, confirmedAmount)
    createNotification({
      recipientAccountId: proof.companyAccountId,
      recipientRole: 'empresa',
      kind: 'institution-confirmed',
      title: 'Instituição confirmou o donativo',
      body: `${account.name} confirmou a receção do donativo de €${proof.amount.toLocaleString('pt-PT')}. Se a empresa também já confirmou, o Relatório ESG fica disponível na área privada.`,
      relatedProofId: proof.id,
      relatedContractId: proof.contractId,
    })
    if (proof.companyConfirmed) {
      createNotification({
        recipientAccountId: proof.companyAccountId,
        recipientRole: 'empresa',
        kind: 'report-available',
        title: 'Relatório ESG disponível',
        body: `O donativo à ${proof.institutionName} foi confirmado por ambas as partes. Já pode descarregar o Relatório ESG na tab "Relatórios ESG".`,
        relatedProofId: proof.id,
        relatedContractId: proof.contractId,
      })
    }
    onChange()
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-700 text-sm">
        <strong>Como funciona:</strong> O comprovativo de donativo é validado quando <strong>ambas as partes</strong> (empresa e instituição) confirmam que o donativo aconteceu. Após a validação, é gerado um certificado em PDF que pode ser descarregado.
        <p className="mt-2">
          Quando a empresa confirma o donativo, a instituição recebe uma notificação e deve confirmar a receção ou negar o donativo. Aguarde 2 a 3 dias úteis antes de insistir, porque algumas transferências podem demorar a ser processadas.
        </p>
      </div>
      {uploadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{uploadError}</div>}

      <div className="space-y-4">
        {proofs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            Ainda não existem comprovativos para validar.
          </div>
        ) : (
          proofs.map(p => {
            const status = STATUS_LABEL[p.status]
            const myConfirmed = account.role === 'empresa' ? p.companyConfirmed : p.institutionConfirmed
            const otherConfirmed = account.role === 'empresa' ? p.institutionConfirmed : p.companyConfirmed
            const otherLabel = account.role === 'empresa' ? 'instituição' : 'empresa'

            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div>
                    <p className="font-black text-slate-900 text-lg">
                      {account.role === 'empresa' ? p.institutionName : `Donativo recebido`}
                    </p>
                    <p className="text-sm text-slate-500">
                      € {p.amount.toLocaleString('pt-PT')} • {p.date}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Valor confirmado para progresso: € {(p.confirmedAmount || confirmedAmountFor(p)).toLocaleString('pt-PT')}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full self-start ${status.bg} ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                {p.description && (
                  <p className="text-sm text-slate-600 mb-4 italic">"{p.description}"</p>
                )}

                {p.proofFileDataUrl && p.proofFileName && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Comprovativo carregado pela empresa</p>
                      <p className="text-sm text-slate-700 font-semibold">{p.proofFileName}</p>
                      {p.proofFileSize && <p className="text-xs text-slate-500">{(p.proofFileSize / 1024).toFixed(1)} KB</p>}
                    </div>
                    <a href={p.proofFileDataUrl} download={p.proofFileName}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg">
                      Descarregar
                    </a>
                  </div>
                )}

                {account.role === 'empresa' && !p.companyConfirmed && p.status !== 'rejected' && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <label className="block text-sm font-bold text-amber-800 mb-2">
                      Fatura / documento comprovativo da empresa *
                    </label>
                    <p className="text-xs text-amber-700 mb-3">
                      Para confirmar a submissão do donativo, carregue a fatura ou documento comprovativo associado ao donativo.
                    </p>
                    <label className="flex items-center gap-3 bg-white border-2 border-dashed border-amber-300 rounded-xl p-3 cursor-pointer hover:bg-amber-50 transition">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">
                          {companyInvoices[p.id]?.name || p.companyInvoiceFileName || 'Carregar fatura/documento'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {companyInvoices[p.id]?.size
                            ? `${(companyInvoices[p.id].size / 1024).toFixed(1)} KB`
                            : p.companyInvoiceFileSize
                              ? `${(p.companyInvoiceFileSize / 1024).toFixed(1)} KB`
                              : 'PDF, JPG ou PNG'}
                        </p>
                      </div>
                      <input type="file" accept={ACCEPTED_DOCUMENT_INPUT} className="hidden" onChange={e => handleMandatoryDocUpload(p.id, e.target.files?.[0], 'company-invoice')} />
                    </label>
                  </div>
                )}

                {p.companyInvoiceFileDataUrl && p.companyInvoiceFileName && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Documento da empresa</p>
                      <p className="text-sm text-slate-700 font-semibold">{p.companyInvoiceFileName}</p>
                    </div>
                    <a href={p.companyInvoiceFileDataUrl} download={p.companyInvoiceFileName} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg">
                      Descarregar
                    </a>
                  </div>
                )}

                {/* Indicadores */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <ConfirmBox label="Empresa" confirmed={p.companyConfirmed} />
                  <ConfirmBox label="Instituição" confirmed={p.institutionConfirmed} />
                </div>

                {p.status !== 'confirmed' && p.status !== 'rejected' && !myConfirmed && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Valor confirmado do donativo (€) *
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Este é o valor que entra no cálculo da barra de progresso do projeto quando ambas as partes confirmarem.
                    </p>
                    <input
                      type="number"
                      min="1"
                      value={confirmedAmountFor(p)}
                      onChange={e => setConfirmedAmounts(prev => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {account.role === 'instituicao' && !p.institutionConfirmed && p.status !== 'rejected' && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-green-800 mb-2">
                        Recibo de donativo emitido pela instituição *
                      </label>
                      <p className="text-xs text-green-700 mb-3">
                        Para confirmar a receção do donativo, carregue o recibo/declaração de donativo emitido ao abrigo da Lei do Mecenato, indicando que não existe contrapartida.
                      </p>
                      <label className="flex items-center gap-3 bg-white border-2 border-dashed border-green-300 rounded-xl p-3 cursor-pointer hover:bg-green-50 transition">
                        <span className="text-2xl">🧾</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">
                            {institutionReceipts[p.id]?.name || p.institutionReceiptFileName || 'Carregar recibo'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {institutionReceipts[p.id]?.size
                              ? `${(institutionReceipts[p.id].size / 1024).toFixed(1)} KB`
                              : p.institutionReceiptFileSize
                                ? `${(p.institutionReceiptFileSize / 1024).toFixed(1)} KB`
                                : 'PDF, JPG ou PNG'}
                          </p>
                        </div>
                        <input type="file" accept={ACCEPTED_DOCUMENT_INPUT} className="hidden" onChange={e => handleMandatoryDocUpload(p.id, e.target.files?.[0], 'institution-receipt')} />
                      </label>
                    </div>

                    <div>
                    <label className="block text-sm font-bold text-green-800 mb-2">
                      Mensagem de agradecimento da instituição *
                    </label>
                    <textarea
                      value={thankYouMessages[p.id] ?? p.institutionThankYouMessage ?? ''}
                      onChange={e => setThankYouMessages(prev => ({ ...prev, [p.id]: e.target.value.slice(0, 1000) }))}
                      maxLength={1000}
                      rows={4}
                      className="w-full px-3 py-2 border border-green-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      placeholder="Escreva uma mensagem de agradecimento à empresa doadora. Esta mensagem será integrada automaticamente no Relatório ESG deste donativo específico."
                    />
                    <div className="flex justify-between mt-2 text-xs text-green-700">
                      <span>Obrigatória antes da confirmação.</span>
                      <span>{(thankYouMessages[p.id] ?? p.institutionThankYouMessage ?? '').length}/1000</span>
                    </div>
                    </div>
                  </div>
                )}

                {p.institutionReceiptFileDataUrl && p.institutionReceiptFileName && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Recibo da instituição</p>
                      <p className="text-sm text-slate-700 font-semibold">{p.institutionReceiptFileName}</p>
                    </div>
                    <a href={p.institutionReceiptFileDataUrl} download={p.institutionReceiptFileName} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg">
                      Descarregar
                    </a>
                  </div>
                )}

                {p.institutionThankYouMessage && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mensagem da instituição</p>
                    <p className="text-sm text-slate-600 italic">"{p.institutionThankYouMessage}"</p>
                  </div>
                )}

                {/* Ações */}
                {p.status !== 'confirmed' && p.status !== 'rejected' && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {!myConfirmed && (
                      <button onClick={() => {
                        if (account.role === 'empresa') {
                          const invoice = companyInvoices[p.id]
                          if (!invoice && !p.companyInvoiceFileDataUrl) {
                            alert('Antes de confirmar, carregue a fatura ou documento comprovativo da empresa.')
                            return
                          }
                          const confirmedAmount = validateConfirmedAmount(p)
                          if (!confirmedAmount) return
                          setCompanyConfirmation(p.id, true, invoice, undefined, confirmedAmount)
                          if (p.institutionAccountId) {
                            createNotification({
                              recipientAccountId: p.institutionAccountId,
                              recipientRole: 'instituicao',
                              kind: 'company-confirmed',
                              title: 'Empresa confirmou o donativo',
                              body: `${account.name} confirmou que efetuou o donativo de €${p.amount.toLocaleString('pt-PT')} à ${p.institutionName}. Confirme a receção na página Donativos ou negue o donativo caso o valor não tenha sido recebido. Recomenda-se aguardar 2 a 3 dias úteis para validação, salvaguardando transferências que possam demorar mais tempo a serem processadas.`,
                              relatedProofId: p.id,
                              relatedContractId: p.contractId,
                            })
                          } else {
                            createNotification({
                              recipientRole: 'instituicao',
                              recipientName: p.institutionName,
                              kind: 'company-confirmed',
                              title: 'Empresa confirmou o donativo',
                              body: `${account.name} confirmou que efetuou o donativo de €${p.amount.toLocaleString('pt-PT')} à ${p.institutionName}. Confirme a receção na página Donativos ou negue o donativo caso o valor não tenha sido recebido. Recomenda-se aguardar 2 a 3 dias úteis para validação, salvaguardando transferências que possam demorar mais tempo a serem processadas.`,
                              relatedProofId: p.id,
                              relatedContractId: p.contractId,
                            })
                          }
                          if (p.institutionConfirmed) {
                            createNotification({
                              recipientAccountId: p.companyAccountId,
                              recipientRole: 'empresa',
                              kind: 'report-available',
                              title: 'Relatório ESG disponível',
                              body: `O donativo à ${p.institutionName} foi confirmado por ambas as partes. Já pode descarregar o Relatório ESG na tab "Relatórios ESG".`,
                              relatedProofId: p.id,
                              relatedContractId: p.contractId,
                            })
                          }
                        }
                        else { confirmInstitutionProof(p); return }
                        onChange()
                      }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-sm">
                        ✓ Confirmar este donativo
                      </button>
                    )}
                    {myConfirmed && !otherConfirmed && (
                      <span className="text-sm text-slate-500 self-center">
                        Confirmado. A aguardar confirmação da {otherLabel}. Aguarde 2 a 3 dias úteis para validação, salvaguardando transferências que possam demorar mais tempo a serem processadas.
                      </span>
                    )}
                    <button onClick={() => {
                      rejectProof(p.id)
                      const recipientAccountId = account.role === 'empresa' ? p.institutionAccountId : p.companyAccountId
                      if (recipientAccountId) {
                        createNotification({
                          recipientAccountId,
                          recipientRole: account.role === 'empresa' ? 'instituicao' : 'empresa',
                          kind: 'donation-rejected',
                          title: 'Donativo rejeitado',
                          body: `${account.name} rejeitou a confirmação do donativo de €${p.amount.toLocaleString('pt-PT')} relativo a ${p.institutionName}.`,
                          relatedProofId: p.id,
                          relatedContractId: p.contractId,
                        })
                      }
                      onChange()
                    }}
                      className="bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold py-2 px-4 rounded-xl text-sm">
                      Rejeitar
                    </button>
                  </div>
                )}

                {/* Donativo confirmado */}
                {p.status === 'confirmed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="font-bold text-green-700 text-sm">✅ Donativo confirmado por ambas as partes</p>
                    <p className="text-xs text-green-700 mt-1">
                      Valor que atualizou o progresso do projeto: € {(p.confirmedAmount || p.amount).toLocaleString('pt-PT')}
                    </p>
                    {account.role === 'empresa' && (
                      <p className="text-xs text-slate-500 mt-1">
                        O Relatório ESG está disponível na tab "📊 Relatórios ESG".
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── ESG REPORTS TAB (apenas para empresas) ─────
function ESGReportsTab({
  account, proofs,
}: { account: Account; proofs: DonationProof[] }) {
  // Apenas relatórios de donativos validados por ambas as partes
  const confirmed = proofs.filter(p => p.status === 'confirmed')
  const pending = proofs.filter(p => p.status !== 'confirmed' && p.status !== 'rejected')

  const buildAndDownload = async (proof: DonationProof) => {
    // Tenta encontrar a instituição correspondente
    const inst = sampleInstitutions.find(i =>
      i.name.toLowerCase().trim() === proof.institutionName.toLowerCase().trim() ||
      i.legalName.toLowerCase().trim() === proof.institutionName.toLowerCase().trim()
    ) || sampleInstitutions[0]

    const tier = REPORT_TIERS.find(t => t.id === 'premium') || REPORT_TIERS[0]

    // Constrói um ImpactContract simulado a partir do proof
    const contract = {
      id: proof.contractId,
      company: account.name,
      nif: account.nif,
      email: account.email,
      contact: '',
      activity: account.companyActivity || '',
      institutionId: inst.id,
      institutionName: proof.institutionName,
      donationType: 'dinheiro' as const,
      donationAmount: proof.amount,
      donationDate: proof.date,
      reportTier: tier,
      reportPrice: tier.price,
      selectedNeedIds: inst.needs.map(n => n.id),
      donationMode: 'causa-com-projeto' as const,
      projectCost: inst.needs.reduce((acc, n) => acc + (n.estimatedValue || 0), 0),
    }

    const report = generateESGReport(inst, contract)
    report.institutionThankYouMessage = proof.institutionThankYouMessage
    await downloadSustainabilityReport(report)
  }

  return (
    <div className="space-y-6">
      {/* Aviso de funcionamento */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-700 text-sm">
        <strong>📊 Como funciona:</strong> O Relatório ESG só fica disponível depois de <strong>ambas as partes</strong> (empresa e instituição) confirmarem que o donativo aconteceu. Esta área é exclusiva da empresa doadora.
      </div>

      {/* Relatórios disponíveis */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Relatórios ESG Disponíveis ({confirmed.length})</h2>

        {confirmed.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 opacity-40">🔒</div>
            <p className="text-slate-500 text-sm">Ainda não tem relatórios ESG disponíveis.</p>
            <p className="text-slate-400 text-xs mt-1">Os relatórios aparecem aqui automaticamente quando o donativo é confirmado por ambas as partes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmed.map(p => (
              <div key={p.id} className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">✓ VALIDADO</span>
                    <p className="font-bold text-slate-800">{p.institutionName}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    € {p.amount.toLocaleString('pt-PT')} • {p.date} • validado em {p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString('pt-PT') : '—'}
                  </p>
                </div>
                <button onClick={() => buildAndDownload(p)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-xl whitespace-nowrap">
                  📥 Descarregar Relatório ESG
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relatórios pendentes (bloqueados) */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">A aguardar validação ({pending.length})</h2>
          <p className="text-xs text-slate-500 mb-4">
            Estes relatórios ficam disponíveis assim que ambas as partes confirmarem o donativo na tab "✅ Comprovativos".
          </p>
          <div className="space-y-3">
            {pending.map(p => {
              const myConfirmed = p.companyConfirmed
              const otherConfirmed = p.institutionConfirmed
              const waitingFor = !myConfirmed ? 'a sua confirmação' : !otherConfirmed ? 'confirmação da instituição' : '—'
              return (
                <div key={p.id} className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg opacity-50">🔒</span>
                    <p className="font-bold text-slate-700">{p.institutionName}</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">€ {p.amount.toLocaleString('pt-PT')} • {p.date}</p>
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${myConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      Empresa: {myConfirmed ? '✓' : 'Aguarda'}
                    </span>
                    <span className={`px-2 py-1 rounded ${otherConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      Instituição: {otherConfirmed ? '✓' : 'Aguarda'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic">A aguardar {waitingFor}.</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmBox({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${confirmed ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{label}</p>
      <p className={`font-bold text-sm mt-1 ${confirmed ? 'text-green-700' : 'text-slate-500'}`}>
        {confirmed ? '✓ Confirmado' : 'Aguarda confirmação'}
      </p>
    </div>
  )
}
