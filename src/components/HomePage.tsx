import { useState } from 'react'
import { ViewType, REPORT_TIERS } from '../types'
import PartnersBar from './PartnersBar'
import { sampleInstitutions } from '../data/institutions'
import SdgIcon from './SdgIcon'
import { activeProjects, projectProgress, projectSecured, projectTarget, supportTypeLabel } from '../utils/projectFunding'
import { listProofs } from '../utils/proofStore'
import { projectSlug } from '../utils/projectCatalog'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function HomePage({ setCurrentView }: Props) {
  const [simAmount, setSimAmount] = useState(5000)
  const [selectedTier, setSelectedTier] = useState('premium')
  const [institutionView, setInstitutionView] = useState<'list' | 'profiles'>('profiles')
  const [moneyPage, setMoneyPage] = useState(0)
  const [productPage, setProductPage] = useState(0)
  const [institutionSearch, setInstitutionSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const proofs = listProofs()
  const pageSize = 6

  const tier = REPORT_TIERS.find(t => t.id === selectedTier)!
  const irsDeduction = simAmount * 1.4
  const ircSavings = irsDeduction * 0.21

  const productNeedKeywords = [
    'material', 'equipamento', 'hardware', 'instrumentos', 'ração', 'transporte',
    'veículo', 'carrinha', 'mobiliário', 'computadores', 'tablets', 'drones',
    'sensores', 'software', 'kit', 'kits', 'árvores', 'canis', 'painéis', 'estantes',
  ]

  const isProductOrServiceNeed = (need: typeof sampleInstitutions[number]['needs'][number]) => {
    if (need.supportType === 'produtos') return true
    if (need.supportType === 'dinheiro') return false
    const text = `${need.category} ${need.subcategory} ${need.description} ${need.quantity || ''}`.toLowerCase()
    return productNeedKeywords.some(keyword => text.includes(keyword))
  }

  const sortByName = (items: typeof sampleInstitutions) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'))

  const matchesInstitutionSearch = (inst: typeof sampleInstitutions[number]) => {
    const term = institutionSearch.trim().toLowerCase()
    if (!term) return true
    return `${inst.name} ${inst.legalName} ${inst.category} ${inst.municipality} ${inst.district}`.toLowerCase().includes(term)
  }

  const allDistricts = [...new Set(sampleInstitutions.map(inst => inst.district).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-PT'))
  const matchesDistrict = (inst: typeof sampleInstitutions[number]) =>
    !selectedDistrict || inst.district === selectedDistrict

  const moneyInstitutions = sortByName(sampleInstitutions.filter(inst => matchesInstitutionSearch(inst) && matchesDistrict(inst) && activeProjects(inst.needs, proofs, inst.name).some(need => !isProductOrServiceNeed(need))))
  const productInstitutions = sortByName(sampleInstitutions.filter(inst => matchesInstitutionSearch(inst) && matchesDistrict(inst) && activeProjects(inst.needs, proofs, inst.name).some(isProductOrServiceNeed)))

  const pagedMoney = moneyInstitutions.slice(moneyPage * pageSize, (moneyPage + 1) * pageSize)
  const pagedProduct = productInstitutions.slice(productPage * pageSize, (productPage + 1) * pageSize)

  const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) => {
    const pages = Math.ceil(total / pageSize)
    if (pages <= 1) return null
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-10 h-10 rounded-xl font-bold transition ${
              current === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    )
  }

  const InstitutionMiniCard = ({ inst, mode }: { inst: typeof sampleInstitutions[number]; mode: 'money' | 'product' }) => {
    const needs = inst.needs.filter(need => mode === 'product' ? isProductOrServiceNeed(need) : !isProductOrServiceNeed(need)).slice(0, 1)
    const firstNeed = needs[0]
    const openFirstProject = () => {
      if (!firstNeed) return
      window.history.pushState({}, '', `/projeto/${projectSlug(inst, firstNeed)}`)
      setCurrentView('projeto')
    }
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={openFirstProject}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFirstProject()
          }
        }}
        className="w-full cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-left hover:shadow-md hover:border-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-3xl flex-shrink-0">{inst.logo}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{inst.name}</h3>
              <p className="text-xs text-slate-500">{inst.category} • {inst.municipality}</p>
            </div>
            <span className="text-[10px] font-black text-slate-500 bg-slate-100 rounded-lg px-2 py-1 flex-shrink-0">
              {inst.esgScore.total}/100
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {needs.map(need => (
              <div key={need.id} className="text-xs text-slate-600 flex items-start gap-2">
                <span className={mode === 'product' ? 'text-green-600' : 'text-blue-600'}>{mode === 'product' ? '📦' : '💶'}</span>
                <span className="line-clamp-2">{need.category} › {need.subcategory}</span>
              </div>
            ))}
          </div>
          {firstNeed && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                openFirstProject()
              }}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700"
            >
              Apoiar
            </button>
          )}
        </div>
      </article>
    )
  }

  const InstitutionProfileCard = ({ inst, mode }: { inst: typeof sampleInstitutions[number]; mode: 'money' | 'product' }) => {
    const filteredNeeds = activeProjects(inst.needs, proofs, inst.name).filter(need => mode === 'product' ? isProductOrServiceNeed(need) : !isProductOrServiceNeed(need))
    const topNeeds = filteredNeeds.slice(0, 2)
    const mainNeed = topNeeds[0]
    const ratingLabel = inst.esgScore.total >= 85 ? 'AA+' : inst.esgScore.total >= 75 ? 'AA' : inst.esgScore.total >= 65 ? 'A+' : inst.esgScore.total >= 55 ? 'A' : inst.esgScore.total >= 45 ? 'B+' : 'B'
    const ratingColor = inst.esgScore.total >= 85 ? 'text-green-600' : inst.esgScore.total >= 75 ? 'text-emerald-600' : inst.esgScore.total >= 65 ? 'text-lime-600' : inst.esgScore.total >= 55 ? 'text-yellow-600' : inst.esgScore.total >= 45 ? 'text-orange-600' : 'text-rose-500'
    const openProject = (needId: string) => {
      const need = inst.needs.find(n => n.id === needId)
      if (!need) return
      window.history.pushState({}, '', `/projeto/${projectSlug(inst, need)}`)
      setCurrentView('projeto')
    }

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition group flex flex-col h-full">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center gap-4">
          <span className="text-4xl">{inst.logo}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-lg leading-tight">{inst.name}</h3>
            <p className="text-sm text-slate-300">{inst.municipality} • {inst.category}</p>
          </div>
          {inst.utilidadePublica && (
            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">UP</span>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <p className="text-sm text-slate-500 mb-5 line-clamp-3 italic">"{inst.mission}"</p>

          <div className="mb-5">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">ODS alinhados</p>
            <div className="flex flex-wrap gap-3">
            {inst.esgScore.sdgAlignment.map(sdgNum => (
              <SdgIcon key={sdgNum} n={sdgNum} size="md" className="shadow-md" />
            ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5 mt-auto rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Ambiental {inst.esgScore.environmental}</span>
                <span>Social {inst.esgScore.social}</span>
                <span>Governação {inst.esgScore.governance}</span>
              </div>
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-slate-200">
                <div className="bg-green-500 rounded-l-full" style={{ width: `${inst.esgScore.environmental * 0.35}%` }} />
                <div className="bg-blue-500" style={{ width: `${inst.esgScore.social * 0.45}%` }} />
                <div className="bg-purple-500 rounded-r-full" style={{ width: `${inst.esgScore.governance * 0.20}%` }} />
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className={`text-3xl font-black ${ratingColor}`}>{ratingLabel}</p>
              <p className="text-xs font-bold text-slate-400">{inst.esgScore.total}/100</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {topNeeds.map(nd => {
              const pillarColor = nd.esgPillar === 'E' ? 'bg-green-100 text-green-700' : nd.esgPillar === 'S' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              const urgColor = nd.urgency === 'alta' ? 'text-red-500' : nd.urgency === 'media' ? 'text-yellow-500' : 'text-green-500'
              return (
                <button key={nd.id} onClick={() => openProject(nd.id)} className="flex w-full items-start gap-2 rounded-xl p-1 text-left text-sm transition hover:bg-blue-50">
                  <span className={`px-2 py-1 rounded-lg text-xs font-black flex-shrink-0 ${pillarColor}`}>{nd.esgPillar}</span>
                  <span className="text-slate-700 flex-1 line-clamp-1">{nd.category} › {nd.subcategory}</span>
                  <span className={`flex-shrink-0 ${urgColor}`}>●</span>
                </button>
              )
            })}
            {filteredNeeds.length > 2 && (
              <p className="text-xs text-slate-400 pl-8">+{filteredNeeds.length - 2} mais necessidade{filteredNeeds.length - 2 > 1 ? 's' : ''}</p>
            )}
          </div>

          {mainNeed && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => openProject(mainNeed.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openProject(mainNeed.id)
                }
              }}
              className="mb-5 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Abrir página do projeto ${mainNeed.category} ${mainNeed.subcategory}`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Progresso do projeto</p>
                  <p className="text-sm font-bold text-slate-700">{supportTypeLabel(mainNeed)} pretendida: € {projectTarget(mainNeed).toLocaleString('pt-PT')}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{projectProgress(mainNeed, proofs, inst.name)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${projectProgress(mainNeed, proofs, inst.name)}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                <span>Angariado: € {projectSecured(mainNeed, proofs, inst.name).toLocaleString('pt-PT')}</span>
                <span>Custo total: € {(mainNeed.totalProjectCost || mainNeed.estimatedValue || 0).toLocaleString('pt-PT')}</span>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  openProject(mainNeed.id)
                }}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Apoiar
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-center">
              <p className="text-lg font-black text-blue-700">{inst.peopleReachedPerYear.toLocaleString('pt-PT')}</p>
              <p className="text-[11px] font-bold text-blue-500 leading-tight">benef./ano</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-lg font-black text-emerald-700">{inst.volunteers}</p>
              <p className="text-[11px] font-bold text-emerald-500 leading-tight">voluntários</p>
            </div>
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-3 text-center">
              <p className="text-lg font-black text-purple-700">{inst.fullTimeStaff}</p>
              <p className="text-[11px] font-bold text-purple-500 leading-tight">colaboradores</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ═══════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Plataforma Nacional<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                de Donativos.
              </span>
            </h2>
            <p className="text-xl text-blue-200 mb-4 max-w-3xl mx-auto leading-relaxed">
              Medimos o impacto e automatizamos o <strong className="text-white">Relatório de Impacto ESG do Donativo</strong>.
              O donativo vai <strong className="text-white">100% da empresa para a instituição</strong> — nós quantificamos e reportamos o benefício social gerado.
            </p>
            <p className="text-lg text-blue-300 mb-10 max-w-3xl mx-auto">
              Dedução de <strong className="text-yellow-400">140% em IRC</strong>. Impact Score. Relatórios com alinhamento aos ODS da ONU. Conteúdos prontos para redes sociais.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => setCurrentView('login')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 font-black py-4 px-10 rounded-2xl text-lg transition transform hover:scale-105 shadow-2xl">
                🏢 Sou Empresa
              </button>
              <button onClick={() => setCurrentView('login')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black py-4 px-10 rounded-2xl text-lg transition transform hover:scale-105 shadow-2xl">
                🏛️ Sou Instituição
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. INSTITUIÇÕES + TIPO DE NECESSIDADE
      ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-bold text-green-600 uppercase tracking-wide mb-3">Quem já está na plataforma</p>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Instituições Inscritas</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">As instituições estão organizadas entre quem procura apoio financeiro para projetos e quem precisa de produtos ou serviços específicos.</p>
              <div className="mt-6 inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button onClick={() => setInstitutionView('list')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition ${institutionView === 'list' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                  Listagem de nomes
                </button>
                <button onClick={() => setInstitutionView('profiles')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition ${institutionView === 'profiles' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                  Perfis ESG
                </button>
              </div>
              <div className="mx-auto mt-5 grid max-w-3xl gap-3 md:grid-cols-[1fr_220px]">
                <div>
                  <label className="sr-only" htmlFor="institution-search">Pesquisar instituição</label>
                  <input
                    id="institution-search"
                    value={institutionSearch}
                    onChange={e => {
                      setInstitutionSearch(e.target.value)
                      setMoneyPage(0)
                      setProductPage(0)
                    }}
                    placeholder="Pesquisar instituição por nome, área ou concelho..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="district-filter">Filtrar por distrito</label>
                  <select
                    id="district-filter"
                    value={selectedDistrict}
                    onChange={e => {
                      setSelectedDistrict(e.target.value)
                      setMoneyPage(0)
                      setProductPage(0)
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos os distritos</option>
                    {allDistricts.map(district => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              {/* Dinheiro */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">💶 Instituições a pedir dinheiro</h3>
                    <p className="text-sm text-slate-500">Projetos e causas com custo total definido</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 rounded-full px-3 py-1">{moneyInstitutions.length} instituições</span>
                </div>

                {institutionView === 'list' ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-blue-50 border border-blue-100 rounded-3xl p-5">
                    {pagedMoney.map(inst => <InstitutionMiniCard key={inst.id} inst={inst} mode="money" />)}
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {pagedMoney.map(inst => (
                      <div key={inst.id}>
                        <InstitutionProfileCard inst={inst} mode="money" />
                      </div>
                    ))}
                  </div>
                )}
                <Pagination current={moneyPage} total={moneyInstitutions.length} onChange={setMoneyPage} />
              </div>

              {/* Produtos */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">📦 Instituições a pedir produtos/serviços</h3>
                    <p className="text-sm text-slate-500">Necessidades concretas para satisfação direta</p>
                  </div>
                  <span className="text-xs font-bold bg-green-100 text-green-700 rounded-full px-3 py-1">{productInstitutions.length} instituições</span>
                </div>

                {institutionView === 'list' ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-green-50 border border-green-100 rounded-3xl p-5">
                    {pagedProduct.map(inst => <InstitutionMiniCard key={inst.id} inst={inst} mode="product" />)}
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {pagedProduct.map(inst => (
                      <div key={inst.id}>
                        <InstitutionProfileCard inst={inst} mode="product" />
                      </div>
                    ))}
                  </div>
                )}
                <Pagination current={productPage} total={productInstitutions.length} onChange={setProductPage} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. BARRA DE PARCEIROS (scroll lateral)
      ═══════════════════════════════════════════════ */}
      <PartnersBar />

      {/* ═══════════════════════════════════════════════
          4. COMO FUNCIONA
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Como Funciona</h2>
            <p className="text-slate-500 text-lg max-w-3xl mx-auto">
              O donativo vai sempre, na totalidade, da empresa para a instituição. Nós produzimos o relatório de impacto.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Para Empresas</span>
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: '💶', title: 'Faz o donativo diretamente', desc: 'A empresa doa 100% do valor diretamente à instituição que escolher. Nós nunca tocamos no dinheiro do donativo.' },
                  { step: '2', icon: '📋', title: 'Regista o donativo connosco', desc: 'Indica-nos o valor, a instituição e as necessidades apoiadas. 2 minutos.' },
                  { step: '3', icon: '📊', title: 'Escolhe o tipo de relatório', desc: 'Relatório de Impacto, Premium ou Premium com conteúdos para redes sociais.' },
                  { step: '4', icon: '📬', title: 'Recebe o Relatório de Impacto', desc: 'Impact Score, alinhamento ODS, métricas — pronto para demonstrar o impacto do donativo.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center font-black text-yellow-700">{item.step}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span>{item.icon}</span><h4 className="font-bold text-slate-800">{item.title}</h4></div>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Para Instituições</span>
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: '📝', title: 'Regista o perfil detalhado', desc: 'Completa o perfil com necessidades categorizadas por pilar ESG e ODS. Quanto mais detalhe, melhor o relatório de impacto.' },
                  { step: '2', icon: '🔍', title: 'Torna-se visível para empresas', desc: 'As empresas encontram a sua instituição pelo match entre necessidades e prioridades de responsabilidade social.' },
                  { step: '3', icon: '📡', title: 'A empresa contacta diretamente', desc: 'O donativo acontece fora da plataforma, diretamente entre a empresa e a instituição. A plataforma nunca retém qualquer valor do donativo.' },
                  { step: '4', icon: '📊', title: 'O impacto é medido e reportado', desc: 'Se a empresa contratar o nosso serviço, produzimos o relatório de impacto com base no perfil ESG que registou.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-black text-green-700">{item.step}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span>{item.icon}</span><h4 className="font-bold text-slate-800">{item.title}</h4></div>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. PORQUE FUNCIONA (números)
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">Porque funciona</p>
            <h2 className="text-4xl font-black text-slate-900 mb-4">O donativo que custa menos do que parece</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Com a dedução de 140% no IRC, o custo real de um donativo é muito inferior ao valor entregue à instituição.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { value: '€ 10.000', label: 'Donativo à instituição', sub: '100% entregue diretamente', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { value: '€ 14.000', label: 'Dedução no IRC', sub: '140% do valor doado', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { value: '€ 2.940', label: 'Poupança fiscal', sub: 'com IRC a 21%', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              { value: '€ 7.060', label: 'Custo real', sub: 'para a empresa', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
            ].map(item => (
              <div key={item.label} className={`${item.bg} border ${item.border} rounded-2xl p-5 text-center`}>
                <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                <p className="font-bold text-slate-800 text-sm mt-2">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 max-w-xl mx-auto">
            Exemplo com donativo de €10.000 e taxa de IRC de 21%. A instituição recebe 100%, a empresa poupa €2.940 no IRC
            e a sociedade beneficia de impacto real e medido.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. SERVIÇOS DE RELATÓRIO
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Serviços de Relatório de Impacto</h2>
            <p className="text-slate-500 text-lg">O donativo vai 100% para a instituição. Paga apenas o serviço de relatório que escolher.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {REPORT_TIERS.map(t => {
                const colors: Record<string, string> = {
                  slate: 'border-slate-300 hover:border-slate-400',
                  blue: 'border-blue-500 ring-2 ring-blue-200',
                  purple: 'border-purple-300 hover:border-purple-400',
                }
                return (
                  <div key={t.id} onClick={() => setSelectedTier(t.id)}
                    className={`bg-white rounded-2xl border-2 cursor-pointer transition p-6 relative ${selectedTier === t.id ? colors[t.color] : 'border-slate-200 hover:border-slate-300'}`}>
                    {t.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-0.5 rounded-full text-xs font-bold">Mais Popular</div>
                    )}
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t.name}</h3>
                    <p className="text-3xl font-black text-slate-900 mb-1">€ {t.price.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 mb-4">preço fixo</p>
                    <ul className="space-y-2">
                      {t.features.map(f => (
                        <li key={f} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. RESUMO PARA UM DONATIVO DE X
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Resumo para um donativo de € {simAmount.toLocaleString('pt-PT')}</h2>
              <p className="text-slate-500">Arraste para ver como muda o impacto</p>
            </div>
            <div className="mb-8">
              <input type="range" min={500} max={100000} step={500} value={simAmount} onChange={e => setSimAmount(+e.target.value)} className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>€ 500</span><span>€ 100.000</span></div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Para a Instituição</p>
                  <p className="text-3xl font-black text-green-600">€ {simAmount.toLocaleString('pt-PT')}</p>
                  <p className="text-xs text-green-500 mt-1 font-bold">100% do donativo</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Relatório de Impacto</p>
                  <p className="text-3xl font-black text-purple-600">€ {tier.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">{tier.name}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Dedução IRC (140%)</p>
                  <p className="text-3xl font-black text-blue-600">€ {irsDeduction.toLocaleString('pt-PT')}</p>
                  <p className="text-xs text-green-500 mt-1">Poupança: € {ircSavings.toFixed(0)}</p>
                </div>
              </div>
              <div className="mt-6 text-center p-4 bg-green-100 rounded-xl">
                <p className="text-green-800 font-bold text-sm">✅ O donativo vai 100% para a instituição. Paga apenas € {tier.price.toLocaleString()} pelo relatório de impacto.</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <button onClick={() => setCurrentView('simulador')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition">
                Ver Simulador Completo →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. MODELO WIN-WIN-WIN
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-3">Modelo Win-Win-Win</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Todos ganham.<br />Sem exceção.</h2>
              <p className="text-slate-500 text-lg max-w-3xl mx-auto">
                A Lei do Mecenato cria um ciclo virtuoso: a empresa reduz impostos, a instituição recebe apoio real
                e a sociedade beneficia de impacto mensurável. Não é caridade — é estratégia com propósito.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-200 p-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl mb-4">🏢</div>
                <h3 className="text-xl font-black text-blue-800 mb-3">A Empresa ganha</h3>
                <ul className="space-y-2.5">
                  {[
                    { bold: 'Poupança fiscal real', text: '— dedução de 140% no IRC. Cada 100€ doados custam apenas ~70€.' },
                    { bold: 'Relatório ESG pronto', text: '— com Impact Score, ODS e métricas para o relatório de sustentabilidade.' },
                    { bold: 'Reputação verificável', text: '— impacto documentado com dados, não com promessas.' },
                    { bold: 'Conteúdo para comunicação', text: '— infografias e textos prontos para comunicação interna e institucional.' },
                    { bold: 'Escoamento de stock', text: '— transforma inventário parado em impacto social (donativos em produtos).' },
                  ].map(item => (
                    <li key={item.bold} className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-blue-800">{item.bold}</strong>{item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-200 p-6">
                <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl mb-4">🏛️</div>
                <h3 className="text-xl font-black text-green-800 mb-3">A Instituição ganha</h3>
                <ul className="space-y-2.5">
                  {[
                    { bold: '100% do donativo', text: '— zero intermediação. O dinheiro ou os produtos vão diretamente para a instituição.' },
                    { bold: 'Visibilidade para empresas', text: '— perfil público com necessidades, ODS e impacto, acessível a quem quer doar.' },
                    { bold: 'Necessidades atendidas', text: '— as empresas podem responder exatamente ao que a instituição precisa.' },
                    { bold: 'Comprovativo validado', text: '— confirmação do donativo por ambas as partes, com certificado PDF.' },
                    { bold: 'Sem custos', text: '— o registo e a presença na plataforma são gratuitos para a instituição.' },
                  ].map(item => (
                    <li key={item.bold} className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-green-800">{item.bold}</strong>{item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border border-amber-200 p-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl mb-4">🌍</div>
                <h3 className="text-xl font-black text-amber-800 mb-3">A Sociedade ganha</h3>
                <ul className="space-y-2.5">
                  {[
                    { bold: 'Impacto mensurável', text: '— cada donativo é medido, reportado e alinhado com os ODS da ONU.' },
                    { bold: 'Transparência total', text: '— relatórios públicos, dados verificáveis, validação de ambas as partes.' },
                    { bold: 'Mais donativos', text: '— o incentivo fiscal e a facilidade do processo motivam mais empresas a doar.' },
                    { bold: 'Causas reais financiadas', text: '— educação, saúde, ambiente, cultura — com necessidades concretas atendidas.' },
                    { bold: 'Ciclo virtuoso', text: '— quanto mais empresas doam, mais instituições são apoiadas, mais impacto é gerado.' },
                  ].map(item => (
                    <li key={item.bold} className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-amber-800">{item.bold}</strong>{item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white text-center">
              <h3 className="text-2xl font-black mb-4">O Ciclo Win-Win-Win</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="bg-blue-600 rounded-2xl px-6 py-4 text-center">
                  <p className="text-2xl mb-1">🏢</p>
                  <p className="font-bold text-sm">Empresa doa</p>
                  <p className="text-xs text-blue-200">e poupa no IRC</p>
                </div>
                <span className="text-2xl hidden md:block">→</span>
                <span className="text-2xl md:hidden rotate-90">→</span>
                <div className="bg-green-600 rounded-2xl px-6 py-4 text-center">
                  <p className="text-2xl mb-1">🏛️</p>
                  <p className="font-bold text-sm">Instituição recebe</p>
                  <p className="text-xs text-green-200">100% do donativo</p>
                </div>
                <span className="text-2xl hidden md:block">→</span>
                <span className="text-2xl md:hidden rotate-90">→</span>
                <div className="bg-amber-500 rounded-2xl px-6 py-4 text-center">
                  <p className="text-2xl mb-1">🌍</p>
                  <p className="font-bold text-sm">Sociedade beneficia</p>
                  <p className="text-xs text-amber-200">impacto real e medido</p>
                </div>
                <span className="text-2xl hidden md:block">→</span>
                <span className="text-2xl md:hidden rotate-90">→</span>
                <div className="bg-purple-600 rounded-2xl px-6 py-4 text-center">
                  <p className="text-2xl mb-1">📊</p>
                  <p className="font-bold text-sm">Relatório comprova</p>
                  <p className="text-xs text-purple-200">e o ciclo recomeça</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          10. CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            A empresa poupa.<br />A instituição recebe.<br />A sociedade ganha.
          </h2>
          <p className="text-blue-200 text-lg mb-4 max-w-2xl mx-auto">
            É o único modelo em que todos os envolvidos beneficiam: a empresa reduz o IRC,
            a instituição recebe 100% do apoio e a sociedade ganha impacto real e verificável.
          </p>
          <p className="text-blue-300 text-sm mb-10 max-w-xl mx-auto">
            A plataforma não retém nada do donativo. Não somos um organismo público.
            Somos uma iniciativa privada independente que produz relatórios de impacto.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => setCurrentView('login')} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 px-10 rounded-2xl text-lg transition">
              Juntar-me Agora
            </button>
            <button onClick={() => setCurrentView('simulador')} className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-10 rounded-2xl text-lg transition border border-white/30">
              Simular Benefícios
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
