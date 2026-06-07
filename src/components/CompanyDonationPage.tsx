import { useEffect, useState } from 'react'
import { Account, ImpactContract, DonationType, REPORT_TIERS, VAT_RATE, calculateTotalWithVat, calculateVat, formatCurrency } from '../types'
import { esgPillarInfo } from '../utils/esgEngine'
import { COMPANY_SECTORS } from '../data/companySectors'
import { listProjectInstitutions } from '../utils/projectCatalog'
import SdgIcon from './SdgIcon'
import { buildPaymentUrl, getReportPaymentLink, isPaymentLinkConfigured } from '../utils/paymentLinks'
import { ACCEPTED_DOCUMENT_INPUT, validateDocumentUpload } from '../utils/uploadSecurity'
import { realBackendEnabled, upsertReportTransactionPendingReal } from '../utils/supabaseBackend'


interface Props {
  onContractComplete: (contract: ImpactContract) => void
  account?: Account | null
}

const STEPS = ['Tipo de Donativo', 'Escolher Projeto', 'Informações para Donativo', 'Confirmar']

const NO_REPORT_TIER = {
  id: 'sem-relatorio',
  name: 'Sem Relatório de Impacto',
  price: 0,
  features: ['Apenas registo e validação do donativo na plataforma'],
  highlighted: false,
  color: 'slate',
}

const institutionDonationDetails: Record<string, { iban: string; titular: string; email: string; phone: string; reference: string }> = {
  '1':  { iban: 'PT50 0035 0123 0000 1234 5678 9', titular: 'Associação Crescer Juntos', email: 'donativos@crescerjuntos.pt', phone: '+351 265 000 001', reference: 'DON-CRESCER-JUNTOS' },
  '2':  { iban: 'PT50 0035 0123 0000 2234 5678 9', titular: 'Centro de Reabilitação Horizonte', email: 'donativos@horizontereab.pt', phone: '+351 210 000 002', reference: 'DON-HORIZONTE' },
  '3':  { iban: 'PT50 0035 0123 0000 3234 5678 9', titular: 'Fundação Arte & Memória', email: 'mecenato@artememoria.pt', phone: '+351 220 000 003', reference: 'DON-ARTE-MEMORIA' },
  '4':  { iban: 'PT50 0035 0123 0000 4234 5678 9', titular: 'Associação Raiz Verde', email: 'donativos@raizverde.pt', phone: '+351 266 000 004', reference: 'DON-RAIZ-VERDE' },
  '5':  { iban: 'PT50 0035 0123 0000 5234 5678 9', titular: 'Academia Desportiva Inclusiva', email: 'apoio@academiainclusiva.pt', phone: '+351 214 000 005', reference: 'DON-ACADEMIA-INCLUSIVA' },
  '6':  { iban: 'PT50 0035 0123 0000 6234 5678 9', titular: 'Instituto de Investigação Oceânica', email: 'mecenato@oceaninvest.pt', phone: '+351 289 000 006', reference: 'DON-OCEANICA' },
  '7':  { iban: 'PT50 0035 0123 0000 7234 5678 9', titular: 'Banco Alimentar do Porto', email: 'donativos@bancalimentar.pt', phone: '+351 225 000 007', reference: 'DON-BANCO-ALIMENTAR' },
  '8':  { iban: 'PT50 0035 0123 0000 8234 5678 9', titular: 'Casa da Criança de Coimbra', email: 'apoio@casadacrianca.pt', phone: '+351 239 000 008', reference: 'DON-CASA-CRIANCA' },
  '9':  { iban: 'PT50 0035 0123 0000 9234 5678 9', titular: 'Música Sem Fronteiras', email: 'donativos@musicasemfronteiras.pt', phone: '+351 217 000 009', reference: 'DON-MUSICA' },
  '10': { iban: 'PT50 0035 0123 0000 1034 5678 9', titular: 'Refloresta Portugal', email: 'donativos@refloresta.pt', phone: '+351 244 000 010', reference: 'DON-REFLORESTA' },
  '11': { iban: 'PT50 0035 0123 0000 1134 5678 9', titular: 'Apoio Maior — Idosos', email: 'donativos@apoiomaior.pt', phone: '+351 273 000 011', reference: 'DON-APOIO-MAIOR' },
  '12': { iban: 'PT50 0035 0123 0000 1234 5000 9', titular: 'CodeKids — Programação para Todos', email: 'donativos@codekids.pt', phone: '+351 253 000 012', reference: 'DON-CODEKIDS' },
  '13': { iban: 'PT50 0035 0123 0000 1334 5678 9', titular: 'Teatro Social de Lisboa', email: 'mecenato@teatrosocial.pt', phone: '+351 218 000 013', reference: 'DON-TEATRO-SOCIAL' },
  '14': { iban: 'PT50 0035 0123 0000 1434 5678 9', titular: 'Animais em Risco', email: 'donativos@animaisemrisco.pt', phone: '+351 219 000 014', reference: 'DON-ANIMAIS' },
  '15': { iban: 'PT50 0035 0123 0000 1534 5678 9', titular: 'Habitação Solidária', email: 'donativos@habitacaosolidaria.pt', phone: '+351 232 000 015', reference: 'DON-HABITACAO' },
}

function InfoLine({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={`bg-white border border-blue-100 rounded-xl p-3 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mb-1">{label}</p>
      <p className={`text-slate-800 font-bold break-all ${mono ? 'font-mono text-sm' : 'text-sm'}`}>{value}</p>
    </div>
  )
}

export default function CompanyDonationPage({ onContractComplete, account }: Props) {
  const [step, setStep] = useState(0)
  const [donationType, setDonationType] = useState<DonationType>(null)
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [amount, setAmount] = useState(5000)
  const [projectCost, setProjectCost] = useState(0)
  const [productDesc, setProductDesc] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [processing, setProcessing] = useState(false)
  const [company, setCompany] = useState({
    name: account?.role === 'empresa' ? account.name : '',
    nif: account?.role === 'empresa' ? account.nif : '',
    email: account?.role === 'empresa' ? account.email : '',
    contact: '',
    activity: account?.role === 'empresa' ? account.companyActivity || '' : '',
  })
  const [selectedTierId, setSelectedTierId] = useState('premium')
  const [noImpactReport, setNoImpactReport] = useState(false)
  const [proofFile, setProofFile] = useState<{ name: string; dataUrl: string; size: number } | null>(null)
  const [publicDonationAmountConsent, setPublicDonationAmountConsent] = useState(false)
  const paymentMethod = 'stripe' as 'stripe' | 'card' | 'mbway' | 'transfer'
  const setPaymentMethod = (_method: 'stripe' | 'card' | 'mbway' | 'transfer') => {}
  const cardName = ''
  const cardNumber = ''
  const expiry = ''
  const cvc = ''
  const mbwayPhone = ''
  const setCardName = (_value: string) => {}
  const setCardNumber = (_value: string) => {}
  const setExpiry = (_value: string) => {}
  const setCvc = (_value: string) => {}
  const setMbwayPhone = (_value: string) => {}

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    const raw = localStorage.getItem('leidomecenato_pending_project')
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as { institutionId?: string; needId?: string; donationType?: DonationType; amount?: number; projectCost?: number }
      if (pending.institutionId) setSelectedInstitutionId(pending.institutionId)
      if (pending.needId) setSelectedNeeds([pending.needId])
      if (pending.donationType) setDonationType(pending.donationType)
      if (pending.projectCost) setProjectCost(pending.projectCost)
      setStep(2)
    } catch {
      localStorage.removeItem('leidomecenato_pending_project')
    }
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem('leidomecenato_simulator_seed')
    if (!raw) return
    try {
      const seed = JSON.parse(raw) as { donationType?: DonationType; amount?: number }
      if (seed.donationType) setDonationType(seed.donationType)
      if (seed.amount) setAmount(seed.amount)
      localStorage.removeItem('leidomecenato_simulator_seed')
      setStep(1)
    } catch {
      localStorage.removeItem('leidomecenato_simulator_seed')
    }
  }, [])

  const wantsImpactReport = !noImpactReport
  const tier = wantsImpactReport ? REPORT_TIERS.find(t => t.id === selectedTierId)! : NO_REPORT_TIER
  const reportVat = wantsImpactReport ? calculateVat(tier.price) : 0
  const reportTotal = wantsImpactReport ? calculateTotalWithVat(tier.price) : 0
  const paymentLink = getReportPaymentLink(selectedTierId)
  const paymentReady = wantsImpactReport && isPaymentLinkConfigured(selectedTierId)
  const irsDeduction = amount * 1.4
  const ircSavings = irsDeduction * 0.21
  const institutions = listProjectInstitutions()
  const institution = institutions.find(i => i.id === selectedInstitutionId)

  const categories = [...new Set(institutions.map(i => i.category))]
  const filtered = categoryFilter ? institutions.filter(i => i.category === categoryFilter) : institutions
  const donationDetails = selectedInstitutionId ? institutionDonationDetails[selectedInstitutionId] : null
  const projectTitle = (need: NonNullable<typeof institution>['needs'][number]) =>
    need.projectName || [need.category, need.subcategory].filter(Boolean).join(' › ') || 'Projeto'
  const projectTarget = (need: NonNullable<typeof institution>['needs'][number]) =>
    need.requestedAmount || need.totalProjectCost || need.estimatedValue || 0
  const isProjectForDonationType = (need: NonNullable<typeof institution>['needs'][number]) =>
    donationType === 'produtos' ? need.supportType === 'produtos' : need.supportType !== 'produtos'
  const selectProject = (institutionId: string, need: NonNullable<typeof institution>['needs'][number]) => {
    setSelectedInstitutionId(institutionId)
    setSelectedNeeds([need.id])
    setProjectCost(projectTarget(need))
    setStep(2)
  }
  const stepGuidance = [
    {
      title: 'Comece pelo tipo de apoio',
      body: 'Escolha apoio financeiro, produtos ou serviços para ajustarmos projetos e comprovativos.',
    },
    {
      title: 'Escolha o projeto apoiado',
      body: 'Ao escolher o projeto, assumimos que o apoio incide sobre todas as dimensões descritas na candidatura.',
    },
    {
      title: 'Registe empresa, valor e comprovativos',
      body: 'O donativo é feito diretamente à instituição; a plataforma apenas organiza prova e relatório.',
    },
    {
      title: 'Confirme e escolha o relatório',
      body: 'Revise dados, benefício fiscal estimado, pagamento do serviço e documentos a entregar.',
    },
  ]

  const canContinue =
    step === 0 ? Boolean(donationType) :
    step === 1 ? Boolean(selectedInstitutionId && selectedNeeds.length > 0) :
    step === 2 ? Boolean(company.name && company.email && company.nif.length === 9 && company.activity && amount > 0) :
    true

  const nextStep = () => {
    if (!canContinue) {
      const messages = [
        'Escolha o tipo de donativo.',
        'Selecione o projeto que pretende apoiar.',
        'Preencha empresa, NIF, email, setor e valor do donativo.',
      ]
      alert(messages[step] || 'Complete os dados obrigatorios.')
      return
    }
    setStep(s => s + 1)
  }

  const buildContract = (): ImpactContract => ({
    id: `CTR-${Date.now()}`,
    company: company.name,
    nif: company.nif,
    email: company.email,
    contact: company.contact,
    activity: company.activity,
    institutionId: selectedInstitutionId,
    institutionName: institution?.name || '',
    donationType,
    donationAmount: amount,
    publicDonationAmountConsent,
    donationDate: new Date().toLocaleDateString('pt-PT'),
    reportTier: tier,
    reportPrice: tier.price,
    reportVat,
    reportTotal,
    reportPaymentStatus: wantsImpactReport ? 'pending' : 'none',
    selectedNeedIds: selectedNeeds,
    donationMode: donationType === 'dinheiro' ? 'causa-com-projeto' : 'necessidade-exata',
    projectCost: donationType === 'dinheiro' ? projectCost : undefined,
    proofFileName: proofFile?.name,
    proofFileDataUrl: proofFile?.dataUrl,
    proofFileSize: proofFile?.size,
  })

  const handleConfirm = async () => {
    if (!/^\d{9}$/.test(company.nif.trim())) {
      alert('O NIF da empresa deve ter exatamente 9 dígitos numéricos.')
      return
    }
    if (!company.activity) {
      alert('Selecione o setor de atividade da empresa.')
      return
    }
    if (wantsImpactReport && !paymentReady) {
      alert('Configure primeiro o link de pagamento Stripe para este pacote no ficheiro .env.local.')
      return
    }
    if (false) {
      alert('Preencha os dados do cartão para pagar o serviço de relatório.')
      return
    }
    if (false) {
      alert('Indique o número MB WAY para pagar o serviço de relatório.')
      return
    }
    if (!proofFile) {
      alert('Carregue o comprovativo do donativo antes de confirmar. Este documento é obrigatório para a instituição validar o donativo.')
      return
    }
    if (wantsImpactReport) {
      const contract = buildContract()
      setProcessing(true)
      if (realBackendEnabled() && account) {
        const saved = await upsertReportTransactionPendingReal(contract, account, paymentLink)
        if (!saved.ok) {
          setProcessing(false)
          alert(`Nao foi possivel guardar a transacao antes do pagamento: ${saved.error}`)
          return
        }
      }
      const paymentUrl = buildPaymentUrl(paymentLink, {
        client_reference_id: contract.id,
        prefilled_email: company.email,
        company_name: company.name,
        company_nif: company.nif,
        institution_name: contract.institutionName,
        report_tier: contract.reportTier.name,
      })
      localStorage.setItem('leidomecenato_pending_report_payment', JSON.stringify({
        contract,
        paymentProvider: 'stripe',
        paymentLink,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      }))
      window.location.href = paymentUrl
      return
    }
    setProcessing(true)
    setTimeout(() => {
      const contract: ImpactContract = {
        id: `CTR-${Date.now()}`,
        company: company.name,
        nif: company.nif,
        email: company.email,
        contact: company.contact,
        activity: company.activity,
        institutionId: selectedInstitutionId,
        institutionName: institution?.name || '',
        donationType,
        donationAmount: amount,
        publicDonationAmountConsent,
        donationDate: new Date().toLocaleDateString('pt-PT'),
        reportTier: tier,
        reportPrice: tier.price,
        reportVat,
        reportTotal,
        reportPaymentStatus: wantsImpactReport ? 'pending' : 'none',
        selectedNeedIds: selectedNeeds,
        donationMode: donationType === 'dinheiro' ? 'causa-com-projeto' : 'necessidade-exata',
        projectCost: donationType === 'dinheiro' ? projectCost : undefined,
        proofFileName: proofFile?.name,
        proofFileDataUrl: proofFile?.dataUrl,
        proofFileSize: proofFile?.size,
      }
      setProcessing(false)
      localStorage.removeItem('leidomecenato_pending_project')
      onContractComplete(contract)
    }, 2500)
  }

  const handleProofUpload = (file?: File) => {
    if (!file) return
    const validationError = validateDocumentUpload(file)
    if (validationError) {
      alert(validationError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setProofFile({ name: file.name, size: file.size, dataUrl: String(reader.result || '') })
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Disclaimer banner */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-8 text-center">
          <p className="text-green-800 font-bold">
             O donativo vai <strong>100%</strong> da empresa para a instituição. Pagará apenas o serviço de relatório de impacto.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>RGPD:</strong> os dados da empresa, contactos, comprovativos e documentos submetidos serão tratados apenas
            para gerir o donativo, permitir validação pela instituição, produzir o relatório de impacto e cumprir obrigações
            legais aplicáveis. Evite carregar dados pessoais que não sejam necessários.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-blue-600">Fluxo guiado para empresas</p>
              <h1 className="text-3xl font-black text-slate-900 mb-3">Pedir Relatório de Impacto do Donativo</h1>
              <p className="text-slate-500 text-sm">
                Registe um donativo feito ou planeado, associe-o a uma necessidade concreta e escolha o nível de relatório.
                <strong> Não processamos donativos.</strong> O valor é transferido diretamente para a instituição.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">Passo {step + 1} de {STEPS.length}</p>
              <h2 className="mt-1 text-lg font-black text-blue-950">{stepGuidance[step].title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-800">{stepGuidance[step].body}</p>
            </div>
          </div>
          <div className="hidden">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Pedir Relatório de Impacto do Donativo</h1>
          <p className="text-slate-500 text-sm mb-6">
            Registe o donativo que já fez (ou vai fazer) e contrate um serviço de relatório de impacto.
            <strong> Não processamos donativos.</strong> O valor do donativo é transferido diretamente para a instituição.
          </p>
          </div>
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'bg-white border-blue-600 text-blue-600' :
                  'bg-white border-slate-300 text-slate-400'
                }`}>{i < step ? '' : i + 1}</div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs flex-1 text-center font-medium ${i === step ? 'text-blue-600' : 'text-slate-400'}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-3">O donativo que a empresa fez (ou vai fazer) é em...</h2>
            <p className="text-slate-500 text-sm mb-8">A empresa faz o donativo diretamente à instituição. Esta informação é apenas para o relatório de impacto.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {([
                { type: 'dinheiro' as const, label: '€', title: 'Donativo financeiro', desc: 'Transferência bancária feita diretamente à instituição beneficiária.' },
                { type: 'produtos' as const, label: 'B/S', title: 'Produtos ou Serviços', desc: 'Doação de bens ou prestação de serviços à instituição.' },
              ] as const).map(opt => (
                <button key={opt.type} onClick={() => { setDonationType(opt.type); setStep(1) }}
                  className="p-8 border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition text-left group">
                  <div className="w-14 h-14 mb-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-lg font-black">
                    {opt.label}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-700">{opt.title}</h3>
                  <p className="text-slate-500 text-sm">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Institution */}
        {step === 1 && (
          <div>
            <p className="text-slate-500 text-sm mb-4">Selecione o projeto que recebeu (ou vai receber) o donativo. Ao escolher o projeto, o apoio fica associado a todas as dimensões da respetiva candidatura.</p>
            <div className="flex gap-4 mb-6 flex-wrap">
              <button onClick={() => setCategoryFilter('')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>Todas</button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>{c}</button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.flatMap(inst =>
                inst.needs
                  .filter(need => need.status !== 'concluido' && need.status !== 'inativo' && need.implementationPhase !== 'inativo' && isProjectForDonationType(need))
                  .map(need => {
                    const isSelected = selectedInstitutionId === inst.id && selectedNeeds.includes(need.id)
                    return (
                <button key={`${inst.id}-${need.id}`} onClick={() => selectProject(inst.id, need)}
                  className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition overflow-hidden text-left ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
                  <div className="bg-slate-800 px-5 py-4 flex items-center gap-3">
                    <span className="text-3xl">{inst.logo}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm leading-tight truncate">{inst.name}</h3>
                      <p className="text-slate-400 text-xs">{inst.municipality} • {inst.category}</p>
                    </div>
                    {inst.utilidadePublica && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">UP</span>}
                    {inst.verified && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">Verificado</span>}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 mb-2">Projeto</p>
                    <h3 className="font-black text-slate-900 mb-2">{projectTitle(need)}</h3>
                    <p className="text-slate-500 text-xs mb-4 line-clamp-3">{need.executiveSummary || need.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {need.sdgGoals.slice(0, 5).map(sdg => (
                        <SdgIcon key={sdg} n={sdg} size="sm" className="rounded-md" />
                      ))}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      <strong>{donationType === 'produtos' ? 'Produto/serviço:' : 'Custo/valor do projeto:'}</strong>{' '}
                      {donationType === 'produtos' ? need.productOrService || 'Produto/serviço indicado na candidatura' : `€ ${projectTarget(need).toLocaleString('pt-PT')}`}
                    </div>
                  </div>
                </button>
                    )
                  })
              )}
            </div>

          </div>
        )}

        {/* STEP 2: Company + Report tier */}
        {step === 2 && (
          <div className="space-y-6">
            {institution && donationDetails && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Dados para processar o donativo</p>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">{institution.name}</h2>
                    <p className="text-sm text-blue-700 mb-4">
                      Use estes dados para fazer o donativo diretamente para a instituição. A plataforma não recebe nem retém qualquer valor do donativo.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <InfoLine label="Titular da conta" value={donationDetails.titular} />
                      <InfoLine label="Referência a usar" value={donationDetails.reference} mono />
                      <InfoLine label="IBAN" value={donationDetails.iban} mono wide />
                      <InfoLine label="Email para comprovativo" value={donationDetails.email} />
                      <InfoLine label="Telefone" value={donationDetails.phone} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-blue-200 p-4 min-w-[220px]">
                    <p className="text-xs text-slate-500 mb-2">Checklist recomendado:</p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li> Transferir 100% do valor para a instituição</li>
                      <li> Usar a referência indicada</li>
                      <li> Guardar comprovativo da transferência</li>
                      <li> Carregar comprovativo na confirmação</li>
                      <li> Aguardar confirmação da instituição</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Dados da Empresa</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nome da Empresa *</label>
                  <input value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">NIF *</label>
                  <input value={company.nif} onChange={e => setCompany({...company, nif: e.target.value.replace(/\D/g, '').slice(0, 9)})} inputMode="numeric" maxLength={9} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <p className="mt-1 text-xs text-slate-400">9 dígitos, apenas números.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Email *</label>
                  <input type="email" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Telefone</label>
                  <input value={company.contact} onChange={e => setCompany({...company, contact: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Setor de Atividade *</label>
                  <select value={company.activity} onChange={e => setCompany({...company, activity: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Selecione...</option>
                    {COMPANY_SECTORS.map(sector => <option key={sector} value={sector}>{sector}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Valor do Donativo</h2>
              <p className="text-slate-500 text-sm mb-4">Valor total do donativo que a empresa fez (ou vai fazer) diretamente à instituição.</p>
              {donationType === 'produtos' && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Descrição dos Produtos/Serviços doados</label>
                  <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              )}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-600">Valor do Donativo (€)</label>
                  <span className="text-2xl font-black text-blue-700">€ {amount.toLocaleString('pt-PT')}</span>
                </div>
                <input type="range" min={500} max={200000} step={500} value={amount} onChange={e => setAmount(+e.target.value)} className="w-full accent-blue-600 mb-3" />
                <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl font-bold" />
              </div>

              {donationType === 'dinheiro' && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Custo total do projeto / causa (€)</label>
                  <input
                    type="number"
                    min="1"
                    value={projectCost}
                    onChange={e => setProjectCost(+e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg font-bold"
                    placeholder="Ex: 25000"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    O relatório calculará a percentagem do seu donativo face ao custo total do projeto submetido pela instituição.
                  </p>
                </div>
              )}

              {donationType === 'produtos' && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm">
                    Se o valor dos produtos/serviços corresponder exatamente a uma necessidade selecionada, o relatório de impacto fica mais simples de produzir.
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-green-800 font-bold">Este valor irá <strong>100%</strong> para a instituição. A plataforma não retém qualquer percentagem do donativo.</p>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Confirmar</h2>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 text-sm">
                  <strong>O donativo de € {amount.toLocaleString('pt-PT')} irá 100% para a instituição.</strong>
                  {wantsImpactReport
                    ? <> O serviço de relatório é faturado à parte, com IVA à taxa legal em vigor.</>
                    : <> Não será contratado Relatório de Impacto.</>}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-700 text-sm"><strong>Aviso importante:</strong> A Lei do Mecenato é uma iniciativa privada independente. Não somos um organismo público nem uma entidade certificadora oficial. Não processamos donativos: a empresa faz o donativo diretamente à instituição.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-slate-800 mb-4">Escolha do Serviço de Relatório de Impacto do Donativo</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {REPORT_TIERS.map(t => {
                    const colors: Record<string, string> = { slate: 'border-slate-300', blue: 'border-blue-500 ring-2 ring-blue-100', purple: 'border-purple-300' }
                    return (
                      <div key={t.id} onClick={() => { setSelectedTierId(t.id); setNoImpactReport(false) }}
                        className={`rounded-2xl border-2 cursor-pointer p-4 transition relative ${!noImpactReport && selectedTierId === t.id ? colors[t.color] : 'border-slate-200 hover:border-slate-300'}`}>
                        {t.highlighted && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-bold">Popular</div>}
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <p className="text-xl font-black mt-1">{formatCurrency(t.price)}</p>
                        <p className="text-xs text-slate-400">+ IVA {Math.round(VAT_RATE * 100)}%</p>
                        <ul className="mt-3 space-y-1">
                          {t.features.slice(0, 4).map(f => (
                            <li key={f} className="text-xs text-slate-600">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
                <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${noImpactReport ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={noImpactReport}
                    onChange={e => setNoImpactReport(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-black text-slate-900">Não pretendo Relatório de Impacto</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      O donativo fica registado e disponível para validação pela instituição, sem contratação do serviço de relatório.
                    </span>
                  </span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">Comprovativo do donativo *</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Carregue o comprovativo de transferência, fatura ou documento equivalente. Este documento é obrigatório, ficará disponível na área privada da instituição beneficiária e será usado para validar o donativo.
                </p>
                <label className="flex items-center gap-3 bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 cursor-pointer hover:bg-blue-50 transition">
                  <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">PDF</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">
                      {proofFile ? proofFile.name : 'Carregar comprovativo obrigatório'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {proofFile ? `${(proofFile.size / 1024).toFixed(1)} KB` : 'PDF, JPG ou PNG'}
                    </p>
                  </div>
                  <input type="file" accept={ACCEPTED_DOCUMENT_INPUT} className="hidden" onChange={e => handleProofUpload(e.target.files?.[0])} />
                </label>
                {proofFile && (
                  <button type="button" onClick={() => setProofFile(null)} className="mt-3 text-xs text-red-600 font-semibold">
                    Remover comprovativo
                  </button>
                )}
              </div>

              <label className={`mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${publicDonationAmountConsent ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <input
                  type="checkbox"
                  checked={publicDonationAmountConsent}
                  onChange={e => setPublicDonationAmountConsent(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-black text-slate-900">
                    Autorizo que o valor do donativo seja divulgado publicamente em leidomecenato.pt
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    Esta autorização permite mostrar o valor associado ao mecenas nas Histórias de Impacto e na página pública do projeto. Se não aceitar, o donativo pode ser contabilizado internamente, mas o valor não será apresentado publicamente.
                  </span>
                </span>
              </label>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm">Empresa</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Nome:</span> <strong>{company.name}</strong></p>
                    <p><span className="text-slate-500">NIF:</span> <strong>{company.nif}</strong></p>
                    <p><span className="text-slate-500">Email:</span> <strong>{company.email}</strong></p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm">Instituição</h3>
                  <div className="flex items-center gap-3"><span className="text-2xl">{institution?.logo}</span><strong className="text-sm">{institution?.name}</strong></div>
                </div>
              </div>

              {selectedNeeds.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-slate-700 mb-3 text-sm">Projeto apoiado</h3>
                  <div className="space-y-2">
                    {institution?.needs.filter(n => selectedNeeds.includes(n.id)).map(n => (
                      <div key={n.id} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${esgPillarInfo[n.esgPillar].bg}`}>
                        <span className={`font-bold text-xs px-2 py-0.5 rounded ${esgPillarInfo[n.esgPillar].bg} ${esgPillarInfo[n.esgPillar].text}`}>{n.esgPillar}</span>
                        <span className="text-slate-700">{projectTitle(n)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-slate-800 mb-4">Resumo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Donativo (100% para a instituição):</span><span className="font-bold">€ {amount.toLocaleString('pt-PT')}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t"><span className="text-slate-600">Serviço de Relatório de Impacto do Donativo — {tier.name}:</span><span className="font-bold text-purple-600">{formatCurrency(tier.price)}</span></div>
                  {wantsImpactReport && (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">IVA ({Math.round(VAT_RATE * 100)}%):</span><span className="font-bold text-purple-600">{formatCurrency(reportVat)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Total a pagar pelo relatório:</span><span className="font-black text-purple-800">{formatCurrency(reportTotal)}</span></div>
                    </>
                  )}
                  {donationType === 'dinheiro' && projectCost > 0 && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t"><span className="text-slate-600">Custo total do projeto:</span><span className="font-bold">€ {projectCost.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Cobertura do projeto:</span><span className="font-bold text-blue-600">{((amount / projectCost) * 100).toFixed(1)}%</span></div>
                    </>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t"><span className="text-slate-600">Dedução IRC (140%):</span><span className="font-bold text-green-600">€ {irsDeduction.toLocaleString('pt-PT')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Poupança fiscal (21% IRC):</span><span className="font-bold text-green-600">€ {ircSavings.toFixed(2)}</span></div>
                </div>
              </div>

              {wantsImpactReport && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-purple-800 mb-4">Pagamento</h3>
                <div className="bg-white rounded-xl border border-purple-200 p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Descrição do pagamento</p>
                    <p className="text-sm text-slate-700">{tier.name}</p>
                    <p className="text-xs text-slate-500">Serviço de Relatório de Impacto do Donativo</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-500">Total a pagar</p>
                    <p className="text-3xl font-black text-purple-700">{formatCurrency(reportTotal)}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(tier.price)} + {formatCurrency(reportVat)} IVA</p>
                  </div>
                </div>
                <p className="mb-4 rounded-xl border border-purple-200 bg-white p-3 text-xs text-purple-700">
                  O IVA aplica-se exclusivamente ao serviço de Relatório de Impacto contratado à plataforma. O donativo é realizado diretamente entre a empresa mecenas e a instituição beneficiária.
                </p>
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-black text-slate-800">Dados fiscais do adquirente do relatório</p>
                  <p>{company.name || 'Empresa'} · NIF/NIPC {company.nif || 'por preencher'} · {company.email || 'email por preencher'}</p>
                </div>
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <p className="font-black">Nota fiscal</p>
                  <p>O recibo Stripe confirma apenas o pagamento processado pela Stripe. A fatura-recibo fiscal do serviço será emitida separadamente pelo prestador através do Portal das Finanças, com os dados fiscais da empresa adquirente.</p>
                </div>
                <p className="text-sm text-purple-700 mb-3">Pagamento do relatório:</p>
                <div className="hidden">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`rounded-xl px-3 py-3 text-sm font-bold border-2 transition ${paymentMethod === 'stripe' ? 'border-purple-600 bg-white text-purple-700' : 'border-purple-200 text-purple-500 hover:border-purple-300'}`}
                  >
                    Checkout seguro
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`rounded-xl px-3 py-3 text-sm font-bold border-2 transition ${paymentMethod === 'transfer' ? 'border-purple-600 bg-white text-purple-700' : 'border-purple-200 text-purple-500 hover:border-purple-300'}`}
                  >
                    Transferencia
                  </button>
                </div>
                <div className="hidden">
                  {([
                    { id: 'card', label: 'Cartão' },
                    { id: 'mbway', label: 'MB WAY' },
                    { id: 'transfer', label: 'Transferência' },
                  ] as const).map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`rounded-xl px-3 py-3 text-sm font-bold border-2 transition ${paymentMethod === method.id ? 'border-purple-600 bg-white text-purple-700' : 'border-purple-200 text-purple-500 hover:border-purple-300'}`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'stripe' && (
                  <div className={`rounded-xl border p-4 text-sm ${paymentReady ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                    <p className="font-black mb-1">Checkout seguro Stripe</p>
                    <p>
                      {paymentReady
                        ? 'Ao confirmar, a empresa sera encaminhada para o Checkout Stripe. Os metodos disponiveis, como cartao, MB WAY ou outros, aparecem diretamente na pagina segura da Stripe.'
                        : 'Falta configurar o Payment Link deste pacote no .env.local/Netlify. Depois de configurado, este botao abre o pagamento real no Checkout Stripe.'}
                    </p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome no cartão" className="w-full px-4 py-3 border border-purple-200 rounded-xl" />
                    <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="Número do cartão" className="w-full px-4 py-3 border border-purple-200 rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/AA" className="w-full px-4 py-3 border border-purple-200 rounded-xl" />
                      <input value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVC" className="w-full px-4 py-3 border border-purple-200 rounded-xl" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'mbway' && (
                  <div>
                    <input value={mbwayPhone} onChange={e => setMbwayPhone(e.target.value)} placeholder="Número MB WAY" className="w-full px-4 py-3 border border-purple-200 rounded-xl" />
                    <p className="text-xs text-purple-700 mt-2">A confirmação de pagamento será simulada nesta versão.</p>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="bg-white rounded-xl border border-purple-200 p-4 text-sm text-slate-700 space-y-1">
                    <p><strong>IBAN:</strong> PT50 0000 0000 0000 0000 0000 0</p>
                    <p><strong>Titular:</strong> Lei do Mecenato</p>
                    <p><strong>Referência:</strong> {company.nif || 'NIF da empresa'}-{Date.now().toString().slice(-5)}</p>
                    <p className="text-xs text-purple-700 pt-2">Na versão final, esta opção deverá ficar ligada à reconciliação bancária ou validação manual.</p>
                  </div>
                )}
              </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Nota:</strong> {wantsImpactReport
                    ? <>Após pagamento, o Relatório de Impacto é entregue no prazo de <strong>10 dias úteis</strong> após tanto a empresa como a instituição confirmarem o donativo e colocarem na plataforma o comprovativo de transferência (no caso de ser um donativo financeiro) ou a fatura (quando se tratar de produtos/serviços), juntamente com o respetivo recibo emitido pela Instituição recetora ao abrigo da Lei do Mecenato.</>
                    : <>Ao não contratar Relatório de Impacto, o donativo fica apenas registado para validação pela instituição beneficiária, com comprovativo e recibo associados.</>}
                </p>
              </div>

              {!proofFile && (
                <p className="mb-3 text-center text-sm font-semibold text-amber-700">
                  Carregue o comprovativo obrigatório para confirmar o donativo.
                </p>
              )}
              <button onClick={handleConfirm} disabled={processing || !proofFile}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 text-white font-black py-5 rounded-2xl text-lg transition flex items-center justify-center gap-3">
                {processing ? <><span className="animate-spin text-2xl">⏳</span> A processar...</> : <> Confirmar</>}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && !processing && (
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-semibold border border-slate-300 text-slate-600 hover:bg-slate-100 transition">← Anterior</button>
            {step < STEPS.length - 1 && (
              <button onClick={nextStep}
                className={`px-8 py-3 rounded-xl font-bold transition ${canContinue ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                Proximo passo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
