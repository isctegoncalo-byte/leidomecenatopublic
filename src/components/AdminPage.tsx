import { useState, useEffect } from 'react'
import { Account, ViewType } from '../types'
import { ReportTemplate, fillPlaceholders, defaultReportAdvanced } from '../templates/reportTemplates'
import { getReportTemplates, saveReportTemplate, deleteReportTemplate, resetReportTemplates } from '../utils/adminStore'
import { GeneratedESGReport } from '../types'
import { downloadAdminDemoReport } from '../utils/adminDemoPdf'
import { sampleInstitutions } from '../data/institutions'
import AdminBrandTab from './AdminBrandTab'
import {
  AdminDocument,
  AdminProfile,
  listAdminDocumentsReal,
  listAdminProfilesReal,
  realBackendEnabled,
  updateAdminDocumentAcceptedReal,
} from '../utils/supabaseBackend'
import { validateImageUpload } from '../utils/uploadSecurity'
import { listProofs } from '../utils/proofStore'
import { listProjectInstitutions } from '../utils/projectCatalog'

interface Props {
  setCurrentView: (v: ViewType) => void
  session: Account | null
  onLogout: () => void
}

// Mock report for preview
const mockReport: GeneratedESGReport = {
  reportId: 'IMP-PREVIEW', generatedAt: new Date().toLocaleDateString('pt-PT'),
  company: 'Empresa Exemplo, SA', companyNif: '514000000',
  institution: 'Associação Crescer Juntos', institutionCategory: 'Infância e Juventude',
  donationDate: '15/01/2025', donationAmount: 10000, reportPrice: 250,
  reportTier: 'Relatório de Impacto Premium', donationMode: 'causa-com-projeto',
  projectCost: 25000, coveragePercent: 40, exactMatch: false, fitScore: 40,
  scores: { environmental: 52, social: 91, governance: 78, total: 78, sdgAlignment: [2, 3, 4, 10],
    beneficiaries: 1200, impactNarrative: 'Donativo de €10.000 com impacto em 1.200 beneficiários.',
    highlights: ['1.200 crianças/ano'], risks: ['Dependência de financiamento'] },
  coverageRatio: 40, impactPerEuro: 0.12, co2Impact: 0,
  relevantNeeds: [
    { id: 'n1', category: 'Educação', subcategory: 'Material Escolar', description: 'Material para 200 crianças',
      urgency: 'alta', sdgGoals: [4], esgPillar: 'S', impactMetric: '200 crianças com material escolar', estimatedValue: 8000, beneficiaries: 200 },
    { id: 'n2', category: 'Saúde', subcategory: 'Saúde Mental', description: 'Psicologia para famílias',
      urgency: 'alta', sdgGoals: [3, 10], esgPillar: 'S', impactMetric: '60 famílias com acompanhamento', estimatedValue: 18000, beneficiaries: 180 },
  ],
  sdgAlignment: [2, 3, 4, 10],
  pillarBreakdown: { E: [], S: [], G: [] },
  irsDeduction: 14000, ircSavings: 2940,
  disclaimer: 'Iniciativa privada independente.',
}

function buildPlaceholderVars(report: GeneratedESGReport): Record<string, string> {
  return {
    empresa: report.company,
    instituicao: report.institution,
    donativo: report.donationAmount.toLocaleString('pt-PT'),
    data: report.donationDate,
    beneficiarios: report.scores.beneficiaries.toLocaleString(),
    ods_principal: report.sdgAlignment.length > 0 ? `ODS ${report.sdgAlignment[0]}` : '—',
    ods_numeros: report.sdgAlignment.map(s => `ODS ${s}`).join(', '),
    cobertura: report.coveragePercent !== undefined ? report.coveragePercent.toFixed(1) : '—',
    deducao_irc: report.irsDeduction.toLocaleString('pt-PT'),
    poupanca: report.ircSavings.toLocaleString('pt-PT'),
    necessidade_1: report.relevantNeeds[0] ? `${report.relevantNeeds[0].category} › ${report.relevantNeeds[0].subcategory}` : '—',
    necessidade_2: report.relevantNeeds[1] ? `${report.relevantNeeds[1].category} › ${report.relevantNeeds[1].subcategory}` : '—',
    relatorio_id: report.reportId,
    ano: String(new Date().getFullYear()),
  }
}

type AdminTab = 'users-docs' | 'donation-history' | 'brand' | 'report-templates' | 'preview'

const REQUIRED_ADMIN_INSTITUTION_DOCS = [
  'Comprovativo NIF',
  'Relatórios de Atividades e Contas (último aprovado)',
  'Estatutos',
  'Comprovativo IBAN',
]

export default function AdminPage({ setCurrentView, session, onLogout }: Props) {
  const [tab, setTab] = useState<AdminTab>('users-docs')

  // Report templates
  const [rTemplates, setRTemplates] = useState<ReportTemplate[]>([])
  const [editingRT, setEditingRT] = useState<ReportTemplate | null>(null)

  // Preview
  const [previewReportId, setPreviewReportId] = useState('')
  const isAdmin = session?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      setRTemplates(getReportTemplates())
    }
  }, [isAdmin, tab])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4"></div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Administração</h1>
          {session ? (
            <>
              <p className="text-slate-500 text-sm mb-6">
                A conta <strong>{session.email}</strong> não tem permissões de administrador.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-800 mb-5">
                Para ativar esta conta como admin, execute no Supabase SQL Editor:
                <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-slate-700">{`update public.profiles
set role = 'admin'
where email = '${session.email}';`}</pre>
              </div>
              <button onClick={onLogout} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl">Terminar sessao</button>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6">Inicie sessao com uma conta Supabase que tenha role admin.</p>
              <button onClick={() => setCurrentView('login')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl">Entrar com conta admin</button>
            </>
          )}
          <button onClick={() => setCurrentView('home')} className="mt-4 text-sm text-blue-600 hover:text-blue-800">← Voltar ao site</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-slate-900 text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl"></span>
          <div><h1 className="font-black text-lg">Administração</h1><p className="text-xs text-slate-400">Templates & Configuração</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentView('home')} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg">Site</button>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg">Sair</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
        {([
          { id: 'users-docs' as const, label: 'Utilizadores e Documentos' },
          { id: 'donation-history' as const, label: 'Historico de Donativos' },
          { id: 'brand' as const, label: 'Identidade da Marca' },
          { id: 'report-templates' as const, label: 'Templates de Relatório' },
          { id: 'preview' as const, label: 'Pré-visualização' },
        ]).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setEditingRT(null) }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {tab === 'users-docs' && <AdminUsersDocumentsTab />}
        {tab === 'donation-history' && <AdminDonationHistoryTab />}
        {tab === 'brand' && <AdminBrandTab />}

        {/* ─── REPORT TEMPLATES ─── */}
        {tab === 'report-templates' && !editingRT && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Templates de Relatório PDF</h2>
              <div className="flex gap-2">
                <button onClick={() => setEditingRT(makeNewRT())} className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl">+ Novo Template</button>
                <button onClick={() => { resetReportTemplates(); setRTemplates(getReportTemplates()) }} className="bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl">Repor originais</button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rTemplates.map(t => (
                <RTCard key={t.id} template={t}
                  onEdit={() => setEditingRT({ ...t, sections: [...t.sections] })}
                  onDelete={() => { deleteReportTemplate(t.id); setRTemplates(getReportTemplates()) }}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'report-templates' && editingRT && (
          <RTEditor template={editingRT} onSave={t => { saveReportTemplate(t); setRTemplates(getReportTemplates()); setEditingRT(null) }} onCancel={() => setEditingRT(null)} />
        )}

        {/* ─── PREVIEW ─── */}
        {tab === 'preview' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900">Pré-visualização com dados simulados</h2>

            {/* Report preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4"> Template de Relatório</h3>
              <select value={previewReportId} onChange={e => setPreviewReportId(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-xl mb-4">
                <option value="">Selecionar template...</option>
                {rTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {previewReportId && (() => {
                const t = rTemplates.find(r => r.id === previewReportId)
                if (!t) return null
                const vars = buildPlaceholderVars(mockReport)
                return (
                  <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: t.accent }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: t.subAccent }} />
                      <span className="font-bold text-slate-700">{t.name}</span>
                    </div>
                    <div><span className="text-xs text-slate-500">Capa:</span><pre className="text-sm text-slate-700 whitespace-pre-wrap">{fillPlaceholders(t.coverTitle, vars)}</pre></div>
                    <div><span className="text-xs text-slate-500">Subtítulo:</span><p className="text-sm text-slate-700">{fillPlaceholders(t.coverSubtitle, vars)}</p></div>
                    <div><span className="text-xs text-slate-500">Sobre:</span><p className="text-sm text-slate-600">{fillPlaceholders(t.aboutText, vars)}</p></div>
                    <div><span className="text-xs text-slate-500">Secções ativas:</span><p className="text-sm text-slate-600">{t.sections.filter(s => s.enabled).map(s => s.label).join(' → ')}</p></div>
                    <div><span className="text-xs text-slate-500">Rodapé:</span><p className="text-sm text-slate-600">{t.footerText}</p></div>
                  </div>
                )
              })()}
            </div>

            {/* Placeholders reference */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4"> Referência de Placeholders</h3>
              <div className="grid md:grid-cols-3 gap-2 text-xs">
                {Object.entries(buildPlaceholderVars(mockReport)).map(([key, value]) => (
                  <div key={key} className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <code className="text-blue-600 font-mono">{`{{${key}}}`}</code>
                    <span className="text-slate-600 truncate ml-2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminUsersDocumentsTab() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [selectedRole, setSelectedRole] = useState<'empresa' | 'instituicao'>('empresa')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [documentsError, setDocumentsError] = useState('')
  const [savingDocumentId, setSavingDocumentId] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    setDocumentsError('')
    if (!realBackendEnabled()) {
      setError('Supabase ainda não está ativo no ficheiro .env.')
      setLoading(false)
      return
    }

    const profilesRes = await listAdminProfilesReal()

    if (!profilesRes.ok) {
      setError(`Sem acesso aos utilizadores: ${profilesRes.error}`)
      setLoading(false)
      return
    }
    setProfiles(profilesRes.profiles)

    const docsRes = await listAdminDocumentsReal()
    if (!docsRes.ok) {
      setDocuments([])
      setDocumentsError(`Documentos indisponíveis: ${docsRes.error}`)
    } else {
      setDocuments(docsRes.documents)
    }

    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const updateDocumentAccepted = async (documentId: string, accepted: boolean) => {
    setSavingDocumentId(documentId)
    setDocuments(current => current.map(document =>
      document.id === documentId
        ? { ...document, accepted, reviewed_at: accepted ? new Date().toISOString() : null }
        : document
    ))

    const result = await updateAdminDocumentAcceptedReal(documentId, accepted)
    setSavingDocumentId('')

    if (!result.ok) {
      setDocumentsError(`Não foi possível atualizar o documento: ${result.error}`)
      void load()
      return
    }

    setDocuments(current => current.map(document =>
      document.id === documentId ? { ...document, ...result.document } : document
    ))
  }

  const companyProfiles = profiles.filter(p => p.role === 'empresa')
  const institutionProfiles = profiles.filter(p => p.role === 'instituicao')
  const visibleProfiles = selectedRole === 'empresa' ? companyProfiles : institutionProfiles
  const selectedProfile = visibleProfiles.find(p => p.id === selectedProfileId) || visibleProfiles[0] || null
  const selectedDocuments = selectedProfile ? documents.filter(d => d.owner_id === selectedProfile.id) : []
  const companyCount = companyProfiles.length
  const institutionCount = institutionProfiles.length
  const pendingDocuments = documents.filter(d => !d.accepted)
  const acceptedDocuments = documents.filter(d => d.accepted)
  const profilesWithoutDocs = profiles.filter(p => !documents.some(d => d.owner_id === p.id))
  const institutionsMissingRequiredDocs = institutionProfiles.filter(profile => {
    const profileDocs = documents.filter(d => d.owner_id === profile.id)
    return REQUIRED_ADMIN_INSTITUTION_DOCS.some(required => !profileDocs.some(doc => doc.category === required))
  })

  useEffect(() => {
    const nextProfiles = selectedRole === 'empresa' ? companyProfiles : institutionProfiles
    if (nextProfiles.length === 0) {
      setSelectedProfileId('')
      return
    }
    if (!nextProfiles.some(p => p.id === selectedProfileId)) {
      setSelectedProfileId(nextProfiles[0].id)
    }
  }, [profiles, selectedRole, selectedProfileId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Utilizadores e Documentos</h2>
          <p className="text-sm text-slate-500">Dados reais guardados no Supabase.</p>
        </div>
        <button onClick={() => void load()} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl">
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-500 text-sm">
          A carregar dados do Supabase...
        </div>
      )}

      {!loading && error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 text-sm space-y-3">
          <p className="font-bold">Não foi possível carregar os dados reais.</p>
          <p>{error}</p>
          <p>
            Para esta aba funcionar, entra no site com uma conta Supabase e marca essa conta como admin na tabela
            <code className="mx-1 rounded bg-amber-100 px-1">profiles</code>.
          </p>
          <pre className="overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-700">{`update public.profiles
set role = 'admin'
where email = 'o-teu-email@exemplo.pt';`}</pre>
        </div>
      )}

      {!loading && !error && (
        <>
          {documentsError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {documentsError}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4">
            <AdminMetric label="Total de contas" value={profiles.length} />
            <AdminMetric label="Empresas" value={companyCount} />
            <AdminMetric label="Instituições" value={institutionCount} />
            <AdminMetric label="Documentos pendentes" value={pendingDocuments.length} detail={`${acceptedDocuments.length} aceites`} tone={pendingDocuments.length ? 'amber' : 'green'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">A rever</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Documentos por validar</h3>
              <p className="mt-2 text-sm text-amber-800">{pendingDocuments.length === 0 ? 'Não existem documentos pendentes.' : `${pendingDocuments.length} documento${pendingDocuments.length > 1 ? 's' : ''} aguarda${pendingDocuments.length > 1 ? 'm' : ''} validação.`}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Onboarding</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Contas sem documentos</h3>
              <p className="mt-2 text-sm text-blue-800">{profilesWithoutDocs.length === 0 ? 'Todas as contas têm documentos submetidos.' : `${profilesWithoutDocs.length} conta${profilesWithoutDocs.length > 1 ? 's' : ''} ainda sem documentos.`}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Instituições</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Documentos obrigatórios em falta</h3>
              <p className="mt-2 text-sm text-red-800">{institutionsMissingRequiredDocs.length === 0 ? 'Todas as instituições têm a documentação mínima.' : `${institutionsMissingRequiredDocs.length} instituição${institutionsMissingRequiredDocs.length > 1 ? 'ões' : ''} com documentação incompleta.`}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <h3 className="font-black text-slate-900">Utilizadores</h3>
                <p className="text-xs text-slate-500">Selecione um utilizador para consultar os documentos submetidos.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2">
                <button
                  onClick={() => setSelectedRole('empresa')}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${selectedRole === 'empresa' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Empresas ({companyCount})
                </button>
                <button
                  onClick={() => setSelectedRole('instituicao')}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${selectedRole === 'instituicao' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Instituições ({institutionCount})
                </button>
              </div>

              {visibleProfiles.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  Ainda não existem {selectedRole === 'empresa' ? 'empresas' : 'instituições'} registadas.
                </p>
              ) : (
                <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-100">
                  {visibleProfiles.map(p => {
                    const profileDocs = documents.filter(d => d.owner_id === p.id)
                    const docCount = profileDocs.length
                    const pendingCount = profileDocs.filter(d => !d.accepted).length
                    const isSelected = selectedProfile?.id === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`w-full px-5 py-4 text-left transition ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-900">{p.name}</p>
                            <p className="truncate text-sm text-slate-600">{p.email}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              NIF {p.nif} - {new Date(p.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${docCount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {docCount} doc.
                            </span>
                            {pendingCount > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">{pendingCount} por validar</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <h3 className="font-black text-slate-900">Documentos do utilizador</h3>
                {selectedProfile ? (
                  <div className="mt-2 rounded-xl bg-slate-50 p-4">
                    <p className="font-black text-slate-900">{selectedProfile.name}</p>
                    <p className="text-sm text-slate-600">{selectedProfile.email}</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <span><strong>NIF:</strong> {selectedProfile.nif}</span>
                      <span><strong>Tipo:</strong> {selectedProfile.role === 'empresa' ? 'Empresa' : 'Instituição'}</span>
                      {selectedProfile.company_activity && <span><strong>Setor:</strong> {selectedProfile.company_activity}</span>}
                      {selectedProfile.institution_category && <span><strong>Área:</strong> {selectedProfile.institution_category}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">{selectedDocuments.filter(d => d.accepted).length} aceites</span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">{selectedDocuments.filter(d => !d.accepted).length} por validar</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Selecione um utilizador na lista.</p>
                )}
              </div>

              {!selectedProfile ? (
                <p className="p-5 text-sm text-slate-500">Sem utilizador selecionado.</p>
              ) : selectedDocuments.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">Este utilizador ainda não submeteu documentos.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedDocuments.map(d => (
                    <div key={d.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-slate-800">{d.name}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${d.accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {d.accepted ? 'Aceite' : 'Por validar'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {d.category} - {(d.size / 1024).toFixed(1)} KB - {new Date(d.created_at).toLocaleString('pt-PT')}
                        </p>
                        {d.reviewed_at && (
                          <p className="mt-1 text-xs text-green-700">
                            Validado em {new Date(d.reviewed_at).toLocaleString('pt-PT')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(d.accepted)}
                            disabled={savingDocumentId === d.id}
                            onChange={event => void updateDocumentAccepted(d.id, event.target.checked)}
                            className="h-4 w-4 accent-green-600"
                          />
                          Documento aceite
                        </label>
                        {d.public_url ? (
                          <a href={d.public_url} download={d.name} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                            Descarregar
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Sem link disponivel</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function parseDonationYear(date: string) {
  const match = String(date || '').match(/(\d{4})/)
  if (match) return match[1]
  const parts = String(date || '').split('/')
  return parts[2] || ''
}

function buildDonationHistoryItems() {
  const institutions = listProjectInstitutions()
  return listProofs()
    .map(proof => {
      const institution = institutions.find(inst => inst.name === proof.institutionName || inst.id === proof.institutionAccountId)
      const project = institution?.needs.find(n => proof.selectedNeedIds?.includes(n.id)) || institution?.needs[0]
      return {
        proof,
        institution,
        project,
        year: parseDonationYear(proof.confirmedAt || proof.date),
        companyName: proof.companyName || proof.companyEmail || proof.companyAccountId || 'Empresa não identificada',
      }
    })
    .sort((a, b) => String(b.proof.confirmedAt || b.proof.date).localeCompare(String(a.proof.confirmedAt || a.proof.date)))
}

function AdminDonationHistoryTab() {
  const [year, setYear] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const items = buildDonationHistoryItems()
  const years = [...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b.localeCompare(a))
  const institutions = [...new Set(items.map(i => i.proof.institutionName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-PT'))
  const companies = [...new Set(items.map(i => i.companyName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-PT'))
  const filtered = items.filter(item =>
    (!year || item.year === year) &&
    (!institutionFilter || item.proof.institutionName === institutionFilter) &&
    (!companyFilter || item.companyName === companyFilter)
  )
  const selected = filtered.find(i => i.proof.id === selectedId) || filtered[0] || null

  useEffect(() => {
    if (selected && selected.proof.id !== selectedId) setSelectedId(selected.proof.id)
    if (!selected) setSelectedId('')
  }, [selected?.proof.id])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Historico de Donativos</h2>
          <p className="text-sm text-slate-500">Área privada para consultar donativos, comprovativos e dados objetivos de cada apoio.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <AdminMetric label="Donativos" value={items.length} />
          <AdminMetric label="Confirmados" value={items.filter(i => i.proof.status === 'confirmed').length} />
          <AdminMetric label="Com prova" value={items.filter(i => i.proof.proofFileDataUrl || i.proof.companyInvoiceFileDataUrl).length} />
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <select value={year} onChange={e => setYear(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos os anos</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={institutionFilter} onChange={e => setInstitutionFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todas as instituições</option>
          {institutions.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todas as empresas</option>
          {companies.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-black text-slate-900">Donativos registados</h3>
            <p className="text-xs text-slate-500">{filtered.length} resultado(s) com os filtros atuais.</p>
          </div>
          {filtered.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Não existem donativos para estes filtros.</p>
          ) : (
            <div className="max-h-[660px] divide-y divide-slate-100 overflow-y-auto">
              {filtered.map(item => (
                <button
                  key={item.proof.id}
                  onClick={() => setSelectedId(item.proof.id)}
                  className={`w-full p-5 text-left transition ${selected?.proof.id === item.proof.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{item.companyName}</p>
                      <p className="truncate text-sm text-slate-600">{item.proof.institutionName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.proof.date} - EUR {(item.proof.confirmedAmount || item.proof.amount).toLocaleString('pt-PT')}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.proof.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {!selected ? (
            <p className="text-sm text-slate-500">Selecione um donativo para ver o detalhe.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">Detalhe privado</p>
                  <h3 className="text-xl font-black text-slate-900">{selected.companyName}</h3>
                  <p className="text-sm text-slate-500">{selected.proof.institutionName}</p>
                </div>
              </div>

              {selected.project && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-black text-slate-900">Projeto apoiado</h4>
                  <p className="mt-1 text-sm font-bold text-slate-700">{selected.project.category} - {selected.project.subcategory}</p>
                  <p className="mt-2 text-sm text-slate-600">{selected.project.description}</p>
                  <div className="mt-4 grid gap-2 text-xs md:grid-cols-2">
                    <InfoPill label="Benef. diretos" value={`${(selected.project.beneficiaries || 0).toLocaleString('pt-PT')}`} />
                    <InfoPill label="ODS" value={selected.project.sdgGoals.map(s => `ODS ${s}`).join(', ') || 'Nao indicado'} />
                    <InfoPill label="Metrica" value={selected.project.impactMetric || 'Nao indicada'} />
                    <InfoPill label="Fase" value={selected.project.implementationPhase || 'candidatura'} />
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <InfoPill label="Valor doado" value={`EUR ${(selected.proof.confirmedAmount || selected.proof.amount).toLocaleString('pt-PT')}`} />
                <InfoPill label="Contribuicao solicitada" value={`EUR ${selected.project ? (selected.project.requestedAmount || selected.project.totalProjectCost || selected.project.estimatedValue || selected.proof.projectCost || 0).toLocaleString('pt-PT') : '0'}`} />
                <InfoPill label="Data" value={selected.proof.date} />
                <InfoPill label="Estado" value={selected.proof.status} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-black text-slate-900">Comprovativo de transferencia</h4>
                {selected.proof.proofFileDataUrl || selected.proof.companyInvoiceFileDataUrl ? (
                  <a
                    href={selected.proof.proofFileDataUrl || selected.proof.companyInvoiceFileDataUrl}
                    download={selected.proof.proofFileName || selected.proof.companyInvoiceFileName || 'comprovativo'}
                    className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                  >
                    Descarregar comprovativo
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Nao existe comprovativo anexado a este donativo.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  )
}

function AdminMetric({ label, value, detail, tone = 'slate' }: { label: string; value: number; detail?: string; tone?: 'slate' | 'amber' | 'green' }) {
  const color = tone === 'amber' ? 'text-amber-700' : tone === 'green' ? 'text-green-700' : 'text-slate-900'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  )
}

// ─── EDITORS ─────────────────────────────────────

function makeNewRT(): ReportTemplate {
  return {
    id: `rt-${Date.now()}`, name: 'Novo Template', accent: '#0f172a', subAccent: '#2563eb', background: '#ffffff',
    note: '', sections: [
      { id: 'cover', label: 'Capa', enabled: true }, { id: 'toc', label: 'Índice', enabled: true },
      { id: 'summary', label: 'Sumário Executivo', enabled: true }, { id: 'overview', label: 'Empresa & Instituição', enabled: true },
      { id: 'metrics', label: 'Métricas de impacto', enabled: true }, { id: 'sdg', label: 'ODS', enabled: true },
      { id: 'needs', label: 'Necessidades', enabled: true }, { id: 'gallery', label: 'Galeria', enabled: true },
      { id: 'fiscal', label: 'Dados Fiscais', enabled: true },
    ],
    coverTitle: 'Relatório\nde Impacto', coverSubtitle: 'Donativo ao abrigo da Lei do Mecenato',
    aboutText: 'Relatório gerado para {{empresa}}.', footerText: 'Lei do Mecenato', disclaimer: 'Iniciativa privada independente.',
    ...defaultReportAdvanced,
  }
}

function RTCard({ template: t, onEdit, onDelete }: { template: ReportTemplate; onEdit: () => void; onDelete: () => void }) {
  const [instIdx, setInstIdx] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadAdminDemoReport(t.name, instIdx, t)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.accent }} />
        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.subAccent }} />
        <div className="flex-1"><h3 className="font-bold text-slate-800">{t.name}</h3></div>
      </div>
      <p className="text-xs text-slate-500 mb-2">{t.note}</p>
      <p className="text-xs text-slate-400 mb-3">{t.sections.filter(s => s.enabled).length} secções ativas</p>

      {/* Instituição para demo */}
      <div className="mb-3">
        <label className="block text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-1">Instituição para o exemplo</label>
        <select value={instIdx} onChange={e => setInstIdx(+e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
          {sampleInstitutions.map((inst, i) => (
            <option key={inst.id} value={i}>{inst.logo} {inst.name} — {inst.category}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 bg-blue-50 text-blue-700 text-xs font-bold py-2 rounded-lg hover:bg-blue-100">Editar</button>
        <button onClick={handleDownload} disabled={downloading}
          className="flex-1 bg-green-50 text-green-700 text-xs font-bold py-2 rounded-lg hover:bg-green-100 disabled:opacity-50">
          {downloading ? '⏳...' : ' PDF'}
        </button>
        <button onClick={onDelete} className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-100">×</button>
      </div>
    </div>
  )
}

function RTEditor({ template, onSave, onCancel }: { template: ReportTemplate; onSave: (t: ReportTemplate) => void; onCancel: () => void }) {
  const [t, setT] = useState(template)
  const update = (patch: Partial<ReportTemplate>) => setT(prev => ({ ...prev, ...patch }))
  const toggleSection = (id: string) => setT(prev => ({
    ...prev,
    sections: prev.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
  }))

  const handleBackgroundUpload = (sectionId: string, file?: File) => {
    if (!file) return
    const validationError = validateImageUpload(file)
    if (validationError) {
      alert(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setT(prev => ({
        ...prev,
        pageBackgrounds: {
          ...(prev.pageBackgrounds || {}),
          [sectionId]: dataUrl,
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeBackground = (sectionId: string) => {
    setT(prev => {
      const next = { ...(prev.pageBackgrounds || {}) }
      delete next[sectionId]
      return { ...prev, pageBackgrounds: next }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900">Editar Template de Relatório</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl">Cancelar</button>
          <button onClick={() => onSave(t)} className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl">Guardar</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Nome *</label>
          <input value={t.name} onChange={e => update({ name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Descrição</label>
          <input value={t.note} onChange={e => update({ note: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Cor Principal</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={t.accent} onChange={e => update({ accent: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
            <input value={t.accent} onChange={e => update({ accent: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Cor Secundária</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={t.subAccent} onChange={e => update({ subAccent: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
            <input value={t.subAccent} onChange={e => update({ subAccent: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Opções avançadas de layout */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Opções Avançadas de Layout</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estilo de Layout</label>
            <select value={t.layoutStyle} onChange={e => update({ layoutStyle: e.target.value as ReportTemplate['layoutStyle'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
              <option value="corporate">Corporate</option>
              <option value="editorial">Editorial</option>
              <option value="magazine">Magazine</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estilo da Capa</label>
            <select value={t.coverStyle} onChange={e => update({ coverStyle: e.target.value as ReportTemplate['coverStyle'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
              <option value="minimal">Minimal</option>
              <option value="circles">Círculos ESG</option>
              <option value="photo-led">Foto em destaque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Posição do Logótipo</label>
            <select value={t.logoPosition} onChange={e => update({ logoPosition: e.target.value as ReportTemplate['logoPosition'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
              <option value="top-left">Topo esquerdo</option>
              <option value="top-right">Topo direito</option>
              <option value="center">Centro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tratamento de Imagem</label>
            <select value={t.imageTreatment} onChange={e => update({ imageTreatment: e.target.value as ReportTemplate['imageTreatment'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
              <option value="rounded">Cantos arredondados</option>
              <option value="framed">Moldura</option>
              <option value="full-bleed">Full bleed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estilo dos KPIs</label>
            <select value={t.kpiStyle} onChange={e => update({ kpiStyle: e.target.value as ReportTemplate['kpiStyle'] })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm">
              <option value="cards">Cards</option>
              <option value="badges">Badges</option>
              <option value="table">Tabela</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Raio dos Cantos</label>
            <input type="number" min={0} max={20} value={t.cornerRadius}
              onChange={e => update({ cornerRadius: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tamanho dos Títulos</label>
            <input type="number" min={18} max={56} value={t.headingSize}
              onChange={e => update({ headingSize: Number(e.target.value) || 34 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tamanho do Corpo</label>
            <input type="number" min={7} max={18} value={t.bodySize}
              onChange={e => update({ bodySize: Number(e.target.value) || 12 })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm" />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={t.showLogo} onChange={e => update({ showLogo: e.target.checked })} className="accent-blue-600" />
              Mostrar logótipo
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={t.showPageNumbers} onChange={e => update({ showPageNumbers: e.target.checked })} className="accent-blue-600" />
              Mostrar paginação
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Título da Capa (use \n para quebra de linha)</label>
        <input value={t.coverTitle} onChange={e => update({ coverTitle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Subtítulo da Capa</label>
        <input value={t.coverSubtitle} onChange={e => update({ coverSubtitle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Texto "Sobre este relatório"</label>
        <textarea value={t.aboutText} onChange={e => update({ aboutText: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Rodapé</label>
        <input value={t.footerText} onChange={e => update({ footerText: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Disclaimer Legal</label>
        <textarea value={t.disclaimer} onChange={e => update({ disclaimer: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none" />
      </div>

      {/* Textos de secções */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-4">Textos e Labels de Secções</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Título da explicação das métricas</label>
            <input value={t.methodTitle} onChange={e => update({ methodTitle: e.target.value })} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Título da mensagem de agradecimento</label>
            <input value={t.thankYouTitle} onChange={e => update({ thankYouTitle: e.target.value })} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Título da galeria</label>
            <input value={t.galleryTitle} onChange={e => update({ galleryTitle: e.target.value })} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">Título das necessidades</label>
            <input value={t.needsTitle} onChange={e => update({ needsTitle: e.target.value })} className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-blue-700 mb-1">Texto da metodologia das métricas</label>
          <textarea value={t.methodText} onChange={e => update({ methodText: e.target.value })} rows={4} className="w-full px-3 py-2 border border-blue-200 rounded-xl resize-none text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-3">Secções do PDF</label>
        <div className="grid grid-cols-3 gap-2">
          {t.sections.map(s => (
            <button key={s.id} onClick={() => toggleSection(s.id)}
              className={`p-3 rounded-xl text-sm font-semibold border-2 transition ${s.enabled ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 line-through'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fundos de página */}
      <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
        <h3 className="font-bold text-purple-900 mb-2">Fundos por Página</h3>
        <p className="text-xs text-purple-700 mb-4">
          Pode carregar uma imagem JPG/PNG para o fundo de cada página. Recomendado: proporção A4 vertical (ex: 1240×1754 px). Se não carregar imagem, é usada a cor do template/ODS.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.sections.map(section => {
            const bg = t.pageBackgrounds?.[section.id]
            return (
              <div key={section.id} className="bg-white border border-purple-100 rounded-xl p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{section.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{section.id}</p>
                  </div>
                  {bg && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">com fundo</span>}
                </div>

                <div className="h-28 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center mb-3">
                  {bg ? (
                    <img src={bg} alt={`Fundo ${section.label}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 text-center px-2">Sem fundo personalizado</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <label className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg text-center cursor-pointer">
                    Carregar
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={e => handleBackgroundUpload(section.id, e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                  {bg && (
                    <button onClick={() => removeBackground(section.id)} className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-lg">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
