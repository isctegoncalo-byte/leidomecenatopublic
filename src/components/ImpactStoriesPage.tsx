import { ViewType } from '../types'
import { listProofs } from '../utils/proofStore'
import { sampleInstitutions } from '../data/institutions'
import { listInstitutionRegistrations } from '../utils/institutionRegistry'
import { completedProjects, projectSecured, projectTarget } from '../utils/projectFunding'
import SdgIcon from './SdgIcon'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function ImpactStoriesPage({ setCurrentView }: Props) {
  const proofs = listProofs()
  const confirmedProofs = proofs.filter(p => p.status === 'confirmed')
  const highlightedProjects = sampleInstitutions
    .flatMap(inst => inst.needs.slice(0, 1).map(item => {
      const target = projectTarget(item)
      const secured = projectSecured(item, confirmedProofs, inst.name)
      return {
        id: `${inst.id}-${item.id}`,
        institution: inst.name,
        title: item.projectName || `${item.category} - ${item.subcategory}`,
        description: item.executiveSummary || item.description,
        amount: secured,
        projectCost: target,
        beneficiaries: item.beneficiaries || inst.peopleReachedPerYear,
        sdgs: item.sdgGoals,
        coverage: target > 0 ? Math.round((secured / target) * 100) : 0,
      }
    }))
    .slice(0, 2)
  const donationCount = confirmedProofs.length
  const donatedValue = confirmedProofs.reduce((sum, p) => sum + (p.confirmedAmount || p.amount || 0), 0)
  const supportedInstitutions = new Set(confirmedProofs.map(p => p.institutionName)).size
  const producedReports = confirmedProofs.length
  const registeredCompletedProjects = listInstitutionRegistrations().flatMap(inst =>
    completedProjects(inst.needs, confirmedProofs, inst.name).map(project => ({
      id: `${inst.nif}-${project.id}`,
      institutionName: inst.name,
      institutionCategory: inst.category,
      title: project.projectName || `${project.category} - ${project.subcategory}`,
      description: project.executiveSummary || project.description,
      sdgGoals: project.sdgGoals,
      secured: projectSecured(project, confirmedProofs, inst.name),
      target: projectTarget(project),
    }))
  )
  const sampleCompletedProjects = sampleInstitutions.flatMap(inst =>
    completedProjects(inst.needs, confirmedProofs, inst.name).map(project => ({
      id: `${inst.id}-${project.id}`,
      institutionName: inst.name,
      institutionCategory: inst.category,
      title: project.projectName || `${project.category} - ${project.subcategory}`,
      description: project.executiveSummary || project.description,
      sdgGoals: project.sdgGoals,
      secured: projectSecured(project, confirmedProofs, inst.name),
      target: projectTarget(project),
    }))
  )
  const completed = [...registeredCompletedProjects, ...sampleCompletedProjects]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-3">Impacto Real</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Onde os donativos se transformam<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">
              em mudança verdadeira.
            </span>
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Histórias reais de empresas que apoiaram instituições através da Lei do Mecenato — 
            com impacto medido, beneficiários identificados e resultados quantificados.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-black text-blue-700">{donationCount || '—'}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Donativos registados</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-emerald-600">{donatedValue ? `€ ${donatedValue.toLocaleString('pt-PT')}` : '—'}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valor doado</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-green-600">{supportedInstitutions || completed.length || '—'}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Instituições apoiadas</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-purple-600">—</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Beneficiários totais</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-amber-600">{producedReports || '—'}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Relatórios produzidos</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLETED PROJECTS */}
      {completed.length > 0 && (
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900 mb-3">Projetos concluídos</h2>
              <p className="text-slate-500">
                Projetos que atingiram 100% da verba pretendida e deixaram de aparecer na página inicial.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completed.map(project => (
                <article key={project.id} className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-wide text-green-100">Projeto concluído</p>
                    <h3 className="mt-1 text-lg font-black leading-tight">{project.title}</h3>
                    <p className="mt-1 text-sm text-green-100">{project.institutionName}</p>
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {project.sdgGoals.map(sdg => (
                        <SdgIcon key={sdg} n={sdg} size="sm" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">{project.description}</p>
                    <div className="mt-5 rounded-2xl bg-green-50 border border-green-100 p-4">
                      <div className="flex justify-between text-sm font-black text-green-800">
                        <span>€ {project.secured.toLocaleString('pt-PT')}</span>
                        <span>100%</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-green-100">
                        <div className="h-full rounded-full bg-green-600" style={{ width: '100%' }} />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-green-700">
                        Meta atingida: € {project.target.toLocaleString('pt-PT')}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HIGHLIGHTED PROJECTS */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Projetos em destaque</h2>
            <p className="text-slate-500">
              Projetos publicados na plataforma com informação pública completa para empresas mecenas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {highlightedProjects.map(item => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-br from-slate-900 to-blue-900 h-44 p-6 text-white flex flex-col justify-between">
                  <div className="flex flex-wrap gap-2">
                    {item.sdgs.map(sdg => (
                      <SdgIcon key={sdg} n={sdg} size="sm" className="ring-2 ring-white/20" />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-200">Projeto publicado</p>
                    <h3 className="text-xl font-black leading-tight">{item.title}</h3>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl bg-blue-50 p-3 text-center">
                      <p className="text-lg font-black text-blue-700">€ {item.amount.toLocaleString('pt-PT')}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-500">Donativo</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-lg font-black text-emerald-700">{item.coverage}%</p>
                      <p className="text-[10px] font-bold uppercase text-slate-500">Cobertura</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <p className="text-lg font-black text-amber-700">{item.beneficiaries.toLocaleString('pt-PT')}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-500">Pessoas</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 flex-1">
                    {item.description}
                  </p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">Resumo do apoio</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Donativo aplicado num projeto com custo total de € {item.projectCost.toLocaleString('pt-PT')} e cobertura de {item.coverage}%.
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>{item.institution}</span>
                    <span>Projeto ativo</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black mb-4">A sua empresa pode estar aqui</h2>
          <p className="text-blue-200 mb-8">
            Faça um donativo, peça o relatório de impacto e veja a sua história de sucesso publicada nesta página.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setCurrentView('login')}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 px-8 rounded-2xl transition"
            >
              Registar / Entrar
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
