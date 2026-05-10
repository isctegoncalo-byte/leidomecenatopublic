import { ViewType } from '../types'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function ImpactRatingPage({ setCurrentView }: Props) {
  const factors = [
    { label: 'Abrangencia do projeto', weight: '20%', text: 'Escala territorial do projeto: local, municipal, regional, nacional ou internacional.' },
    { label: 'Beneficiarios diretos', weight: '25%', text: 'Numero de pessoas diretamente apoiadas pelo projeto ou pela necessidade publicada.' },
    { label: 'Beneficiarios indiretos', weight: '15%', text: 'Pessoas, familias ou comunidades afetadas indiretamente pelo resultado do projeto.' },
    { label: 'Relevância social / ODS', weight: '20%', text: 'Alinhamento com ODS, urgência social e resposta a necessidades vulneráveis.' },
    { label: 'Sustentabilidade do impacto', weight: '10%', text: 'Continuidade, duração, capacidade de acompanhamento e efeitos após a execução.' },
    { label: 'Evidência e transparência', weight: '10%', text: 'Materiais de prova, métricas, fotografias, documentos e capacidade de prestar contas.' },
  ]

  const ratings = [
    { label: 'A', range: '90-100', text: 'Excelente', color: 'bg-green-600' },
    { label: 'B', range: '75-89', text: 'Muito forte', color: 'bg-emerald-500' },
    { label: 'C', range: '60-74', text: 'Forte', color: 'bg-lime-500' },
    { label: 'D', range: '45-59', text: 'Moderado', color: 'bg-yellow-500' },
    { label: 'E', range: '30-44', text: 'Inicial', color: 'bg-orange-500' },
    { label: 'F', range: '0-29', text: 'Insuficiente', color: 'bg-rose-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-400 mb-3">Metodologia</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Como é calculado o Rating de Impacto</h1>
          <p className="text-blue-100 text-lg">
            O rating público avalia o projeto de 0 a 100 pontos, sem considerar a percentagem doada por uma empresa específica.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {factors.map(factor => (
              <article key={factor.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-3xl font-black text-blue-700 mb-2">{factor.weight}</p>
                <h2 className="font-black text-slate-900 mb-2">{factor.label}</h2>
                <p className="text-sm text-slate-500">{factor.text}</p>
              </article>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Formula simplificada</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">
              <p>
                <strong>Rating do Projeto =</strong> Abrangência 20% + beneficiários diretos 25% + beneficiários indiretos 15% + relevância social/ODS 20% + sustentabilidade 10% + evidência/transparência 10%.
              </p>
              <p className="mt-3">
                A percentagem da verba doada fica fora deste rating público. Esse fator é aplicado apenas na área de administração, para calcular o rating privado de cada donativo concreto.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-2xl font-black text-slate-900 mb-5">Escala de rating</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {ratings.map(rating => (
                <div key={rating.label} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-center">
                  <div className={`${rating.color} py-3 text-white font-black text-2xl`}>{rating.label}</div>
                  <p className="py-3 text-sm font-bold text-slate-600">{rating.range}</p>
                  <p className="border-t border-slate-100 px-2 py-2 text-xs font-semibold text-slate-500">{rating.text}</p>
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
