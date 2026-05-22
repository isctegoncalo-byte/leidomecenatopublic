import { DonationProof, NeedItem, ViewType } from '../types'
import { listProofs } from '../utils/proofStore'
import { listProjectInstitutions, projectSlug } from '../utils/projectCatalog'
import { getProjectGallery } from '../utils/projectGalleries'
import { projectSecured, projectTarget } from '../utils/projectFunding'
import SdgIcon from './SdgIcon'

interface Props {
  setCurrentView: (v: ViewType) => void
}

type StoryProject = {
  id: string
  proof: DonationProof
  institutionId: string
  institutionName: string
  institutionCategory: string
  project: NeedItem
  title: string
  description: string
  target: number
  secured: number
  gallery: string[]
  slug: string
}

function findProjectForProof(proof: DonationProof): StoryProject | null {
  const institutions = listProjectInstitutions()
  const institution = institutions.find(item => item.name === proof.institutionName)
  if (!institution) return null

  const selectedProject = proof.selectedNeedIds?.length
    ? institution.needs.find(project => proof.selectedNeedIds?.includes(project.id))
    : undefined
  const project = selectedProject || institution.needs[0]
  if (!project) return null

  const target = projectTarget(project) || proof.projectCost || proof.amount
  const secured = projectSecured(project, [proof], institution.name) || proof.confirmedAmount || proof.amount
  const title = project.projectName || `${project.category} - ${project.subcategory}`

  return {
    id: `${proof.id}-${project.id}`,
    proof,
    institutionId: institution.id,
    institutionName: institution.name,
    institutionCategory: institution.category,
    project,
    title,
    description: project.executiveSummary || project.description,
    target,
    secured,
    gallery: getProjectGallery(project, institution),
    slug: projectSlug(institution, project),
  }
}

function formatCurrency(value: number) {
  return `€ ${value.toLocaleString('pt-PT')}`
}

function publicDonationValue(proof: DonationProof) {
  return proof.publicDonationAmountConsent ? formatCurrency(proof.confirmedAmount || proof.amount) : 'Valor não divulgado'
}

function formatDate(value?: string) {
  if (!value) return 'Data a confirmar'
  return new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ImpactStoriesPage({ setCurrentView }: Props) {
  const proofs = listProofs()
  const confirmedProofs = proofs
    .filter(proof => proof.status === 'confirmed')
    .sort((a, b) => String(b.confirmedAt || b.date).localeCompare(String(a.confirmedAt || a.date)))
  const stories = confirmedProofs.map(findProjectForProof).filter(Boolean) as StoryProject[]

  const donationCount = confirmedProofs.length
  const donatedValue = confirmedProofs
    .filter(proof => proof.publicDonationAmountConsent)
    .reduce((sum, proof) => sum + (proof.confirmedAmount || proof.amount || 0), 0)
  const supportedInstitutions = new Set(confirmedProofs.map(proof => proof.institutionName)).size
  const supportedProjects = new Set(stories.map(story => story.project.id)).size
  const beneficiaries = stories.reduce((sum, story) => sum + (story.project.beneficiaries || 0), 0)
  const gallery = stories.flatMap(story =>
    story.gallery.slice(0, 3).map((photo, index) => ({
      id: `${story.id}-${index}`,
      photo,
      title: story.title,
      institution: story.institutionName,
      donation: publicDonationValue(story.proof),
    }))
  ).slice(0, 9)

  const openProject = (slug: string) => {
    window.history.pushState({}, '', `/projeto/${slug}`)
    setCurrentView('projeto')
  }

  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.25),transparent_34%),radial-gradient(circle_at_78%_22%,rgba(245,158,11,0.18),transparent_28%)]" />
          {gallery[0] && (
            <img src={gallery[0].photo} alt="" className="h-full w-full object-cover opacity-20 mix-blend-screen" />
          )}
        </div>
        <div className="relative container mx-auto max-w-6xl px-4 py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Histórias de Impacto</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Donativos concluídos, resultados visíveis e histórias prontas a inspirar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Esta página reúne apoios já validados entre empresas e instituições, com resumo do donativo,
              projeto apoiado, ODS associados e evidências visuais que ajudam a contar o impacto gerado.
            </p>
          </div>
        </div>
      </section>

      <section className="-mt-10 relative z-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-3 rounded-2xl border border-white/70 bg-white p-4 shadow-xl md:grid-cols-5">
            <ImpactMetric label="Donativos concluídos" value={donationCount || '—'} tone="text-blue-700" />
            <ImpactMetric label="Valor confirmado" value={donatedValue ? formatCurrency(donatedValue) : '—'} tone="text-emerald-700" />
            <ImpactMetric label="Instituições apoiadas" value={supportedInstitutions || '—'} tone="text-purple-700" />
            <ImpactMetric label="Projetos apoiados" value={supportedProjects || '—'} tone="text-amber-700" />
            <ImpactMetric label="Beneficiários diretos" value={beneficiaries ? beneficiaries.toLocaleString('pt-PT') : '—'} tone="text-rose-700" />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Resumo dos apoios</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Donativos concluídos</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Cada cartão resume uma validação concluída: empresa mecenas, instituição beneficiária,
              valor confirmado, data, ODS e projeto associado.
            </p>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-xl font-black text-slate-900">Ainda não existem histórias publicadas.</h3>
              <p className="mt-2 text-slate-500">Quando um donativo for confirmado por ambas as partes, aparece aqui automaticamente.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {stories.map(story => {
                const coverage = story.target > 0 ? Math.min(100, Math.round((story.secured / story.target) * 100)) : 100
                return (
                  <article key={story.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-64">
                      <img src={story.gallery[0]} alt={story.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-200">Donativo concluído</p>
                        <h3 className="mt-2 text-2xl font-black leading-tight">{story.title}</h3>
                        <p className="mt-1 text-sm text-slate-200">{story.institutionName}</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StoryStat label="Valor" value={publicDonationValue(story.proof)} />
                        <StoryStat label="Validação" value={formatDate(story.proof.confirmedAt || story.proof.date)} />
                        <StoryStat label="Cobertura" value={`${coverage}%`} />
                        <StoryStat label="Beneficiários" value={(story.project.beneficiaries || 0).toLocaleString('pt-PT')} />
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {story.project.sdgGoals.map(sdg => (
                          <SdgIcon key={sdg} n={sdg} size="sm" />
                        ))}
                      </div>
                      <p className="line-clamp-4 text-sm leading-6 text-slate-600">{story.description}</p>
                      {story.proof.institutionThankYouMessage && (
                        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Mensagem da instituição</p>
                          <p className="mt-2 text-sm leading-6 text-emerald-900">{story.proof.institutionThankYouMessage}</p>
                        </div>
                      )}
                      <button
                        onClick={() => openProject(story.slug)}
                        className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        Ver página do projeto
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="text-sm font-black uppercase tracking-wide text-blue-700">Galeria de impacto</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Imagens dos projetos apoiados</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                As fotografias carregadas ou associadas aos projetos passam para esta área quando os donativos são concluídos.
              </p>
            </div>
            <div className="grid auto-rows-[210px] gap-4 md:grid-cols-4">
              {gallery.map((item, index) => (
                <figure
                  key={item.id}
                  className={`group relative overflow-hidden rounded-2xl bg-slate-200 shadow-sm ${index === 0 || index === 5 ? 'md:col-span-2 md:row-span-2' : ''}`}
                >
                  <img src={item.photo} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 text-white">
                    <p className="text-sm font-black leading-tight">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-200">{item.institution} · {item.donation}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-950 py-16 text-white">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black md:text-4xl">A próxima história pode nascer do seu apoio.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Escolha um projeto, registe o donativo e acompanhe a validação até ao relatório de impacto.
          </p>
          <button
            onClick={() => setCurrentView('empresa')}
            className="mt-8 rounded-xl bg-emerald-500 px-8 py-4 font-black text-slate-950 transition hover:bg-emerald-400"
          >
            Encontrar projeto para apoiar
          </button>
        </div>
      </section>
    </div>
  )
}

function ImpactMetric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}
