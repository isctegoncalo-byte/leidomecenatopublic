import { useState } from 'react'
import { ViewType } from '../types'

interface Props {
  setCurrentView: (v: ViewType) => void
}

interface FaqItem {
  q: string
  a: string
}

interface FaqCategory {
  id: string
  title: string
  icon: string
  items: FaqItem[]
}

const FAQS: FaqCategory[] = [
  {
    id: 'geral',
    title: 'Sobre a Plataforma',
    icon: '🤝',
    items: [
      {
        q: 'O que é a Lei do Mecenato?',
        a: 'É uma plataforma privada e independente que produz Relatórios de Impacto sobre donativos feitos por empresas a instituições, ao abrigo do Estatuto do Mecenato (Lei n.º 16/2001). Não somos um organismo público nem uma entidade certificadora oficial.',
      },
      {
        q: 'A plataforma fica com alguma percentagem do donativo?',
        a: 'Não. O donativo vai 100% da empresa para a instituição. A plataforma cobra apenas o serviço de Relatório de Impacto, com preço fixo. O valor do donativo nunca passa por nós.',
      },
      {
        q: 'A Lei do Mecenato é um organismo público?',
        a: 'Não. Somos uma iniciativa privada independente, sem qualquer vínculo a organismos públicos ou entidades certificadoras oficiais.',
      },
    ],
  },
  {
    id: 'empresas',
    title: 'Para Empresas',
    icon: '🏢',
    items: [
      {
        q: 'Como faço um donativo?',
        a: 'O donativo é feito diretamente da empresa para a instituição que escolher. A plataforma serve para encontrar a instituição certa, registar o donativo e gerar o Relatório de Impacto.',
      },
      {
        q: 'Posso fazer donativos financeiros ou em produtos/serviços?',
        a: 'Sim. No apoio financeiro, o donativo apoia uma causa/projeto com custo total definido pela instituição. Em produtos ou serviços, o donativo corresponde a uma necessidade concreta da instituição.',
      },
      {
        q: 'Que benefício fiscal recebo?',
        a: 'Ao abrigo da Lei do Mecenato, podes deduzir até 140% do valor do donativo no IRC. Por exemplo, num donativo de 10.000€, a base de dedução é de 14.000€ — o que pode representar uma poupança fiscal estimada de cerca de 2.940€.',
      },
      {
        q: 'O que recebo em troca?',
        a: 'Recebes um código único do donativo e, após pagamento do serviço, um Relatório de Impacto em PDF (com 9 páginas: capa, índice, sumário, instituição, scores ESG, alinhamento ODS, necessidades, galeria e dados fiscais). As cores do relatório correspondem ao ODS principal apoiado.',
      },
    ],
  },
  {
    id: 'instituicoes',
    title: 'Para Instituições',
    icon: '🏛️',
    items: [
      {
        q: 'Como me registo como instituição?',
        a: 'No separador "Sou Instituição" preenches um formulário em 5 passos: identidade, missão e impacto, equipa e recursos, necessidades ESG e revisão. Os campos obrigatórios estão marcados com asterisco.',
      },
      {
        q: 'Tenho de pagar para estar na plataforma?',
        a: 'Não. O registo da instituição é gratuito. A instituição fica visível para empresas que procurem causas para apoiar.',
      },
      {
        q: 'O que são as "necessidades ESG"?',
        a: 'São os pedidos concretos da instituição, classificados por pilar ESG (Ambiental, Social, Governação) e alinhados com os 17 Objetivos de Desenvolvimento Sustentável (ODS) da ONU. Quanto mais detalhe, maior o impacto reportado.',
      },
      {
        q: 'O que acontece quando uma empresa apoia a minha instituição?',
        a: 'Receberás o donativo diretamente da empresa. A plataforma gera, à parte, o Relatório de Impacto que demonstra à empresa onde o donativo foi aplicado.',
      },
    ],
  },
  {
    id: 'relatorio',
    title: 'Sobre o Relatório de Impacto',
    icon: '📊',
    items: [
      {
        q: 'Como acedo ao relatório?',
        a: 'Após o donativo é gerado um código único. Esse código é necessário para solicitar o relatório. Sem código validado e sem pagamento do serviço, o relatório não fica disponível.',
      },
      {
        q: 'O que tem o Relatório de Impacto?',
        a: '9 páginas: capa, índice, sumário executivo, ficha da empresa e instituição, decomposição do Impact Score (E+S+G), alinhamento com ODS, necessidades apoiadas, galeria de fotografias e dados fiscais para o IRC.',
      },
      {
        q: 'Porque é que as cores do relatório mudam?',
        a: 'Cada relatório usa as cores oficiais do ODS principal apoiado. Por exemplo, um donativo para uma causa de Educação (ODS 4) usa tons vermelhos, enquanto um para Ação Climática (ODS 13) usa tons verdes.',
      },
      {
        q: 'Quanto custa o relatório?',
        a: 'Há três níveis de serviço com preços fixos: Relatório de Impacto (€150, 6 páginas incluindo capa), Relatório de Impacto Premium (€250, 15 páginas incluindo capa) e Relatório de Impacto Premium + Pack Redes Sociais (€400), que inclui posts para Facebook, Instagram e LinkedIn, mais um ficheiro TXT com o copy de cada rede social.',
      },
    ],
  },
  {
    id: 'fiscal',
    title: 'Aspetos Fiscais e Legais',
    icon: '⚖️',
    items: [
      {
        q: 'O que é o Estatuto do Mecenato?',
        a: 'É o regime fiscal previsto pela Lei n.º 16/2001 e enquadrado no artigo 62.º do Código do IRC, que permite a empresas deduzir donativos a entidades de interesse público.',
      },
      {
        q: 'Os benefícios fiscais simulados são garantidos?',
        a: 'As simulações são meramente informativas. Os benefícios efetivos dependem da situação fiscal específica da empresa. Recomendamos sempre confirmação com um TOC (Técnico Oficial de Contas).',
      },
      {
        q: 'A plataforma emite recibos para efeitos fiscais?',
        a: 'Não. Quem emite a declaração para o IRC é a instituição beneficiária do donativo. A plataforma fornece o Relatório de Impacto, que pode acompanhar a declaração da instituição como documento de suporte.',
      },
    ],
  },
]

export default function FaqPage({ setCurrentView }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggle = (id: string) => setOpenId(prev => (prev === id ? null : id))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-3">FAQ</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Perguntas Frequentes</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Esclarecimentos sobre a Lei do Mecenato, o funcionamento da plataforma e o Relatório de Impacto.
          </p>
        </div>
      </section>

      {/* CATEGORY NAV */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex gap-2 overflow-x-auto py-3">
            {FAQS.map(cat => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-blue-100 text-sm font-semibold text-slate-700 transition whitespace-nowrap"
              >
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          {FAQS.map(cat => (
            <div key={cat.id} id={cat.id} className="scroll-mt-32">
              <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <span className="text-3xl">{cat.icon}</span>
                {cat.title}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item, i) => {
                  const id = `${cat.id}-${i}`
                  const isOpen = openId === id
                  return (
                    <article
                      key={id}
                      className={`bg-white rounded-2xl border ${isOpen ? 'border-blue-300 shadow-md' : 'border-slate-200'} transition`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left"
                      >
                        <span className="font-bold text-slate-800">{item.q}</span>
                        <span className={`text-blue-600 text-xl flex-shrink-0 transition ${isOpen ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                          {item.a}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Não encontraste resposta?</h2>
          <p className="text-blue-200 mb-8">
            A nossa equipa está disponível para esclarecer qualquer dúvida sobre o funcionamento da plataforma.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="mailto:info@leidomecenato.pt"
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 px-8 rounded-2xl transition no-underline"
            >
              📧 Contactar a Equipa
            </a>
            <button
              onClick={() => setCurrentView('home')}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold py-4 px-8 rounded-2xl transition"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
