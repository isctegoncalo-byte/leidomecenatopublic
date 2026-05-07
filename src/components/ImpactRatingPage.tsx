import { ViewType } from '../types'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function ImpactRatingPage({ setCurrentView }: Props) {
  const factors = [
    { label: 'Impacto social e KPI', weight: '32%', text: 'Beneficiários diretos, metas declaradas, métricas de impacto e profundidade dos KPI indicados pela instituição.' },
    { label: 'Impacto ambiental', weight: '25%', text: 'Contributo ambiental quando o projeto está ligado a ODS ambientais ou redução de externalidades.' },
    { label: 'Governação', weight: '13%', text: 'Qualidade da informação, clareza do projeto, documentação e capacidade de prestação de contas.' },
    { label: 'Adequação do projeto', weight: '30%', text: 'Combina cobertura do donativo, custo total, KPI, abrangência geográfica e financiamento já assegurado.' },
  ]

  const ratings = [
    { label: 'AA+', range: '85-100', color: 'bg-green-600' },
    { label: 'AA', range: '75-84', color: 'bg-emerald-500' },
    { label: 'A+', range: '65-74', color: 'bg-lime-500' },
    { label: 'A', range: '55-64', color: 'bg-yellow-500' },
    { label: 'B+', range: '45-54', color: 'bg-orange-500' },
    { label: 'B', range: '0-44', color: 'bg-rose-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-400 mb-3">Metodologia</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Como é calculado o Rating de Impacto</h1>
          <p className="text-blue-100 text-lg">
            O rating combina dados ESG do projeto, ODS, beneficiários, KPI, área de abrangência, custo total do projeto, financiamento já assegurado e donativos confirmados.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {factors.map(factor => (
              <article key={factor.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-3xl font-black text-blue-700 mb-2">{factor.weight}</p>
                <h2 className="font-black text-slate-900 mb-2">{factor.label}</h2>
                <p className="text-sm text-slate-500">{factor.text}</p>
              </article>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Fórmula simplificada</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">
              <p><strong>Rating de Impacto =</strong> Ambiental 25% + Social/KPI 32% + Governação 13% + Adequação do projeto 30%.</p>
              <p className="mt-3">
                A adequação do projeto valoriza cinco sinais: percentagem coberta pelo donativo confirmado, custo total do projeto, força dos KPI/beneficiários, área de abrangência e financiamento já assegurado. Assim, projetos maiores, com métricas mais claras, impacto geográfico mais amplo e parte da verba já garantida, recebem uma avaliação mais forte.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-2xl font-black text-slate-900 mb-5">Escala de rating</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {ratings.map(rating => (
                <div key={rating.label} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-center">
                  <div className={`${rating.color} py-3 text-white font-black text-xl`}>{rating.label}</div>
                  <p className="py-3 text-sm font-bold text-slate-600">{rating.range}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('impacto-real')}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl"
          >
            Voltar ao Impacto Real
          </button>
        </div>
      </section>
    </div>
  )
}
