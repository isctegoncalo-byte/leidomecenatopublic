import { FormEvent, useMemo, useRef, useState } from 'react'
import { ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

interface Props {
  setCurrentView: (view: ViewType) => void
}

interface ChatMessage {
  id: number
  from: 'bot' | 'user'
  text: string
}

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term))

function answerQuestion(question: string): string {
  const text = normalize(question)

  if (includesAny(text, ['quanto', 'simular', 'custa', 'poupo', 'poupanca', 'beneficio', 'deduzir'])) {
    return 'Comece pelo Simulador: indique o valor do donativo e a taxa de IRC. A plataforma estima a dedução fiscal, o custo real e o preço do relatório. Depois pode avançar para escolher um projeto com esse valor.'
  }

  if (includesAny(text, ['sou empresa', 'empresa quer doar', 'primeiro passo', 'por onde comeco'])) {
    return 'Para uma empresa, o caminho recomendado é: simular benefício fiscal, escolher um projeto, fazer o donativo diretamente à instituição, carregar comprovativo e pedir o relatório de impacto.'
  }

  if (includesAny(text, ['sou instituicao', 'tenho projeto', 'preciso de apoio', 'publicar necessidade'])) {
    return 'Para uma instituição, o caminho recomendado é: registar perfil, carregar documentos, publicar necessidades concretas com valor/impacto/ODS e aguardar empresas interessadas.'
  }

  if (includesAny(text, ['donativo', 'doar', 'apoiar', 'empresa', 'transferencia', 'confirmar'])) {
    return 'Para apoiar um projeto, a empresa escolhe um projeto, clica em Apoiar, inicia sessão como empresa e regista o donativo. O valor ou os produtos seguem diretamente para a instituição; a plataforma organiza comprovativos, confirmação e relatório.'
  }

  if (includesAny(text, ['instituicao', 'associacao', 'registo', 'criar projeto', 'candidatura', 'documentos'])) {
    return 'As instituições podem registar-se e candidatar projetos. Para criar um novo projeto, devem ter os documentos obrigatórios carregados: Comprovativo NIF, Relatórios de Atividades e Contas, Estatutos e Comprovativo IBAN.'
  }

  if (includesAny(text, ['projeto', 'ods', 'kpi', 'meta', 'galeria', 'foto', 'fotos'])) {
    return 'Cada projeto tem uma página própria com apresentação da instituição, resumo executivo, ODS, metas, KPI, galeria de fotos, contactos e botão Apoiar. Os projetos concluídos passam para a página Impacto Real.'
  }

  if (includesAny(text, ['impacto', 'calculo', 'avaliacao', 'abrangencia', 'custo total'])) {
    return 'A plataforma apresenta publicamente informação objetiva dos projetos: custo total, verba angariada, ODS, beneficiários, métricas previstas, contactos e estado do financiamento. As avaliações comparativas ficam reservadas à administração.'
  }

  if (includesAny(text, ['lei', 'mecenato', 'beneficio fiscal', 'irc', 'deducao'])) {
    return 'A página Lei do Mecenato resume o Estatuto dos Benefícios Fiscais, o artigo 62.º, exemplos de dedução e documentos recomendados. A plataforma é privada e o enquadramento fiscal deve ser validado com contabilista certificado.'
  }

  if (includesAny(text, ['login', 'entrar', 'conta', 'password', 'palavra passe', 'recuperar', 'captcha'])) {
    return 'Na página Entrar pode iniciar sessão, criar conta e recuperar a palavra-passe. O captcha existe para reduzir registos automáticos e confirmar que o acesso está a ser feito por uma pessoa.'
  }

  if (includesAny(text, ['admin', 'administracao', 'utilizadores', 'documentos', 'empresa', 'instituicoes'])) {
    return 'No painel de administração pode consultar utilizadores, separados por empresa e instituição, e abrir cada utilizador para ver os documentos submetidos.'
  }

  if (includesAny(text, ['contacto', 'contato', 'email', 'fala connosco', 'duvida', 'mensagem'])) {
    return 'Pode contactar a plataforma pelo email geral@leidomecenato.pt ou usar o formulario Fala Connosco no rodape do site.'
  }

  if (includesAny(text, ['cookies', 'privacidade', 'termos', 'dados', 'rgpd'])) {
    return 'As páginas de Privacidade e RGPD, Termos de Serviço e Cookies explicam dados tratados, bases legais, direitos de acesso/retificação/apagamento/oposição/portabilidade, conservação e contacto para pedidos RGPD. Estão disponíveis no rodapé.'
  }

  return 'Só consigo responder a perguntas diretamente ligadas com a plataforma Lei do Mecenato: donativos, projetos, instituições, empresas, documentos, impacto, login, contactos e páginas legais.'
}

export default function SiteChatbot({ setCurrentView }: Props) {
  const brand = useBrand()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: 'bot',
      text: 'Olá. Diga-me se vem como empresa, instituição ou contabilista. Posso ajudar a decidir o próximo passo: simular benefício, escolher projeto, preparar documentos ou perceber a Lei do Mecenato.',
    },
  ])
  const nextId = useRef(2)

  const quickActions = useMemo(() => [
    { label: 'Sou empresa', question: 'Sou empresa, por onde comeco?' },
    { label: 'Simular benefício', question: 'Quanto posso deduzir no IRC?' },
    { label: 'Sou instituição', question: 'Sou instituição e tenho um projeto' },
  ], [])

  const submitQuestion = (question: string) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion) return
    setMessages(current => [
      ...current,
      { id: nextId.current++, from: 'user', text: cleanQuestion },
      { id: nextId.current++, from: 'bot', text: answerQuestion(cleanQuestion) },
    ])
    setInput('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitQuestion(input)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] rounded-full px-5 py-4 text-sm font-black text-slate-950 shadow-2xl transition hover:scale-[1.02]"
        style={{ backgroundColor: brand.accentColor }}
        aria-label="Abrir assistente"
      >
        Assistente
      </button>
    )
  }

  return (
    <aside className="fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="px-4 py-3 text-white" style={{ backgroundColor: brand.primaryColor }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black">Assistente {brand.name}</p>
            <p className="text-xs text-slate-300">Apoio sobre a plataforma</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/20 px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10"
            aria-label="Minimizar assistente"
          >
            _
          </button>
        </div>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                message.from === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => submitQuestion(action.question)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50"
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setCurrentView('simulador')}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50"
          >
            Simulador
          </button>
          <button
            onClick={() => setCurrentView('lei-mecenato')}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50"
          >
            Lei
          </button>
          <button
            onClick={() => setCurrentView('faq')}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50"
          >
            FAQ
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Escreva a sua duvida"
          />
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-black text-slate-950"
            style={{ backgroundColor: brand.accentColor }}
          >
            Enviar
          </button>
        </form>
      </div>
    </aside>
  )
}
