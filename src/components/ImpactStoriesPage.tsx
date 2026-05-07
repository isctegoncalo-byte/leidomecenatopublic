import { ViewType } from '../types'
import { listProofs } from '../utils/proofStore'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function ImpactStoriesPage({ setCurrentView }: Props) {
  const proofs = listProofs()
  const donationCount = proofs.length
  const donatedValue = proofs.reduce((sum, p) => sum + (p.amount || 0), 0)
  const supportedInstitutions = new Set(proofs.map(p => p.institutionName)).size
  const producedReports = proofs.filter(p => p.status === 'confirmed').length

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
              <p className="text-2xl md:text-3xl font-black text-green-600">{supportedInstitutions || '—'}</p>
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

      {/* PLACEHOLDER STORIES */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Casos em destaque</h2>
            <p className="text-slate-500">
              Os espaços abaixo mostram onde irão entrar as histórias de empresas e instituições.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article
                key={idx}
                className="bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden flex flex-col"
              >
                <div className="bg-slate-100 h-44 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Imagem do caso</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      ODS —
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      Ano —
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-700 mb-1">Título do caso</h3>
                  <p className="text-sm text-slate-500 mb-4 flex-1">
                    Aqui aparecerá uma síntese do donativo, da instituição apoiada e do impacto gerado.
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <span>Empresa —</span>
                    <span>Instituição —</span>
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
