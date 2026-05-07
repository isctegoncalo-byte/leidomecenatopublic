import { Account, ViewType } from '../types'
import { findProjectEntry } from '../utils/projectCatalog'
import { projectProgress, projectSecured, projectTarget, supportTypeLabel } from '../utils/projectFunding'
import { listProofs } from '../utils/proofStore'
import { findInstitutionRegistration } from '../utils/institutionRegistry'
import { getProjectGallery } from '../utils/projectGalleries'

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
  const registration = findInstitutionRegistration(institution.name) || findInstitutionRegistration(institution.legalName)
  const target = projectTarget(project)
  const secured = projectSecured(project, proofs, institution.name)
  const progress = projectProgress(project, proofs, institution.name)
  const gallery = getProjectGallery(project, institution)
  const socialLinks = [
    { label: 'Site', url: registration?.website },
    { label: 'LinkTree', url: registration?.linktreeUrl },
    { label: 'Facebook', url: registration?.facebookUrl },
    { label: 'Instagram', url: registration?.instagramUrl },
    { label: 'LinkedIn', url: registration?.linkedinUrl },
    { label: 'TikTok', url: registration?.tiktokUrl },
  ].filter(link => !!link.url?.trim())

  const donate = () => {
    localStorage.setItem('leidomecenato_pending_project', JSON.stringify({
      institutionId: institution.id,
      needId: project.id,
      donationType: project.supportType || 'dinheiro',
      amount: target || project.totalProjectCost || 5000,
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
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{project.category}: {project.subcategory}</h1>
          <p className="text-blue-100 max-w-3xl">{project.description}</p>
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
              <h2 className="text-2xl font-black text-slate-900 mb-4">Resumo executivo do projeto</h2>
              <p className="text-slate-600 leading-relaxed mb-5">{project.description}</p>
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
                  <p className="text-lg font-black text-slate-900">{project.implementationPhase === 'a-decorrer' ? 'A decorrer' : 'Em candidatura'}</p>
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
                        alt={`Fotografia ${idx + 1} do projeto ${project.category}: ${project.subcategory}`}
                        className={`w-full rounded-2xl object-cover ${idx === 0 ? 'h-72 md:h-full' : 'h-36'}`}
                      />
                    </div>
                  ))}
                </div>
              </article>
            )}

            <article className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-2xl font-black text-slate-900 mb-4">ODS e metas a atingir</h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {project.sdgGoals.map(sdg => <span key={sdg} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">ODS {sdg}</span>)}
              </div>
              <ul className="space-y-3 text-slate-600">
                <li><strong>Métrica principal:</strong> {project.impactMetric}</li>
                {project.beneficiaries ? <li><strong>Beneficiários diretos:</strong> {project.beneficiaries.toLocaleString('pt-PT')}</li> : null}
                {project.quantity ? <li><strong>Quantidade/unidade:</strong> {project.quantity}</li> : null}
                {project.productOrService ? <li><strong>Produto/serviço pretendido:</strong> {project.productOrService}</li> : null}
              </ul>
            </article>
          </main>

          <aside className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-28">
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
