import { ViewType } from '../types'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function ImpactRatingPage({ setCurrentView }: Props) {
  const factors = [
    { label: 'Impacto social', weight: '40%', text: 'Beneficiários diretos, relevância social e métrica de impacto indicada pela instituição.' },
    { label: 'Impacto ambiental', weight: '30%', text: 'Contributo ambiental quando o projeto está ligado a ODS ambientais ou redução de externalidades.' },
    { label: 'Governação', weight: '15%', text: 'Qualidade da informação, clareza do projeto, documentação e capacidade de prestação de contas.' },
    { label: 'Cobertura financeira', weight: '15%', text: 'Relação entre o valor confirmado do donativo e o custo total do projeto específico.' },
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
            O rating combina dados ESG do projeto, ODS, beneficiários e a percentagem do custo total do projeto coberta por donativos confirmados.
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
              <p><strong>Rating de Impacto =</strong> Ambiental 30% + Social 40% + Governação 15% + Cobertura financeira 15%.</p>
              <p className="mt-3">
                A cobertura financeira é calculada assim: valor confirmado do donativo dividido pelo custo total do projeto. Se o projeto custa €20.000 e foram confirmados €10.000, a cobertura é 50%.
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
