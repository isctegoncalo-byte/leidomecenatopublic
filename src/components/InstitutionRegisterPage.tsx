import { useEffect, useState } from 'react'
import { NeedItem } from '../types'
import { saveInstitutionRegistration } from '../utils/institutionRegistry'
import { SDG_DATA } from '../data/sdgs'
import SdgGrid from './SdgGrid'
import { ACCEPTED_IMAGE_INPUT, validateImageUpload } from '../utils/uploadSecurity'
import {
  PROJECT_TYPE_LIMIT_MESSAGE,
  ProjectSupportType,
  duplicateActiveProjectTypeMessage,
  hasActiveProjectOfType,
  nextAvailableProjectType,
} from '../utils/projectLimits'

const NEED_CATEGORIES = [
  { value: 'Educação', label: '📚 Educação', subcategories: ['Material Escolar', 'Tecnologia Educativa', 'Bolsas de Estudo', 'Formação Profissional', 'Programas Escolares'] },
  { value: 'Saúde', label: '🏥 Saúde', subcategories: ['Equipamento Médico', 'Medicação', 'Saúde Mental', 'Reabilitação', 'Prevenção'] },
  { value: 'Alimentação', label: '🍽️ Alimentação', subcategories: ['Refeições', 'Banco Alimentar', 'Cabazes', 'Cozinha Social'] },
  { value: 'Habitação', label: '🏠 Habitação', subcategories: ['Remodelação', 'Equipamento Doméstico', 'Apoio ao Arrendamento'] },
  { value: 'Tecnologia', label: '💻 Tecnologia', subcategories: ['Hardware', 'Software', 'Conectividade', 'IoT/Sensores'] },
  { value: 'Infraestrutura', label: '🏗️ Infraestrutura', subcategories: ['Espaços', 'Requalificação', 'Acessibilidade', 'Equipamento'] },
  { value: 'Ambiente', label: '🌳 Ambiente', subcategories: ['Reflorestação', 'Monitorização', 'Sensibilização', 'Energia Renovável'] },
  { value: 'Cultura', label: '🎨 Cultura', subcategories: ['Exposições', 'Digitalização', 'Conservação', 'Publicações'] },
  { value: 'Desporto', label: '⚽ Desporto', subcategories: ['Equipamento', 'Instalações', 'Formação', 'Bolsas de Participação'] },
  { value: 'Social', label: '🤲 Social', subcategories: ['Inclusão', 'Bolsas', 'Apoio Psicossocial', 'Transporte'] },
  { value: 'Ciência', label: '🔬 Ciência', subcategories: ['Equipamento Laboratorial', 'Bolsas de Investigação', 'Publicações', 'Divulgação'] },
  { value: 'Recursos Humanos', label: '👥 Recursos Humanos', subcategories: ['Formação', 'Voluntariado', 'Contratação', 'Certificações'] },
]



interface Props {
  onComplete: () => void
}

const emptyNeed = (): NeedItem => ({
  id: Date.now().toString(),
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

const STEPS = ['Identidade', 'Missão & Impacto', 'Equipa & Recursos', 'Necessidades ESG', 'Revisão']

export default function InstitutionRegisterPage({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [photoUrls, setPhotoUrls] = useState<string[]>(['', '', '', ''])
  const [consentLogo, setConsentLogo] = useState(false)
  const [consentRGPD, setConsentRGPD] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [step])

  // Identity
  const [identity, setIdentity] = useState({
    name: '', legalName: '', nif: '', type: '', category: '',
    address: '', municipality: '', district: '', postalCode: '',
    phone: '', email: '', website: '', linktreeUrl: '', facebookUrl: '', instagramUrl: '',
    linkedinUrl: '', tiktokUrl: '', founded: '', iban: '',
  })

  // Mission
  const [mission, setMission] = useState({
    description: '', mission: '', mainActivities: '',
    pastAchievements: '', peopleReachedPerYear: '',
  })

  // Team
  const [team, setTeam] = useState({
    fullTimeStaff: '', partTimeStaff: '', volunteers: '', annualBudget: '',
    utilidadePublica: false, statutes: false, lastAccountsApproved: false, ibanProof: false,
  })

  // Needs
  const [needs, setNeeds] = useState<NeedItem[]>([emptyNeed()])

  const updateNeed = (idx: number, field: keyof NeedItem, value: unknown) => {
    setNeeds(prev => prev.map((n, i) => i === idx ? { ...n, [field]: value } : n))
  }

  const updateNeedSupportType = (idx: number, value: ProjectSupportType) => {
    const next = needs.map((n, i) => i === idx
      ? {
        ...n,
        supportType: value,
        requestedAmount: value === 'produtos' ? undefined : n.requestedAmount,
        productOrService: value === 'dinheiro' ? '' : n.productOrService,
      }
      : n)
    const limitMessage = duplicateActiveProjectTypeMessage(next)
    if (limitMessage) {
      setFormError(limitMessage)
      return
    }
    setFormError('')
    setNeeds(next)
  }

  const toggleSDG = (idx: number, sdg: number) => {
    setNeeds(prev => prev.map((n, i) => {
      if (i !== idx) return n
      const current = n.sdgGoals
      return {
        ...n,
        sdgGoals: current.includes(sdg) ? current.filter(s => s !== sdg) : [...current, sdg]
      }
    }))
  }

  const addNeed = () => {
    const nextType = nextAvailableProjectType(needs)
    if (!nextType) {
      setFormError(PROJECT_TYPE_LIMIT_MESSAGE)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setFormError('')
    setNeeds(prev => [...prev, { ...emptyNeed(), supportType: nextType }])
  }
  const removeNeed = (idx: number) => setNeeds(prev => prev.filter((_, i) => i !== idx))

  const hasOtherActiveNeedOfType = (idx: number, type: ProjectSupportType) =>
    hasActiveProjectOfType(needs.filter((_, i) => i !== idx), type)

  const handlePhotoChange = (idx: number, file?: File) => {
    if (!file) return
    const validationError = validateImageUpload(file)
    if (validationError) {
      setFormError(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoUrls(prev => {
        const next = [...prev]
        next[idx] = String(reader.result || '')
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const handleLogoChange = (file?: File) => {
    if (!file) return
    const validationError = validateImageUpload(file)
    if (validationError) {
      setFormError(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleProjectPhotoChange = (needIdx: number, photoIdx: number, file?: File) => {
    if (!file) return
    const validationError = validateImageUpload(file)
    if (validationError) {
      setFormError(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setNeeds(prev => prev.map((need, idx) => {
        if (idx !== needIdx) return need
        const next = [...(need.projectPhotoUrls || [])].slice(0, 5)
        next[photoIdx] = String(reader.result || '')
        return { ...need, projectPhotoUrls: next.filter(Boolean).slice(0, 5) }
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeProjectPhoto = (needIdx: number, photoIdx: number) => {
    setNeeds(prev => prev.map((need, idx) => {
      if (idx !== needIdx) return need
      return { ...need, projectPhotoUrls: (need.projectPhotoUrls || []).filter((_, i) => i !== photoIdx) }
    }))
  }

  const validateStep = (s: number): string[] => {
    const missing: string[] = []
    if (s === 0) {
      if (!identity.name.trim())         missing.push('Nome Comum')
      if (!identity.legalName.trim())    missing.push('Denominação Legal Completa')
      if (!identity.nif.trim())          missing.push('NIF')
      if (identity.nif.trim() && !/^\d{9}$/.test(identity.nif.trim())) missing.push('NIF com 9 dígitos numéricos')
      if (!identity.type)                missing.push('Tipo de Entidade')
      if (!identity.category)            missing.push('Área de Atuação')
      if (!identity.address.trim())      missing.push('Morada')
      if (!identity.municipality.trim()) missing.push('Município')
      if (!identity.district.trim())     missing.push('Distrito')
      if (!identity.phone.trim())        missing.push('Telefone')
      if (!identity.email.trim())        missing.push('Email')
      if (!identity.iban.trim())         missing.push('IBAN')
      if (!logoUrl)                      missing.push('Logótipo da Instituição')
    }
    if (s === 1) {
      if (!mission.description.trim())        missing.push('Descrição da Instituição')
      if (!mission.mission.trim())            missing.push('Declaração de Missão')
      if (!mission.mainActivities.trim())     missing.push('Principais Atividades')
      if (!mission.peopleReachedPerYear)      missing.push('Pessoas Beneficiadas por Ano')
    }
    if (s === 2) {
      // Equipa: nada obrigatório explicitamente marcado com *
    }
    if (s === 3) {
      const limitMessage = duplicateActiveProjectTypeMessage(needs)
      if (limitMessage) missing.push(limitMessage)
      needs.forEach((n, i) => {
        const tag = `Necessidade #${i + 1}`
        if (!n.category)                  missing.push(`${tag}: Categoria`)
        if (!n.subcategory)               missing.push(`${tag}: Subcategoria`)
        if (!n.description.trim())        missing.push(`${tag}: Descrição`)
        if (!n.supportType)               missing.push(`${tag}: Tipo de apoio pretendido`)
        if (!n.implementationPhase)       missing.push(`${tag}: Fase de Implementação`)
        if (n.supportType === 'dinheiro' && !n.requestedAmount) missing.push(`${tag}: Verba pretendida`)
        if (n.supportType === 'produtos' && !n.productOrService?.trim()) missing.push(`${tag}: Produto/serviço pretendido`)
        if (!n.totalProjectCost)          missing.push(`${tag}: Custo total do projeto`)
        if (n.securedFunding === undefined) missing.push(`${tag}: Verba já assegurada`)
        if (!n.impactMetric.trim())       missing.push(`${tag}: Métrica de Impacto`)
        if (n.sdgGoals.length === 0)      missing.push(`${tag}: ODS (mínimo 1)`)
      })
    }
    return missing
  }

  const tryAdvance = () => {
    const missing = validateStep(step)
    if (missing.length > 0) {
      setFormError(`Para avançar, preenche os seguintes campos obrigatórios: ${missing.join(', ')}.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setFormError('')
    setStep(s => s + 1)
  }

  const handleSubmit = () => {
    // Valida todos os passos
    const allMissing: string[] = []
    for (let s = 0; s <= 3; s++) {
      const m = validateStep(s)
      if (m.length > 0) {
        allMissing.push(...m)
      }
    }
    if (allMissing.length > 0) {
      setFormError(`Faltam preencher os seguintes campos obrigatórios: ${allMissing.join(', ')}.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!consentRGPD) {
      setFormError('Deve aceitar o tratamento de dados de acordo com o RGPD para submeter o registo.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setFormError('')
    setSubmitting(true)
    const normalizedNeeds = needs.map(need => {
      const target = need.requestedAmount || need.estimatedValue || need.totalProjectCost || 0
      const progress = target ? ((need.securedFunding || 0) / target) * 100 : 0
      return {
        ...need,
        estimatedValue: target || undefined,
        status: progress >= 100 ? 'concluido' as const : 'ativo' as const,
      }
    })
    const limitMessage = duplicateActiveProjectTypeMessage(normalizedNeeds)
    if (limitMessage) {
      setFormError(limitMessage)
      setSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setTimeout(() => {
      saveInstitutionRegistration({
        name: identity.name,
        legalName: identity.legalName,
        nif: identity.nif,
        type: identity.type,
        category: identity.category,
        founded: identity.founded,
        description: mission.description,
        mission: mission.mission,
        address: identity.address,
        municipality: identity.municipality,
        district: identity.district,
        postalCode: identity.postalCode,
        phone: identity.phone,
        email: identity.email,
        website: identity.website,
        linktreeUrl: identity.linktreeUrl,
        facebookUrl: identity.facebookUrl,
        instagramUrl: identity.instagramUrl,
        linkedinUrl: identity.linkedinUrl,
        tiktokUrl: identity.tiktokUrl,
        iban: identity.iban,
        fullTimeStaff: Number(team.fullTimeStaff || 0),
        partTimeStaff: Number(team.partTimeStaff || 0),
        volunteers: Number(team.volunteers || 0),
        annualBudget: team.annualBudget,
        peopleReachedPerYear: Number(mission.peopleReachedPerYear || 0),
        mainActivities: mission.mainActivities,
        pastAchievements: mission.pastAchievements,
        logoUrl,
        photoUrls,
        needs: normalizedNeeds,
        statutes: team.statutes,
        utilidadePublica: team.utilidadePublica,
        lastAccountsApproved: team.lastAccountsApproved,
      })
      setSubmitting(false)
      setSubmitted(true)
    }, 2500)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-lg text-center">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Registo Submetido!</h2>
          <p className="text-slate-500 mb-4">
            O perfil de <strong>{identity.name}</strong> foi submetido para verificação. 
            Em 2–3 dias úteis a nossa equipa irá verificar os dados e ativar o perfil na plataforma.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-green-800 text-sm font-semibold mb-2">Próximos passos:</p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>✅ Análise do perfil ESG (1–2 dias úteis)</li>
              <li>✅ Verificação dos documentos submetidos</li>
              <li>✅ Ativação e publicação na plataforma</li>
              <li>✅ Notificação por email: <strong>{identity.email}</strong></li>
            </ul>
          </div>
          <button onClick={onComplete} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition">
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {formError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Progress */}
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 mb-6">Registo de Instituição</h1>
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                    i < step ? 'bg-blue-600 border-blue-600 text-white' :
                    i === step ? 'bg-white border-blue-600 text-blue-600' :
                    'bg-white border-slate-300 text-slate-400'
                  }`}>{i < step ? '✓' : i + 1}</div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {STEPS.map((s, i) => (
                <span key={s} className={`text-xs font-medium flex-1 text-center ${i === step ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* STEP 0: Identity */}
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">🏛️ Identidade da Instituição</h2>

              {/* Logótipo da Instituição (obrigatório) */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Logótipo da Instituição *</label>
                <p className="text-xs text-slate-400 mb-3">
                  Carrega o logótipo oficial da instituição. Aparecerá no perfil público e no relatório ESG.
                </p>
                <label className="flex items-center gap-4 border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                  <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logótipo da instituição" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-slate-400 text-xs text-center px-2">Sem logótipo</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-700 text-sm mb-1">
                      {logoUrl ? 'Substituir logótipo' : 'Carregar logótipo'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Formatos aceites: PNG, JPG ou SVG. Tamanho recomendado: 512×512 px.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_INPUT}
                    onChange={e => handleLogoChange(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nome Comum *</label>
                  <input value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Associação Crescer Juntos" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Denominação Legal Completa *</label>
                  <input value={identity.legalName} onChange={e => setIdentity({...identity, legalName: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome completo conforme estatutos" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">NIF *</label>
                  <input value={identity.nif} onChange={e => setIdentity({...identity, nif: e.target.value.replace(/\D/g, '').slice(0, 9)})} inputMode="numeric" maxLength={9}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Número de Identificação Fiscal" />
                  <p className="mt-1 text-xs text-slate-400">9 dígitos, apenas números.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de Entidade *</label>
                  <select value={identity.type} onChange={e => setIdentity({...identity, type: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Selecione...</option>
                    <option>Associação</option>
                    <option>Fundação</option>
                    <option>IPSS</option>
                    <option>Santa Casa da Misericórdia</option>
                    <option>Mutualista</option>
                    <option>Cooperativa de Solidariedade</option>
                    <option>Centro de Investigação</option>
                    <option>Museu / Entidade Cultural</option>
                    <option>Outra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Área de Atuação *</label>
                  <select value={identity.category} onChange={e => setIdentity({...identity, category: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Selecione...</option>
                    <option>Infância e Juventude</option>
                    <option>Saúde</option>
                    <option>Cultura e Património</option>
                    <option>Ambiente</option>
                    <option>Desporto</option>
                    <option>Ciência e Investigação</option>
                    <option>Educação</option>
                    <option>Ação Social</option>
                    <option>Habitação</option>
                    <option>Emprego e Formação</option>
                    <option>Outra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Ano de Fundação</label>
                  <input value={identity.founded} onChange={e => setIdentity({...identity, founded: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 1998" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Morada *</label>
                  <input value={identity.address} onChange={e => setIdentity({...identity, address: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Rua, número, andar" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Município *</label>
                  <input value={identity.municipality} onChange={e => setIdentity({...identity, municipality: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Lisboa" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Distrito *</label>
                  <input value={identity.district} onChange={e => setIdentity({...identity, district: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Lisboa" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Telefone *</label>
                  <input value={identity.phone} onChange={e => setIdentity({...identity, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+351 21..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Email *</label>
                  <input type="email" value={identity.email} onChange={e => setIdentity({...identity, email: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="geral@instituicao.pt" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Website</label>
                  <input value={identity.website} onChange={e => setIdentity({...identity, website: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.instituicao.pt" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">LinkTree</label>
                  <input value={identity.linktreeUrl} onChange={e => setIdentity({...identity, linktreeUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://linktr.ee/..." />
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-base font-bold text-slate-800 mt-2 mb-1">Redes sociais</h3>
                  <p className="text-xs text-slate-400 mb-3">Campos opcionais para apresentar e validar a presença pública da instituição.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Facebook</label>
                  <input value={identity.facebookUrl} onChange={e => setIdentity({...identity, facebookUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.facebook.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Instagram</label>
                  <input value={identity.instagramUrl} onChange={e => setIdentity({...identity, instagramUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.instagram.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">LinkedIn</label>
                  <input value={identity.linkedinUrl} onChange={e => setIdentity({...identity, linkedinUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.linkedin.com/company/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">TikTok</label>
                  <input value={identity.tiktokUrl} onChange={e => setIdentity({...identity, tiktokUrl: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.tiktok.com/@..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">IBAN *</label>
                  <input value={identity.iban} onChange={e => setIdentity({...identity, iban: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-wide" placeholder="PT50 0000 0000 0000 0000 0000 0" maxLength={34} />
                  <p className="text-xs text-slate-400 mt-1">IBAN da conta bancária da instituição. Será necessário submeter o comprovativo na secção de documentos.</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-3">📷 Fotografias da Instituição (opcional)</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Podes carregar até 4 fotografias da instituição e/ou do projeto a ser apoiado. As imagens carregadas farão parte do relatório ESG. Este passo não é obrigatório.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <label key={idx} className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                      <div className="h-40 flex items-center justify-center overflow-hidden rounded-xl bg-white mb-3">
                        {photoUrls[idx] ? (
                          <img src={photoUrls[idx]} alt={`Fotografia ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-sm text-center px-4">Fotografia {idx + 1} (opcional)</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept={ACCEPTED_IMAGE_INPUT}
                        onChange={e => handlePhotoChange(idx, e.target.files?.[0])}
                        className="hidden"
                      />
                      <div className="text-center text-sm font-semibold text-blue-700">Carregar foto {idx + 1}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Mission & Impact */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">🎯 Missão e Impacto</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Descrição da Instituição *</label>
                  <p className="text-xs text-slate-400 mb-2">Descreva em detalhe o que faz, onde atua e quem beneficia (mín. 200 caracteres)</p>
                  <textarea value={mission.description} onChange={e => setMission({...mission, description: e.target.value})}
                    rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="A nossa associação atua no concelho de... apoiando... através de..." />
                  <p className="text-xs text-right text-slate-400 mt-1">{mission.description.length} caracteres</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Declaração de Missão *</label>
                  <p className="text-xs text-slate-400 mb-2">Uma frase clara e concisa que descreve o propósito da organização</p>
                  <textarea value={mission.mission} onChange={e => setMission({...mission, mission: e.target.value})}
                    rows={2} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Ex: Garantir que nenhuma criança fica para trás, proporcionando acesso a educação e alimentação." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Principais Atividades *</label>
                  <p className="text-xs text-slate-400 mb-2">Liste as atividades, programas e projetos que desenvolvem</p>
                  <textarea value={mission.mainActivities} onChange={e => setMission({...mission, mainActivities: e.target.value})}
                    rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="- Programa de apoio escolar (200 alunos/ano)&#10;- Banco alimentar comunitário (80 famílias/mês)&#10;- Oficinas de formação profissional..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Realizações e Impacto nos Últimos 3 Anos</label>
                  <p className="text-xs text-slate-400 mb-2">Evidências concretas do impacto gerado — números, prémios, reconhecimentos</p>
                  <textarea value={mission.pastAchievements} onChange={e => setMission({...mission, pastAchievements: e.target.value})}
                    rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="- 2023: Apoiámos 1.200 crianças, aumento de 15% face a 2022&#10;- Prémio Social Innovation Award 2023&#10;- Parceria estabelecida com Câmara Municipal..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Pessoas Beneficiadas por Ano *</label>
                  <input type="number" value={mission.peopleReachedPerYear}
                    onChange={e => setMission({...mission, peopleReachedPerYear: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: 1500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Team & Resources */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">👥 Equipa e Recursos</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Colaboradores a Tempo Inteiro</label>
                  <input type="number" value={team.fullTimeStaff} onChange={e => setTeam({...team, fullTimeStaff: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Colaboradores a Tempo Parcial</label>
                  <input type="number" value={team.partTimeStaff} onChange={e => setTeam({...team, partTimeStaff: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Voluntários Regulares</label>
                  <input type="number" value={team.volunteers} onChange={e => setTeam({...team, volunteers: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Orçamento Anual Aproximado</label>
                  <select value={team.annualBudget} onChange={e => setTeam({...team, annualBudget: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Selecione...</option>
                    <option>Menos de 50.000€</option>
                    <option>50.000€ - 100.000€</option>
                    <option>100.000€ - 250.000€</option>
                    <option>250.000€ - 500.000€</option>
                    <option>500.000€ - 1.000.000€</option>
                    <option>Mais de 1.000.000€</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-bold text-slate-700 mb-4">Documentação e Estatutos</h3>
                <div className="space-y-3">
                  {[
                    { key: 'statutes', label: 'Estatutos atualizados disponíveis para envio' },
                    { key: 'utilidadePublica', label: 'Reconhecimento de Utilidade Pública (DL 460/77)' },
                    { key: 'lastAccountsApproved', label: 'Contas do último exercício aprovadas em Assembleia Geral' },
                    { key: 'ibanProof', label: 'Comprovativo de IBAN da instituição' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={team[item.key as keyof typeof team] as boolean}
                        onChange={e => setTeam({...team, [item.key]: e.target.checked})}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <span className="text-slate-700 text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">
                  <strong>📎 Nota:</strong> Após a submissão, a nossa equipa entrará em contacto para recolha dos documentos em formato digital. 
                  As instituições com Estatuto de Utilidade Pública recebem um <strong>badge de verificação</strong> e têm prioridade no matching com empresas.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Needs */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-2">📋 Necessidades ESG Detalhadas</h2>
                <p className="text-blue-700 text-sm">
                  Esta é a secção mais importante. Quanto mais detalhe fornecer, melhor será o 
                  <strong> Impact Score</strong> gerado e maior a probabilidade de atrair donativos. 
                  Cada necessidade é classificada por <strong>pilar ESG</strong> e <strong>alinhamento com os ODS da ONU</strong>.
                </p>
                <p className="text-blue-800 text-sm font-bold mt-3">
                  Regra: cada instituição só pode ter, em simultâneo, um projeto ativo a pedir dinheiro e um projeto ativo a pedir produtos/serviços.
                </p>
              </div>

              {needs.map((need, idx) => {
                const catInfo = NEED_CATEGORIES.find(c => c.value === need.category)
                return (
                  <div key={need.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                      <h3 className="font-bold text-white">Necessidade #{idx + 1}</h3>
                      {needs.length > 1 && (
                        <button onClick={() => removeNeed(idx)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                          ✕ Remover
                        </button>
                      )}
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-5">
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Categoria *</label>
                        <select value={need.category} onChange={e => updateNeed(idx, 'category', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          <option value="">Selecione...</option>
                          {NEED_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Subcategoria *</label>
                        <select value={need.subcategory} onChange={e => updateNeed(idx, 'subcategory', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          disabled={!catInfo}>
                          <option value="">Selecione...</option>
                          {catInfo?.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Descrição Detalhada *</label>
                        <p className="text-xs text-slate-400 mb-1.5">Seja específico: o quê, para quem, onde, em que quantidade e porquê</p>
                        <textarea value={need.description} onChange={e => updateNeed(idx, 'description', e.target.value)}
                          rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                          placeholder="Ex: 30 computadores portáteis para equipar a sala de informática da escola de apoio, permitindo que 150 crianças dos 6 aos 12 anos tenham acesso a literacia digital." />
                      </div>

                      {/* ESG Pillar */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Pilar ESG Principal *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['E', 'S', 'G'] as const).map(p => {
                            const colors = {
                              E: 'border-green-400 bg-green-50 text-green-700',
                              S: 'border-blue-400 bg-blue-50 text-blue-700',
                              G: 'border-purple-400 bg-purple-50 text-purple-700',
                            }
                            const labels = { E: '🌱 Ambiental', S: '👥 Social', G: '⚖️ Governação' }
                            return (
                              <button key={p} onClick={() => updateNeed(idx, 'esgPillar', p)}
                                className={`p-2 rounded-xl border-2 text-xs font-bold transition ${need.esgPillar === p ? colors[p] : 'border-slate-200 text-slate-400'}`}>
                                {labels[p]}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Urgency */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Urgência *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['alta', 'media', 'baixa'] as const).map(u => {
                            const colors = {
                              alta: 'border-red-400 bg-red-50 text-red-700',
                              media: 'border-yellow-400 bg-yellow-50 text-yellow-700',
                              baixa: 'border-green-400 bg-green-50 text-green-700',
                            }
                            const labels = { alta: '🔴 Alta', media: '🟡 Média', baixa: '🟢 Baixa' }
                            return (
                              <button key={u} onClick={() => updateNeed(idx, 'urgency', u)}
                                className={`p-2 rounded-xl border-2 text-xs font-bold transition ${need.urgency === u ? colors[u] : 'border-slate-200 text-slate-400'}`}>
                                {labels[u]}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Estimated Value */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de apoio pretendido *</label>
                        <select value={need.supportType || 'dinheiro'} onChange={e => updateNeedSupportType(idx, e.target.value as ProjectSupportType)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          <option value="dinheiro" disabled={hasOtherActiveNeedOfType(idx, 'dinheiro')}>Dinheiro</option>
                          <option value="produtos" disabled={hasOtherActiveNeedOfType(idx, 'produtos')}>Produto/serviço</option>
                        </select>
                        <p className="mt-2 text-xs text-slate-400">
                          Cada instituição pode ter ativo apenas um projeto por tipo de apoio.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Fase de Implementação *</label>
                        <select value={need.implementationPhase || 'candidatura'} onChange={e => updateNeed(idx, 'implementationPhase', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          <option value="candidatura">Em fase de candidatura</option>
                          <option value="a-decorrer">A decorrer</option>
                        </select>
                      </div>

                      {need.supportType === 'produtos' ? (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-2">Produto/serviço pretendido *</label>
                          <input value={need.productOrService ?? ''} onChange={e => updateNeed(idx, 'productOrService', e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: carrinha frigorífica, software, equipamentos..." />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-2">Verba pretendida (€) *</label>
                          <input type="number" value={need.requestedAmount ?? ''} onChange={e => updateNeed(idx, 'requestedAmount', +e.target.value || undefined)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 15000" />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Custo total do projeto (€) *</label>
                        <input type="number" value={need.totalProjectCost ?? ''} onChange={e => updateNeed(idx, 'totalProjectCost', +e.target.value || undefined)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 15000" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Verba já assegurada (€) *</label>
                        <input type="number" value={need.securedFunding ?? ''} onChange={e => updateNeed(idx, 'securedFunding', +e.target.value || 0)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 5000" />
                      </div>

                      {/* Beneficiaries */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">N.º de Beneficiários Diretos</label>
                        <input type="number" value={need.beneficiaries ?? ''} onChange={e => updateNeed(idx, 'beneficiaries', +e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 200" />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Quantidade / Unidade</label>
                        <input value={need.quantity ?? ''} onChange={e => updateNeed(idx, 'quantity', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Ex: 30 unidades, 12 meses, 500 kits..." />
                      </div>

                      {/* Impact Metric */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Métrica de Impacto *</label>
                        <input value={need.impactMetric} onChange={e => updateNeed(idx, 'impactMetric', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Ex: 150 crianças com acesso a literacia digital durante 1 ano letivo" />
                      </div>

                      {/* SDG Alignment */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                          Alinhamento ODS (Objetivos de Desenvolvimento Sustentável) *
                        </label>
                        <p className="text-xs text-slate-400 mb-3">
                          Clique nos ODS com que esta necessidade se alinha. Cada tile abaixo tem um link "Saber mais" para a descrição oficial em português.
                        </p>
                        <SdgGrid selected={need.sdgGoals} onToggle={(s) => toggleSDG(idx, s)} />
                        {need.sdgGoals.length > 0 && (
                          <div className="mt-3 text-xs text-slate-500">
                            Selecionados: {need.sdgGoals.map(n => SDG_DATA.find(s => s.n === n)?.fullLabel).join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Galeria de fotos do projeto</label>
                        <p className="text-xs text-slate-400 mb-3">Opcional. Pode carregar até 5 fotos para aparecerem na página pública deste projeto.</p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          {Array.from({ length: 5 }).map((_, photoIdx) => {
                            const photo = need.projectPhotoUrls?.[photoIdx]
                            return (
                              <div key={photoIdx} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                                <label className="block cursor-pointer">
                                  <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-white">
                                    {photo ? (
                                      <img src={photo} alt={`Foto ${photoIdx + 1} do projeto`} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="px-2 text-center text-xs text-slate-400">Foto {photoIdx + 1}</span>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept={ACCEPTED_IMAGE_INPUT}
                                    onChange={e => handleProjectPhotoChange(idx, photoIdx, e.target.files?.[0])}
                                    className="hidden"
                                  />
                                  <span className="block text-center text-xs font-bold text-blue-700">{photo ? 'Substituir' : 'Carregar'}</span>
                                </label>
                                {photo && (
                                  <button onClick={() => removeProjectPhoto(idx, photoIdx)} className="mt-1 w-full text-xs font-bold text-red-600">
                                    Remover
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <button onClick={addNeed}
                disabled={!nextAvailableProjectType(needs)}
                className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed font-bold py-4 rounded-2xl transition">
                {nextAvailableProjectType(needs) ? '+ Adicionar Necessidade' : 'Limite de projetos ativos atingido'}
              </button>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700">
                  <strong>💡 Dica:</strong> As instituições com 3 ou mais necessidades detalhadas, com métricas de impacto claras
                  e alinhamento ODS definido, recebem em média <strong>3x mais donativos</strong> do que as que têm perfis incompletos.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">✅ Revisão do Perfil</h2>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3">🏛️ Identidade</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logótipo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-slate-400 text-[10px] text-center px-1">Sem logo</span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm flex-1">
                      <div><span className="text-slate-500">Nome:</span> <strong>{identity.name || '—'}</strong></div>
                      <div><span className="text-slate-500">NIF:</span> <strong>{identity.nif || '—'}</strong></div>
                      <div><span className="text-slate-500">Tipo:</span> <strong>{identity.type || '—'}</strong></div>
                      <div><span className="text-slate-500">Área:</span> <strong>{identity.category || '—'}</strong></div>
                      <div><span className="text-slate-500">Município:</span> <strong>{identity.municipality || '—'}</strong></div>
                      <div><span className="text-slate-500">Email:</span> <strong>{identity.email || '—'}</strong></div>
                      <div className="md:col-span-2"><span className="text-slate-500">IBAN:</span> <strong className="font-mono tracking-wide">{identity.iban || '—'}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3">👥 Equipa</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-black text-blue-600">{team.fullTimeStaff || 0}</p><p className="text-xs text-slate-500">Tempo Inteiro</p></div>
                    <div><p className="text-2xl font-black text-green-600">{team.volunteers || 0}</p><p className="text-xs text-slate-500">Voluntários</p></div>
                    <div><p className="text-lg font-bold text-slate-600">{team.utilidadePublica ? '✅ UP' : '—'}</p><p className="text-xs text-slate-500">Utilidade Pública</p></div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3">📋 Necessidades ({needs.length})</h3>
                  <div className="space-y-2">
                    {needs.map((n) => (
                      <div key={n.id} className="flex items-center gap-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          n.esgPillar === 'E' ? 'bg-green-100 text-green-700' :
                          n.esgPillar === 'S' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{n.esgPillar}</span>
                        <span className="text-slate-700">{n.category} {n.subcategory && `› ${n.subcategory}`}</span>
                        {n.estimatedValue && <span className="ml-auto text-slate-500 text-xs">€ {n.estimatedValue.toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3">📷 Fotografias para o Relatório ESG</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="h-28 flex items-center justify-center bg-slate-100">
                          {url ? (
                            <img src={url} alt={`Fotografia ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-slate-400 text-center px-3">Foto {idx + 1} (opcional)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={consentRGPD} onChange={e => setConsentRGPD(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">
                      <strong>Consinto o tratamento dos dados da instituição</strong> de acordo com o RGPD (Regulamento Geral sobre a Proteção de Dados) para efeitos de registo, comunicação e funcionamento da plataforma. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={consentLogo} onChange={e => setConsentLogo(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">
                      <strong>Autorizo a utilização do logótipo</strong> da instituição na secção de parceiros do site Lei do Mecenato, para divulgação de que a instituição recebeu donativos ao abrigo da Lei do Mecenato.
                    </span>
                  </label>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <p className="text-blue-700 text-sm">
                    <strong>Ao submeter:</strong> Confirma que todos os dados são verdadeiros e que autoriza a Lei do Mecenato 
                    a publicar o perfil da instituição na plataforma após verificação. 
                    Declara ainda que a instituição cumpre os requisitos legais para receber donativos ao abrigo do Estatuto do Mecenato.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => step === 0 ? undefined : setStep(s => s - 1)}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                step === 0 ? 'invisible' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ← Anterior
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={tryAdvance}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition"
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-10 py-3 rounded-xl transition flex items-center gap-2"
              >
                {submitting ? (
                  <><span className="animate-spin">⏳</span> A processar...</>
                ) : (
                  '✅ Submeter Registo'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
