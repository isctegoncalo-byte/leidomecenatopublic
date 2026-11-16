import { REPORT_TIERS, calculateTotalWithVat, formatCurrency } from '../types'
import { listProjectInstitutions } from '../utils/projectCatalog'
import { getReportPaymentLink } from '../utils/paymentLinks'

interface Props {
  view: 'empresas' | 'instituicoes' | 'relatorios'
  setCurrentView: (view: 'empresa' | 'instituicao' | 'home') => void
}

const primaryButton = 'inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800'

export default function CatalogPages({ view, setCurrentView }: Props) {
  const institutions = listProjectInstitutions()

  if (view === 'empresas') {
    return (
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">Para empresas</p>
          <h1 className="max-w-3xl text-4xl font-black text-slate-950">Apoie projetos sociais com informação clara</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">Explore projetos, simule o enquadramento fiscal e registe um donativo feito diretamente à instituição. A plataforma não recebe nem intermedeia o donativo.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className={primaryButton} onClick={() => setCurrentView('empresa')}>Registar donativo</button>
            <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800" onClick={() => setCurrentView('home')}>Explorar projetos</button>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Escolha informada', 'Consulte as necessidades e os objetivos apresentados pelas instituições.'],
              ['Registo acompanhado', 'Guarde o comprovativo e acompanhe a confirmação do donativo.'],
              ['Relatório opcional', 'Pode contratar um relatório de impacto como serviço separado do donativo.'],
            ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-black text-slate-900">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p></article>)}
          </div>
          {institutions.length === 0 && <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">O catálogo público ainda não tem instituições com projetos publicados.</p>}
        </div>
      </section>
    )
  }

  if (view === 'relatorios') {
    return (
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-purple-700">Serviços opcionais</p>
          <h1 className="text-4xl font-black text-slate-950">Relatórios de impacto</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">Os relatórios são serviços contratados pela empresa. O respetivo pagamento não faz parte do donativo, que é feito diretamente à instituição.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {REPORT_TIERS.map(tier => {
              const configured = Boolean(getReportPaymentLink(tier.id))
              return <article key={tier.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">{tier.name}</h2>
                <p className="mt-4 text-3xl font-black text-slate-950">{formatCurrency(calculateTotalWithVat(tier.price))}<span className="ml-2 text-xs font-semibold text-slate-500">com IVA</span></p>
                <p className="mt-1 text-sm text-slate-500">Base {formatCurrency(tier.price)} + IVA a 6%</p>
                <ul className="my-6 flex-1 list-disc space-y-2 pl-5 text-sm text-slate-600">{tier.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
                <button disabled={!configured} className={`${primaryButton} w-full disabled:cursor-not-allowed disabled:bg-slate-300`} onClick={() => { window.location.href = `/empresa/donativo?reportTier=${encodeURIComponent(tier.id)}` }}>
                  {configured ? 'Continuar para o registo' : 'Pagamento ainda não configurado'}
                </button>
              </article>
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-slate-50 py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">Para instituições</p>
        <h1 className="text-4xl font-black text-slate-950">Instituições e projetos</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">Apresente a missão da sua instituição, publique projetos e acompanhe os donativos e respetiva documentação.</p>
        <button className={`${primaryButton} mt-6`} onClick={() => setCurrentView('instituicao')}>Registar instituição</button>
        {institutions.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-black text-slate-900">Ainda não há perfis públicos disponíveis</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Os perfis e projetos submetidos no browser local não são publicados para outros visitantes. A publicação pública requer persistência central e validação pela administração.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {institutions.map(institution => <article key={institution.id} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black text-slate-900">{institution.name}</h2><p className="mt-1 text-sm text-slate-500">{[institution.category, institution.municipality, institution.district].filter(Boolean).join(' · ')}</p><p className="mt-4 text-sm leading-relaxed text-slate-600">{institution.mission}</p><p className="mt-4 text-sm font-bold text-slate-800">{institution.needs.length} projeto(s)</p></article>)}
          </div>
        )}
      </div>
    </section>
  )
}
