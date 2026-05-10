import { Account, ViewType } from '../types'
import { findProjectEntry } from '../utils/projectCatalog'
import { projectProgress, projectSecured, projectTarget, supportTypeLabel } from '../utils/projectFunding'
import { listProofs } from '../utils/proofStore'
import { findInstitutionRegistration } from '../utils/institutionRegistry'
import { getProjectGallery } from '../utils/projectGalleries'
import { getInstitutionContacts } from '../utils/institutionContacts'
import { calculateProjectImpactRating, impactRatingColorClass, impactRatingLabel, impactRatingMeaning } from '../utils/impactRating'
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
  const gallery = getProjectGallery(project, institution)
  const contacts = getInstitutionContacts(institution, registration)
  const projectRating = calculateProjectImpactRating(institution, project)
  const ratingGrade = impactRatingLabel(projectRating.total)
  const ratingColor = impactRatingColorClass(projectRating.total)
  const ratingFactors = [
    {
      label: 'Abrangencia do projeto',
      value: projectRating.scope,
      weight: '20%',
      detail: project.territorialScope?.national ? 'Nacional' : project.territorialScope?.municipalities?.join(', ') || project.territorialScope?.districts?.join(', ') || project.generalImpactMetrics?.geographicScope || `${institution.municipality}${institution.district ? `, ${institution.district}` : ''}`,
      explanation: 'Mede a escala territorial do projeto: local, municipal, regional, nacional ou internacional.',
    },
    {
      label: 'Beneficiarios diretos',
      value: projectRating.directBeneficiaries,
      weight: '25%',
      detail: `${(project.beneficiaries || institution.peopleReachedPerYear || 0).toLocaleString('pt-PT')} pessoas`,
      explanation: 'Valoriza as pessoas diretamente abrangidas pela intervencao.',
    },
    {
      label: 'Beneficiarios indiretos',
      value: projectRating.indirectBeneficiaries,
      weight: '15%',
      detail: `${(project.generalImpactMetrics?.indirectBeneficiaries || Math.round((project.beneficiaries || institution.peopleReachedPerYear || 0) * 0.35)).toLocaleString('pt-PT')} pessoas estimadas`,
      explanation: 'Considera familias, comunidade ou outras pessoas impactadas indiretamente.',
    },
    {
      label: 'Relevancia social / ODS',
      value: projectRating.socialRelevance,
      weight: '20%',
      detail: project.sdgGoals.length ? project.sdgGoals.map(sdg => `ODS ${sdg}`).join(', ') : project.targetPopulation || 'Dados declarados pela instituição',
      explanation: 'Combina alinhamento com ODS, população-alvo e resposta a necessidades sociais prioritárias.',
    },
    {
      label: 'Sustentabilidade do impacto',
      value: projectRating.sustainability,
      weight: '10%',
      detail: project.continuousProject ? 'Projeto de continuidade' : project.projectStartDate && project.projectEndDate ? `${project.projectStartDate} a ${project.projectEndDate}` : project.implementationPhase === 'a-decorrer' ? 'Projeto a decorrer' : project.implementationPhase === 'inativo' ? 'Projeto inativo' : 'Projeto em candidatura',
      explanation: 'Avalia continuidade, duração, fase de execução e capacidade de acompanhamento.',
    },
    {
      label: 'Evidência e transparência',
      value: projectRating.evidence,
      weight: '10%',
      detail: project.generalImpactMetrics?.evidenceMethod || (institution.verified ? 'Instituição verificada' : 'Dados declarados pela instituição'),
      explanation: 'Valoriza métricas, método de evidência, fotografias/documentos e verificação institucional.',
    },
  ]
  const publicSocialLinks = [
    project.publicSocialLinks ? { label: 'Redes sociais', value: project.publicSocialLinks } : null,
  ].filter(Boolean) as { label: string; value: string }[]
  const socialLinks = [
    { label: 'Site', url: project.publicWebsite || contacts.website },
    { label: 'LinkTree', url: contacts.linktreeUrl },
    { label: 'Facebook', url: contacts.facebookUrl },
    { label: 'Instagram', url: contacts.instagramUrl },
    { label: 'LinkedIn', url: contacts.linkedinUrl },
    { label: 'TikTok', url: contacts.tiktokUrl },
  ].filter(link => !!link.url?.trim())

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
          <p className="text-sm font-black uppercase tracking-wide text-blue-300 mb-3">{institution.category}</p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{title}</h1>
          <p className="text-blue-100 max-w-3xl">{project.executiveSummary || project.description}</p>
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
              <h2 className="text-2xl font-black text-slate-900 mb-4">Contactos</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {(project.publicContacts || contacts.phone) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Contactos</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{project.publicContacts || contacts.phone}</p>
                  </div>
                )}
                {(project.publicEmail || contacts.email) && (
                  <a href={`mailto:${project.publicEmail || contacts.email}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-800">{project.publicEmail || contacts.email}</p>
                  </a>
                )}
                {publicSocialLinks.map(link => (
                  <div key={link.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">{link.label}</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-800">{link.value}</p>
                  </div>
                ))}
                {(project.publicWebsite || contacts.website) && (
                  <a href={project.publicWebsite || contacts.website} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Site</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-800">{project.publicWebsite || contacts.website}</p>
                  </a>
                )}
              </div>
              {socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map(link => (
                    <a
                      key={`contact-${link.label}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-4">Resumo executivo do projeto</h2>
              <p className="text-slate-600 leading-relaxed mb-5">{project.executiveSummary || project.description}</p>
              {project.rationale && <p className="text-slate-600 leading-relaxed mb-5"><strong>Fundamentação:</strong> {project.rationale}</p>}
              {project.objectives && <p className="text-slate-600 leading-relaxed mb-5"><strong>Objetivo(s):</strong> {project.objectives}</p>}
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
            </article>

            {gallery.length > 0 && (
              <article className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-4">Galeria de fotos</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {gallery.map((photo, idx) => (
                    <div key={`${photo}-${idx}`} className={idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                      <img
                        src={photo}
                        alt={`Fotografia ${idx + 1} do projeto ${title}`}
                        className={`w-full rounded-2xl object-cover ${idx === 0 ? 'h-72 md:h-full' : 'h-36'}`}
                      />
                    </div>
                  ))}
                </div>
              </article>
            )}

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

            {account && (project.responsiblePerson || project.donationContactPerson) && (
              <article className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-4">Contactos internos do projeto</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {project.responsiblePerson && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Pessoa responsável pelo projeto</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{project.responsiblePerson}</p>
                    </div>
                  )}
                  {project.donationContactPerson && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Contacto para donativos</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{project.donationContactPerson}</p>
                    </div>
                  )}
                </div>
              </article>
            )}

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Rating de impacto do projeto</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Como foi calculado este rating</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                    Este rating avalia o projeto de 0 a 100 pontos e converte o resultado numa escala de A a F. Não inclui a percentagem doada por uma empresa específica; essa ponderação é aplicada apenas ao rating privado de cada donativo.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                  <p className={`text-5xl font-black ${ratingColor}`}>{ratingGrade}</p>
                  <p className="text-sm font-black text-slate-900">{projectRating.total}/100</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold leading-relaxed text-blue-900">{impactRatingMeaning(projectRating.total)}</p>
              </div>

              <div className="space-y-3">
                {ratingFactors.map(factor => (
                  <div key={factor.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-900">{factor.label}</h3>
                        <p className="text-xs text-slate-500">{factor.explanation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{factor.value}/100</p>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Peso {factor.weight}</p>
                      </div>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${factor.value}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{factor.detail || 'Informação não especificada'}</p>
                  </div>
                ))}
              </div>
            </article>
          </main>

          <aside className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-28">
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Rating do projeto</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-4xl font-black text-slate-900">{projectRating.total}/100</p>
                  <p className={`text-3xl font-black ${ratingColor}`}>{ratingGrade}</p>
                </div>
                <p className="mt-2 text-xs text-blue-700">
                  Calculado sem considerar qualquer donativo especifico.
                </p>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-4">Progresso do financiamento</h2>
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
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
