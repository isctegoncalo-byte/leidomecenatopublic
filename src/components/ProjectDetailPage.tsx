import { Account, ViewType } from '../types'
import { findProjectEntry } from '../utils/projectCatalog'
import { isProjectComplete, projectProgress, projectSecured, projectTarget, supportTypeLabel } from '../utils/projectFunding'
import { listProofs } from '../utils/proofStore'
import { findInstitutionRegistration } from '../utils/institutionRegistry'
import { getProjectGallery } from '../utils/projectGalleries'
import { getInstitutionContacts } from '../utils/institutionContacts'
import { ODS_IMPACT_METRICS } from '../data/impactMetrics'
import SdgIcon from './SdgIcon'

interface Props {
  account: Account | null
  setCurrentView: (v: ViewType) => void
}

export default function ProjectDetailPage({ account, setCurrentView }: Props) {
  const slug = decodeURIComponent(window.location.pathname.replace(/^\/projetos?\//, ''))
  const entry = findProjectEntry(slug)
  const proofs = listProofs()

  if (!entry) {
    return (
      <div className="min-h-screen bg-slate-50 py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-3">Projeto não encontrado</h1>
          <p className="text-slate-500 mb-6">O projeto pode ter sido removido ou o endereço pode estar incorreto.</p>
          <button onClick={() => setCurrentView('home')} className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl">Voltar ao início</button>
        </div>
      </div>
    )
  }

  const { institution, project } = entry
  const title = project.projectName || `${project.category}: ${project.subcategory}`
  const registration = findInstitutionRegistration(institution.name) || findInstitutionRegistration(institution.legalName)
  const target = projectTarget(project)
  const secured = projectSecured(project, proofs, institution.name)
  const progress = projectProgress(project, proofs, institution.name)
  const complete = isProjectComplete(project, proofs, institution.name)
  const gallery = getProjectGallery(project, institution)
  const contacts = getInstitutionContacts(institution, registration)
  const socialLinks = [
    { label: 'Site', url: project.publicWebsite || contacts.website },
    { label: 'LinkTree', url: contacts.linktreeUrl },
    { label: 'Facebook', url: contacts.facebookUrl },
    { label: 'Instagram', url: contacts.instagramUrl },
    { label: 'LinkedIn', url: contacts.linkedinUrl },
    { label: 'TikTok', url: contacts.tiktokUrl },
  ].filter(link => !!link.url?.trim())
  const objectiveItems = (project.objectives || '')
    .split(/\n|;|,(?=\s+[a-zA-ZÀ-ÿ])/)
    .map(item => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
  const keyPopulationItems = (project.keyPopulations || []).map(item => item.trim()).filter(Boolean)
  const metricLabel = (sdg: number, key: string) => ODS_IMPACT_METRICS[sdg]?.find(metric => metric.key === key)?.label || key
  const filledOdsKpis = Object.entries(project.odsImpactMetrics || {})
    .map(([sdg, metrics]) => ({
      sdg: Number(sdg),
      items: Object.entries(metrics || {})
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        .map(([key, value]) => ({
          label: metricLabel(Number(sdg), key),
          value,
        })),
    }))
    .filter(group => group.items.length > 0)
  const customKpiItems = (project.customKpis || []).map(item => item.trim()).filter(Boolean)
  const hasProjectKpis = filledOdsKpis.length > 0 || customKpiItems.length > 0
  const statusLabel = project.implementationPhase === 'inativo'
    ? 'Inativo'
    : complete
      ? 'Financiamento concluído'
      : project.implementationPhase === 'a-decorrer'
        ? 'A decorrer'
        : 'Em candidatura'
  const statusClass = project.implementationPhase === 'inativo'
    ? 'bg-slate-100 text-slate-700'
    : complete
      ? 'bg-green-100 text-green-700'
      : project.implementationPhase === 'a-decorrer'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700'
  const projectDates = [
    project.projectStartDate ? `Início: ${new Date(project.projectStartDate).toLocaleDateString('pt-PT')}` : '',
    project.continuousProject ? 'Projeto de continuidade' : project.projectEndDate ? `Fim previsto: ${new Date(project.projectEndDate).toLocaleDateString('pt-PT')}` : '',
  ].filter(Boolean)
  const evidenceMethod = project.generalImpactMetrics?.evidenceMethod || 'comprovativos, recibos e evidências submetidas pelas partes envolvidas'
  const reportingFrequency = project.generalImpactMetrics?.reportingFrequency || 'após validação do donativo e recolha de evidências'

  const donate = () => {
    localStorage.setItem('leidomecenato_pending_project', JSON.stringify({
      institutionId: institution.id,
      needId: project.id,
      donationType: project.supportType || 'dinheiro',
      projectCost: project.totalProjectCost || target || 0,
    }))
    if (account?.role === 'empresa') {
      setCurrentView('empresa')
    } else {
      setCurrentView('login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-200">{institution.category}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{statusLabel}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">{institution.municipality}{institution.district ? `, ${institution.district}` : ''}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">{project.executiveSummary || project.description}</p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <HeroStat label="Instituição" value={institution.name} />
            <HeroStat label="Beneficiários diretos" value={project.beneficiaries ? project.beneficiaries.toLocaleString('pt-PT') : 'A indicar'} />
            <HeroStat label="ODS associados" value={String(project.sdgGoals.length || 0)} />
            <HeroStat label="KPIs publicados" value={String(filledOdsKpis.reduce((sum, group) => sum + group.items.length, customKpiItems.length))} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-6">
            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-4">Apresentação da instituição</h2>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl overflow-hidden">
                  {institution.logo.startsWith('http') || institution.logo.startsWith('data:')
                    ? <img src={institution.logo} alt="" className="h-full w-full object-cover" />
                    : institution.logo}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{institution.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{institution.municipality}{institution.district ? `, ${institution.district}` : ''}</p>
                  <p className="text-slate-600">{institution.description}</p>
                </div>
              </div>
              {socialLinks.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Presença online</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(link => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Plano do projeto</h2>
                  <p className="mt-1 text-sm text-slate-500">Objetivos, população abrangida e informação de execução pública.</p>
                </div>
                <span className={`self-start rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{statusLabel}</span>
              </div>
              {objectiveItems.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Objetivo(s)</h3>
                  <ul className="space-y-2 text-slate-600">
                    {objectiveItems.map(item => (
                      <li key={item} className="flex gap-2 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {keyPopulationItems.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Populações-chave</h3>
                  <ul className="space-y-2 text-slate-600">
                    {keyPopulationItems.map(item => (
                      <li key={item} className="flex gap-2 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase text-blue-700">Apoio pretendido</p>
                  <p className="text-lg font-black text-slate-900">{supportTypeLabel(project)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase text-emerald-700">Custo total</p>
                  <p className="text-lg font-black text-slate-900">€ {(project.totalProjectCost || target).toLocaleString('pt-PT')}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase text-amber-700">Fase</p>
                  <p className="text-lg font-black text-slate-900">{project.implementationPhase === 'a-decorrer' ? 'A decorrer' : project.implementationPhase === 'inativo' ? 'Inativo' : 'Em candidatura'}</p>
                </div>
              </div>
              {(projectDates.length > 0 || project.territorialScope?.districts?.length) && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Calendário e território</h3>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    {projectDates.map(item => <p key={item} className="font-semibold">{item}</p>)}
                    {project.territorialScope?.national && <p className="font-semibold">Âmbito nacional</p>}
                    {project.territorialScope?.districts?.length ? <p><strong>Distrito(s):</strong> {project.territorialScope.districts.join(', ')}</p> : null}
                    {project.territorialScope?.municipalities?.length ? <p><strong>Município(s):</strong> {project.territorialScope.municipalities.join(', ')}</p> : null}
                  </div>
                </div>
              )}
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-4">ODS e metas a atingir</h2>
              <div className="flex flex-wrap gap-3 mb-5">
                {project.sdgGoals.map(sdg => <SdgIcon key={sdg} n={sdg} size="md" />)}
              </div>
              <ul className="space-y-3 text-slate-600">
                {project.targetPopulation ? <li><strong>População-alvo:</strong> {project.targetPopulation === 'Outra' ? project.targetPopulationOther : project.targetPopulation}</li> : null}
                <li><strong>Métrica principal:</strong> {project.impactMetric}</li>
                {project.beneficiaries ? <li><strong>Beneficiários diretos:</strong> {project.beneficiaries.toLocaleString('pt-PT')}</li> : null}
                {project.generalImpactMetrics?.indirectBeneficiaries ? <li><strong>Beneficiários indiretos:</strong> {Number(project.generalImpactMetrics.indirectBeneficiaries).toLocaleString('pt-PT')}</li> : null}
                {project.quantity ? <li><strong>Quantidade/unidade:</strong> {project.quantity}</li> : null}
                {project.productOrService ? <li><strong>Produto/serviço pretendido:</strong> {project.productOrService}</li> : null}
                {project.resultsPresentation ? <li><strong>Apresentação de resultados:</strong> {project.resultsPresentation}</li> : null}
                {project.generalImpactMetrics?.reportingFrequency ? <li><strong>Frequência de resultados:</strong> {project.generalImpactMetrics.reportingFrequency}</li> : null}
              </ul>
            </article>

            {hasProjectKpis && (
              <article className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-4">KPIs do projeto</h2>
                {filledOdsKpis.length > 0 && (
                  <div className="space-y-5">
                    {filledOdsKpis.map(group => (
                      <div key={group.sdg} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <SdgIcon n={group.sdg} size="sm" />
                          <h3 className="font-black text-slate-800">ODS {group.sdg}</h3>
                        </div>
                        <dl className="grid gap-3 md:grid-cols-2">
                          {group.items.map(item => (
                            <div key={`${group.sdg}-${item.label}`} className="rounded-xl bg-white p-3">
                              <dt className="text-xs font-black uppercase tracking-wide text-slate-400">{item.label}</dt>
                              <dd className="mt-1 text-sm font-bold text-slate-800">{String(item.value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
                {customKpiItems.length > 0 && (
                  <div className={filledOdsKpis.length ? 'mt-5' : ''}>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">KPIs adicionais</h3>
                    <ul className="space-y-2 text-slate-600">
                      {customKpiItems.map(item => (
                        <li key={item} className="flex gap-2 leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )}

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-4">Transparência e validação</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <TrustItem
                  title="Comprovativo do donativo"
                  text="A empresa deve submeter comprovativo de transferência, fatura ou documento equivalente na plataforma."
                />
                <TrustItem
                  title="Confirmação pela instituição"
                  text="A instituição confirma o valor recebido antes de o donativo ser considerado validado."
                />
                <TrustItem
                  title="Recibo ou declaração"
                  text="A instituição deve carregar recibo ou declaração de donativo ao abrigo da Lei do Mecenato."
                />
                <TrustItem
                  title="Evidências de impacto"
                  text={`O acompanhamento considera ${evidenceMethod}.`}
                />
              </div>
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
                <strong>Frequência de reporte:</strong> {reportingFrequency}. A plataforma regista o processo, mas o enquadramento fiscal deve ser validado pela empresa com o seu contabilista ou consultor fiscal.
              </div>
            </article>

          </main>

          <aside className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-28">
              {gallery.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-900 mb-3">Galeria de fotos</h2>
                  <div className="grid grid-cols-3 gap-2">
                    <img
                      src={gallery[0]}
                      alt={`Fotografia 1 do projeto ${title}`}
                      className="col-span-3 h-44 w-full rounded-2xl object-cover"
                    />
                    {gallery.slice(1, 4).map((photo, idx) => (
                      <img
                        key={photo}
                        src={photo}
                        alt={`Fotografia ${idx + 2} do projeto ${title}`}
                        className="h-20 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              <h2 className="text-xl font-black text-slate-900 mb-4">Progresso do financiamento</h2>
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Estado público</p>
                <p className="mt-1 font-black text-slate-900">{statusLabel}</p>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-700 mb-2">
                <span>€ {secured.toLocaleString('pt-PT')}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mb-6">Meta: € {target.toLocaleString('pt-PT')}</p>
              <button onClick={donate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl">
                Avançar para donativo
              </button>
              {account?.role !== 'empresa' && <p className="mt-3 text-xs text-slate-500">Será pedido login como empresa antes de avançar.</p>}

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Depois do apoio</h3>
                <ol className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3"><StepNumber n={1} /><span>A empresa submete o comprovativo.</span></li>
                  <li className="flex gap-3"><StepNumber n={2} /><span>A instituição confirma o valor recebido.</span></li>
                  <li className="flex gap-3"><StepNumber n={3} /><span>O recibo é carregado e fica associado ao processo.</span></li>
                  <li className="flex gap-3"><StepNumber n={4} /><span>Os dados ficam prontos para relatório de impacto.</span></li>
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-blue-200">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
    </div>
  )
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">✓</div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">{n}</span>
  )
}
