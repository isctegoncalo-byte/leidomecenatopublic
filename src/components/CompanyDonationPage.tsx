import { useEffect, useState } from 'react'
import { Account, ImpactContract, DonationType, REPORT_TIERS } from '../types'
import { sampleInstitutions } from '../data/institutions'
import { esgPillarInfo, sdgInfo } from '../utils/esgEngine'


interface Props {
  onContractComplete: (contract: ImpactContract) => void
  account?: Account | null
}

const STEPS = ['Tipo de Donativo', 'Escolher Instituição', 'Necessidades Apoiadas', 'Informações para Donativo', 'Confirmar']

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

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{value}</text>
      </svg>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  )
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
  const [proofFile, setProofFile] = useState<{ name: string; dataUrl: string; size: number } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mbway' | 'transfer'>('card')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [mbwayPhone, setMbwayPhone] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [step])

  const institution = sampleInstitutions.find(i => i.id === selectedInstitutionId)
  const tier = REPORT_TIERS.find(t => t.id === selectedTierId)!
  const irsDeduction = amount * 1.4
  const ircSavings = irsDeduction * 0.21

  const toggleNeed = (id: string) => {
    if (donationType === 'dinheiro') {
      setSelectedNeeds(prev => (prev[0] === id ? [] : [id]))
      return
    }
    setSelectedNeeds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
  }

  const categories = [...new Set(sampleInstitutions.map(i => i.category))]
  const filtered = categoryFilter ? sampleInstitutions.filter(i => i.category === categoryFilter) : sampleInstitutions
  const donationDetails = selectedInstitutionId ? institutionDonationDetails[selectedInstitutionId] : null

  const handleConfirm = () => {
    if (paymentMethod === 'card' && (!cardName || !cardNumber || !expiry || !cvc)) {
      alert('Preencha os dados do cartão para pagar o serviço de relatório.')
      return
    }
    if (paymentMethod === 'mbway' && !mbwayPhone) {
      alert('Indique o número MB WAY para pagar o serviço de relatório.')
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
        donationDate: new Date().toLocaleDateString('pt-PT'),
        reportTier: tier,
        reportPrice: tier.price,
        selectedNeedIds: selectedNeeds,
        donationMode: donationType === 'dinheiro' ? 'causa-com-projeto' : 'necessidade-exata',
        projectCost: donationType === 'dinheiro' ? projectCost : undefined,
        proofFileName: proofFile?.name,
        proofFileDataUrl: proofFile?.dataUrl,
        proofFileSize: proofFile?.size,
      }
      setProcessing(false)
      onContractComplete(contract)
    }, 2500)
  }

  const handleProofUpload = (file?: File) => {
    if (!file) return
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
            ✅ O donativo vai <strong>100%</strong> da empresa para a instituição. Pagará apenas o serviço de relatório de impacto.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Pedir Relatório de Impacto do Donativo</h1>
          <p className="text-slate-500 text-sm mb-6">
            Registe o donativo que já fez (ou vai fazer) e contrate um serviço de relatório de impacto.
            <strong> Não processamos donativos.</strong> O valor do donativo é transferido diretamente para a instituição.
          </p>
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'bg-white border-blue-600 text-blue-600' :
                  'bg-white border-slate-300 text-slate-400'
                }`}>{i < step ? '✓' : i + 1}</div>
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
                { type: 'dinheiro' as const, icon: '💶', title: 'Donativo em Dinheiro', desc: 'Transferência bancária feita diretamente à instituição beneficiária.' },
                { type: 'produtos' as const, icon: '📦', title: 'Produtos ou Serviços', desc: 'Doação de bens ou prestação de serviços à instituição.' },
              ] as const).map(opt => (
                <button key={opt.type} onClick={() => { setDonationType(opt.type); setStep(1) }}
                  className="p-8 border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition text-left group">
                  <div className="text-5xl mb-4">{opt.icon}</div>
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
            <p className="text-slate-500 text-sm mb-4">Selecione a instituição que recebeu (ou vai receber) o donativo.</p>
            <div className="flex gap-4 mb-6 flex-wrap">
              <button onClick={() => setCategoryFilter('')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>Todas</button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>{c}</button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map(inst => (
                <div key={inst.id} onClick={() => { setSelectedInstitutionId(inst.id); setSelectedNeeds([]) }}
                  className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition overflow-hidden ${selectedInstitutionId === inst.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
                  <div className="bg-slate-800 px-5 py-4 flex items-center gap-3">
                    <span className="text-3xl">{inst.logo}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm leading-tight truncate">{inst.name}</h3>
                      <p className="text-slate-400 text-xs">{inst.municipality} • {inst.category}</p>
                    </div>
                    {inst.utilidadePublica && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">UP</span>}
                    {inst.verified && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">✓</span>}
                  </div>
                  <div className="p-5">
                    <p className="text-slate-500 text-xs mb-4 line-clamp-2">{inst.description}</p>
                    <div className="flex justify-around mb-4">
                      <ScoreRing value={inst.esgScore.environmental} color="#16a34a" label="E" />
                      <ScoreRing value={inst.esgScore.social} color="#2563eb" label="S" />
                      <ScoreRing value={inst.esgScore.governance} color="#7c3aed" label="G" />
                      <ScoreRing value={inst.esgScore.total} color="#0f172a" label="T" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {inst.esgScore.sdgAlignment.slice(0, 5).map(sdg => (
                        <span key={sdg} title={sdgInfo[sdg]?.name} className="text-xs px-2 py-0.5 rounded-md font-bold text-white" style={{ backgroundColor: sdgInfo[sdg]?.color || '#666' }}>ODS {sdg}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* STEP 2: Needs */}
        {step === 2 && institution && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{institution.logo}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{institution.name}</h2>
                  <p className="text-slate-500 text-sm">{institution.category} • {institution.municipality}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-700 text-sm">
                <strong>
                  {donationType === 'dinheiro'
                    ? '🎯 Selecione a causa/projeto e indique o custo total do projeto.'
                    : '🎯 Selecione a(s) necessidade(s) que o donativo em géneros/serviços correspondeu.'}
                </strong>
                {' '}
                O relatório usa estas informações para calcular o impacto.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {institution.needs.map(need => {
                const pillar = esgPillarInfo[need.esgPillar]
                const isSelected = selectedNeeds.includes(need.id)
                const urgencyColors = { alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-green-100 text-green-700' }
                return (
                  <div key={need.id} onClick={() => toggleNeed(need.id)}
                    className={`bg-white rounded-2xl border-2 cursor-pointer transition p-5 ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pillar.bg} ${pillar.text}`}>{need.esgPillar} — {pillar.label}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${urgencyColors[need.urgency]}`}>{need.urgency === 'alta' ? '🔴' : need.urgency === 'media' ? '🟡' : '🟢'} {need.urgency}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1 text-sm">{need.category} › {need.subcategory}</h4>
                    <p className="text-slate-500 text-xs mb-3">{need.description}</p>
                    <div className="bg-slate-50 rounded-lg p-3 text-xs">
                      <p className="text-slate-500 font-semibold mb-1">Impacto Esperado:</p>
                      <p className="text-slate-700">{need.impactMetric}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Company + Report tier */}
        {step === 3 && (
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
                      <li>✓ Transferir 100% do valor para a instituição</li>
                      <li>✓ Usar a referência indicada</li>
                      <li>✓ Guardar comprovativo da transferência</li>
                      <li>✓ Carregar comprovativo na confirmação</li>
                      <li>✓ Aguardar confirmação da instituição</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">🏢 Dados da Empresa</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nome da Empresa *</label>
                  <input value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">NIF *</label>
                  <input value={company.nif} onChange={e => setCompany({...company, nif: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
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
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Setor de Atividade</label>
                  <input value={company.activity} onChange={e => setCompany({...company, activity: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">💶 Valor do Donativo</h2>
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
                <p className="text-green-800 font-bold">✅ Este valor irá <strong>100%</strong> para a instituição. A plataforma não retém qualquer percentagem do donativo.</p>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">✅ Confirmar</h2>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 text-sm"><strong>✅ O donativo de € {amount.toLocaleString('pt-PT')} irá 100% para a instituição.</strong> Paga apenas € {tier.price.toLocaleString()} pelo serviço de relatório de impacto do donativo.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-700 text-sm"><strong>⚠️ Aviso importante:</strong> A Lei do Mecenato é uma iniciativa privada independente. Não somos um organismo público nem uma entidade certificadora oficial. Não processamos donativos — a empresa faz o donativo diretamente à instituição.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-slate-800 mb-4">📊 Escolha do Serviço de Relatório de Impacto do Donativo</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {REPORT_TIERS.map(t => {
                    const colors: Record<string, string> = { slate: 'border-slate-300', blue: 'border-blue-500 ring-2 ring-blue-100', purple: 'border-purple-300' }
                    return (
                      <div key={t.id} onClick={() => setSelectedTierId(t.id)}
                        className={`rounded-2xl border-2 cursor-pointer p-4 transition relative ${selectedTierId === t.id ? colors[t.color] : 'border-slate-200 hover:border-slate-300'}`}>
                        {t.highlighted && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-bold">Popular</div>}
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <p className="text-xl font-black mt-1">€ {t.price.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">preço fixo</p>
                        <ul className="mt-3 space-y-1">
                          {t.features.slice(0, 4).map(f => (
                            <li key={f} className="text-xs text-slate-600 flex items-start gap-1"><span className="text-green-500">✓</span>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">📎 Comprovativo de transferência (opcional)</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Se já efetuou o donativo, pode anexar aqui o comprovativo de transferência. Este documento ficará disponível na área privada e ajuda a instituição a validar o donativo mais rapidamente.
                </p>
                <label className="flex items-center gap-3 bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 cursor-pointer hover:bg-blue-50 transition">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">
                      {proofFile ? proofFile.name : 'Carregar comprovativo'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {proofFile ? `${(proofFile.size / 1024).toFixed(1)} KB` : 'PDF, JPG ou PNG'}
                    </p>
                  </div>
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => handleProofUpload(e.target.files?.[0])} />
                </label>
                {proofFile && (
                  <button type="button" onClick={() => setProofFile(null)} className="mt-3 text-xs text-red-600 font-semibold">
                    Remover comprovativo
                  </button>
                )}
              </div>

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
                  <h3 className="font-bold text-slate-700 mb-3 text-sm">Necessidades Apoiadas</h3>
                  <div className="space-y-2">
                    {institution?.needs.filter(n => selectedNeeds.includes(n.id)).map(n => (
                      <div key={n.id} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${esgPillarInfo[n.esgPillar].bg}`}>
                        <span className={`font-bold text-xs px-2 py-0.5 rounded ${esgPillarInfo[n.esgPillar].bg} ${esgPillarInfo[n.esgPillar].text}`}>{n.esgPillar}</span>
                        <span className="text-slate-700">{n.category} › {n.subcategory}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-slate-800 mb-4">Resumo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Donativo (100% para a instituição):</span><span className="font-bold">€ {amount.toLocaleString('pt-PT')}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t"><span className="text-slate-600">Serviço de Relatório de Impacto do Donativo — {tier.name}:</span><span className="font-bold text-purple-600">€ {tier.price.toLocaleString()}</span></div>
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

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-purple-800 mb-4">Pagamento</h3>
                <div className="bg-white rounded-xl border border-purple-200 p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Descrição do pagamento</p>
                    <p className="text-sm text-slate-700">{tier.name}</p>
                    <p className="text-xs text-slate-500">Serviço de Relatório de Impacto do Donativo</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-500">Valor a pagar</p>
                    <p className="text-3xl font-black text-purple-700">€ {tier.price.toLocaleString('pt-PT')}</p>
                  </div>
                </div>
                <p className="text-sm text-purple-700 mb-3">Escolha o método de pagamento:</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
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

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Nota:</strong> Após pagamento, o Relatório de Impacto é entregue no prazo de <strong>10 dias úteis</strong> após tanto a empresa como a instituição confirmarem o donativo e colocarem na plataforma o comprovativo de transferência (no caso de ser um donativo em dinheiro) ou a fatura (quando se tratar de produtos/serviços), juntamente com o respetivo recibo emitido pela Instituição recetora ao abrigo da Lei do Mecenato.
                </p>
              </div>

              <button onClick={handleConfirm} disabled={processing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-black py-5 rounded-2xl text-lg transition flex items-center justify-center gap-3">
                {processing ? <><span className="animate-spin text-2xl">⏳</span> A processar...</> : <>✅ Confirmar</>}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step > 0 && !processing && (
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-semibold border border-slate-300 text-slate-600 hover:bg-slate-100 transition">← Anterior</button>
            {step < STEPS.length - 1 && (
              <button onClick={() => { if (step === 1 && !selectedInstitutionId) return alert('Selecione uma instituição'); setStep(s => s + 1) }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition">Próximo →</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
