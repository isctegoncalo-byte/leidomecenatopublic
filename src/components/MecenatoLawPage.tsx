import { ViewType } from '../types'

interface Props {
  setCurrentView: (v: ViewType) => void
}

const ebfIndexUrl = 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/bf_rep/Pages/estatuto-dos-beneficios-fiscais-indice.aspx'
const article62Url = 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/bf_rep/Pages/ebf-artigo-62-ordm-.aspx'

export default function MecenatoLawPage({ setCurrentView }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-300 mb-3">Resumo legal</p>
          <h1 className="text-4xl md:text-5xl font-black mb-5">Lei do Mecenato</h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
            O regime fiscal do mecenato está previsto no Capítulo X do Estatuto dos Benefícios Fiscais,
            nos artigos 61.º a 66.º. Em termos simples, permite enquadrar donativos sem contrapartidas
            a entidades elegíveis, com benefícios fiscais para mecenas e obrigações documentais para as entidades beneficiárias.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-5">O essencial, sem juridiquês</h2>
              <div className="space-y-5">
                <InfoBlock
                  title="O que é um donativo"
                  body="Para efeitos fiscais, o donativo é uma entrega em dinheiro ou em espécie, sem contrapartidas comerciais, feita a entidades previstas no regime do mecenato."
                />
                <InfoBlock
                  title="Benefício para empresas"
                  body="No artigo 62.º do EBF, determinados donativos podem ser considerados gastos ou perdas para efeitos de IRC. Em alguns casos, o valor fiscalmente relevante pode ser majorado, por exemplo 140% para fins de caráter social, nos termos e limites legais aplicáveis."
                />
                <InfoBlock
                  title="Entidades beneficiárias"
                  body="O regime abrange várias entidades públicas e privadas sem fins lucrativos, incluindo, em determinados enquadramentos, IPSS, pessoas coletivas de utilidade pública, entidades culturais, científicas, educativas, ambientais, desportivas e outras previstas na lei."
                />
                <InfoBlock
                  title="Obrigações da instituição"
                  body="A entidade beneficiária deve emitir documento comprovativo do donativo, indicar o enquadramento legal, declarar que não há contrapartida e manter registo atualizado dos mecenas e donativos recebidos."
                />
                <InfoBlock
                  title="Validação caso a caso"
                  body="O enquadramento fiscal depende do tipo de entidade, finalidade do donativo, documentação, limites aplicáveis e situação concreta do mecenas. Deve ser validado com contabilista, jurista ou Autoridade Tributária."
                />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="font-black text-blue-900 mb-2">Fonte oficial</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Consulta a redação em vigor no Portal das Finanças.
                </p>
                <div className="space-y-2">
                  <a href={ebfIndexUrl} target="_blank" rel="noreferrer" className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
                    Estatuto dos Benefícios Fiscais
                  </a>
                  <a href={article62Url} target="_blank" rel="noreferrer" className="block rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-100">
                    Artigo 62.º do EBF
                  </a>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-black text-amber-900 mb-2">Nota importante</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Esta página é um resumo informativo. Não substitui aconselhamento fiscal,
                  jurídico ou contabilístico, nem confirma automaticamente a elegibilidade de um donativo.
                </p>
              </div>

              <button onClick={() => setCurrentView('simulador')} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                Simular benefício
              </button>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
      <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{body}</p>
    </div>
  )
}
