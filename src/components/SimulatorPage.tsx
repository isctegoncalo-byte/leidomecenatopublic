import { useState } from 'react'
import { REPORT_TIERS, ViewType, VAT_RATE, calculateTotalWithVat, calculateVat, formatCurrency } from '../types'

type SimMode = 'dinheiro' | 'produtos'

interface Props {
  setCurrentView?: (view: ViewType) => void
}

export default function SimulatorPage({ setCurrentView }: Props) {
  const [mode, setMode] = useState<SimMode>('dinheiro')
  const [amount, setAmount] = useState(10000)
  const [irc, setIrc] = useState(21)
  const [tierId, setTierId] = useState('premium')

  const tier = REPORT_TIERS.find(t => t.id === tierId)!
  const tierVat = calculateVat(tier.price)
  const tierTotal = calculateTotalWithVat(tier.price)
  const deduction = amount * 1.4
  const ircSavings = deduction * (irc / 100)
  const realCost = amount - ircSavings
  const startDonation = () => {
    localStorage.setItem('leidomecenato_simulator_seed', JSON.stringify({ donationType: mode, amount }))
    setCurrentView?.('empresa')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Simulador de Donativos</h1>
          <p className="text-slate-500 text-lg">O donativo vai 100% para a instituição. Simule os benefícios.</p>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-10">
          <button
            onClick={() => setMode('dinheiro')}
            className={`p-5 rounded-2xl border-2 text-center transition ${
              mode === 'dinheiro'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`font-bold text-sm ${mode === 'dinheiro' ? 'text-blue-700' : 'text-slate-600'}`}>Donativo financeiro</span>
          </button>
          <button
            onClick={() => setMode('produtos')}
            className={`p-5 rounded-2xl border-2 text-center transition ${
              mode === 'produtos'
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className={`font-bold text-sm ${mode === 'produtos' ? 'text-green-700' : 'text-slate-600'}`}>Produtos ou Serviços</span>
          </button>
        </div>

        {/* ─── MODO FINANCEIRO ─── */}
        {mode === 'dinheiro' && (
          <>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="font-bold text-slate-800 mb-6">Configurar</h2>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-semibold text-slate-600">Valor do Donativo</label>
                      <span className="text-xl font-black text-blue-700">€ {amount.toLocaleString('pt-PT')}</span>
                    </div>
                    <input type="range" min={500} max={200000} step={500} value={amount} onChange={e => setAmount(+e.target.value)} className="w-full accent-blue-600" />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[1000, 5000, 10000, 50000].map(v => (
                        <button key={v} onClick={() => setAmount(v)} className={`text-xs py-1 rounded-lg border transition font-medium ${amount === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}>€ {v.toLocaleString()}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-semibold text-slate-600">Taxa de IRC</label>
                      <span className="font-bold">{irc}%</span>
                    </div>
                    <input type="range" min={17} max={25} step={1} value={irc} onChange={e => setIrc(+e.target.value)} className="w-full accent-purple-600" />
                    <div className="flex justify-between text-xs text-slate-400 mt-1"><span>17% PME</span><span>21% Normal</span><span>25% Grande</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Serviço de Relatório de Impacto</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {REPORT_TIERS.map(t => {
                      const colors: Record<string, string> = { slate: 'border-slate-300', blue: 'border-blue-500 ring-1 ring-blue-200', purple: 'border-purple-300' }
                      return (
                        <button key={t.id} onClick={() => setTierId(t.id)}
                          className={`rounded-xl border-2 p-3 text-left transition relative ${tierId === t.id ? colors[t.color] : 'border-slate-200 hover:border-slate-300'}`}>
                          {t.highlighted && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">Popular</div>}
                          <p className="font-bold text-xs leading-tight">{t.name}</p>
                          <p className="text-lg font-black mt-1">{formatCurrency(t.price)}</p>
                          <p className="text-xs text-slate-400">+ IVA {Math.round(VAT_RATE * 100)}%</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-5">Resumo</h3>
                  <div className="bg-green-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">Para a instituição</p>
                    <p className="text-3xl font-black text-green-700">€ {amount.toLocaleString('pt-PT')}</p>
                    <p className="text-xs text-green-600 mt-1">100% do donativo — a plataforma não retém nada</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Benefício fiscal (IRC {irc}%)</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-slate-600">Dedução no IRC (140%)</p>
                        <p className="text-xl font-black text-blue-700">€ {deduction.toLocaleString('pt-PT')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Poupança fiscal</p>
                        <p className="text-xl font-black text-green-600">€ {ircSavings.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-700">Custo real do donativo</p>
                      <p className="text-2xl font-black text-blue-800">€ {realCost.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Relatório de Impacto ESG</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">{tier.name}</p>
                      <p className="text-xl font-black text-purple-700">{formatCurrency(tierTotal)}</p>
                    </div>
                    <p className="mt-2 text-xs text-purple-700">Base {formatCurrency(tier.price)} + IVA {formatCurrency(tierVat)}</p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-2xl border border-purple-200 p-5">
                  <h3 className="font-bold text-purple-800 mb-3">O que inclui — {tier.name}</h3>
                  <ul className="space-y-1.5">
                    {tier.features.map(f => (
                      <li key={f} className="text-sm text-purple-700">{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Comparison table */}
            <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Comparação por Taxa de IRC (donativo de € {amount.toLocaleString()})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Perfil', 'IRC', 'Deduz 140%', 'Poupança', 'Custo Real', 'Instituição', 'Relatório', 'Total'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[{ l:'PME', i:17 },{ l:'Média', i:21 },{ l:'Grande', i:25 }].map((s, idx) => {
                      const d = amount * 1.4
                      const sav = d * (s.i / 100)
                      const rc = amount - sav
                      return (
                        <tr key={s.l} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-6 py-4 font-semibold text-slate-800">{s.l}</td>
                          <td className="px-6 py-4">{s.i}%</td>
                          <td className="px-6 py-4 text-green-600 font-semibold">€ {d.toLocaleString('pt-PT')}</td>
                          <td className="px-6 py-4 text-green-700 font-bold">€ {sav.toFixed(0)}</td>
                          <td className="px-6 py-4 text-blue-700 font-black">€ {rc.toFixed(0)}</td>
                          <td className="px-6 py-4 text-green-600 font-bold">€ {amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-purple-600">{formatCurrency(tierTotal)}</td>
                          <td className="px-6 py-4 font-black text-slate-800">€ {(rc + tierTotal).toFixed(0)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ─── MODO PRODUTOS / SERVIÇOS ─── */}
        {mode === 'produtos' && (
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Intro */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-800 font-bold">
                Os donativos em produtos ou serviços são igualmente elegíveis para dedução de 140% no IRC.
                O valor tributável é o valor de mercado do bem ou serviço doado.
              </p>
            </div>

            {/* Caso de exemplo */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white">
                <p className="text-xs uppercase tracking-widest text-green-200 font-bold mb-2">Exemplo Prático</p>
                <h2 className="text-3xl font-black mb-2">A empresa de mobiliário que transformou uma sala de aula</h2>
                <p className="text-green-100">Um caso real de como um donativo em produtos gerou impacto mensurável e benefício fiscal.</p>
              </div>

              <div className="p-8">
                {/* Timeline */}
                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">1</div>
                      <div className="flex-1 w-0.5 bg-green-200 mt-2" />
                    </div>
                    <div className="pb-6">
                      <h3 className="font-bold text-slate-800 mb-2">A Necessidade</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        A <strong>Associação Crescer Juntos</strong>, uma IPSS de apoio a crianças vulneráveis em Setúbal,
                        publicou na plataforma uma necessidade urgente: <em>"Mobiliário escolar para equipar uma sala de estudo
                        para 30 crianças — mesas, cadeiras, estantes e quadro"</em>.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">ODS 4 — Educação</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Urgência Alta</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">2</div>
                      <div className="flex-1 w-0.5 bg-green-200 mt-2" />
                    </div>
                    <div className="pb-6">
                      <h3 className="font-bold text-slate-800 mb-2">O Donativo em Produtos</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        A <strong>MobiliPro, Lda.</strong>, fabricante de mobiliário escolar, identificou esta necessidade
                        na plataforma e decidiu doar diretamente à associação: <em>30 mesas individuais, 30 cadeiras ergonómicas,
                        4 estantes e 1 quadro branco magnético</em>.
                      </p>
                      <div className="mt-3 bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Valor de mercado dos produtos:</span>
                          <span className="font-black text-slate-800">€ 4.800</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Os produtos foram entregues diretamente na sede da associação.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">3</div>
                      <div className="flex-1 w-0.5 bg-green-200 mt-2" />
                    </div>
                    <div className="pb-6">
                      <h3 className="font-bold text-slate-800 mb-2">Benefício Fiscal para a Empresa</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">
                        Como o donativo em produtos é elegível ao abrigo da Lei do Mecenato,
                        a MobiliPro pode deduzir 140% do valor no IRC.
                      </p>
                      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Valor do donativo (produtos):</span>
                          <span className="font-bold">€ 4.800</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Dedução no IRC (140%):</span>
                          <span className="font-bold text-blue-700">€ 6.720</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Poupança fiscal (21% IRC):</span>
                          <span className="font-bold text-green-600">€ 1.411</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                          <span className="font-semibold text-slate-700">Custo real do donativo:</span>
                          <span className="font-black text-blue-800">€ 3.389</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Na prática, a MobiliPro doou produtos que valem €4.800 mas o custo real foi apenas €3.389.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">4</div>
                      <div className="flex-1 w-0.5 bg-green-200 mt-2" />
                    </div>
                    <div className="pb-6">
                      <h3 className="font-bold text-slate-800 mb-2">O Impacto na Instituição</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">
                        A sala de estudo foi montada em 3 dias. 30 crianças passaram a ter um espaço digno
                        para estudar depois das aulas, com condições que antes não existiam.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-green-700">30</p>
                          <p className="text-xs text-green-600">crianças beneficiadas</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-green-700">100%</p>
                          <p className="text-xs text-green-600">necessidade coberta</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-black text-green-700">3 dias</p>
                          <p className="text-xs text-green-600">até à entrega</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-black text-purple-700">5</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">O Relatório de Impacto</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">
                        A MobiliPro contratou o Relatório de Impacto (€{REPORT_TIERS.find(t => t.id === 'premium')?.price})
                        e recebeu um PDF de 9 páginas documentando todo o impacto, com métricas de impacto,
                        alinhamento ODS e dados fiscais prontos para o relatório de sustentabilidade da empresa.
                      </p>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-2">O que a empresa ganhou:</p>
                        <ul className="space-y-1.5 text-sm text-purple-700">
                          <li>Poupança fiscal de €1.411</li>
                          <li>Relatório ESG com métricas de impacto</li>
                          <li>Conteúdo para comunicação (site, relatório anual)</li>
                          <li>Responsabilidade social demonstrável e verificável</li>
                          <li>Escoamento de stock com impacto social positivo</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vantagens específicas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Porquê doar em produtos ou serviços?</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { title: 'Escoamento inteligente de stock', desc: 'Transforma inventário parado em impacto social e benefício fiscal.' },
                  { title: 'Match exato com a necessidade', desc: 'O donativo corresponde diretamente ao que a instituição precisa, e o relatório fica mais simples e preciso.' },
                  { title: 'Relatório ESG mais forte', desc: 'Um donativo em géneros com match exato gera um indicador de compatibilidade mais elevado no relatório.' },
                  { title: 'Mesmo benefício fiscal', desc: 'A dedução de 140% no IRC aplica-se ao valor de mercado do bem ou serviço doado.' },
                  { title: 'Relação direta com a instituição', desc: 'A entrega física cria uma ligação real entre a empresa e quem beneficia.' },
                  { title: 'Conteúdo visual autêntico', desc: 'Fotografias reais da entrega e do impacto, ideais para redes sociais e comunicação interna.' },
                ].map(item => (
                  <div key={item.title} className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer (ambos os modos) */}
        <div className="mt-10 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-blue-600">Proximo passo</p>
              <h2 className="text-2xl font-black text-slate-900">Use esta simulação para escolher uma instituição.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Com um donativo de EUR {amount.toLocaleString('pt-PT')}, a dedução fiscal estimada é EUR {deduction.toLocaleString('pt-PT')}
                e a poupanca em IRC pode chegar a EUR {ircSavings.toFixed(0)}. Agora associe o valor a um projeto real e gere prova de impacto.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button onClick={startDonation} className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Encontrar projeto para este valor
              </button>
              <button onClick={() => setCurrentView?.('lei-mecenato')} className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                Ver enquadramento fiscal
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Notas importantes:</strong> Esta simulação é meramente informativa. O donativo é feito diretamente da empresa para a instituição — 
            a plataforma Lei do Mecenato nunca retém qualquer valor do donativo. Não somos um organismo público. 
            Os benefícios fiscais devem ser confirmados com um TOC.
          </p>
        </div>
      </div>
    </div>
  )
}
