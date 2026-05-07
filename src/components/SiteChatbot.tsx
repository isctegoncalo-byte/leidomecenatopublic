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

  if (includesAny(text, ['donativo', 'doar', 'apoiar', 'empresa', 'transferencia', 'confirmar'])) {
    return 'Para apoiar um projeto, a empresa escolhe um projeto, clica em Apoiar, inicia sessao como empresa e regista o donativo. O valor doado e confirmado pela empresa e pela instituicao, para atualizar a barra de progresso do projeto.'
  }

  if (includesAny(text, ['instituicao', 'associacao', 'registo', 'criar projeto', 'candidatura', 'documentos'])) {
    return 'As instituicoes podem registar-se e candidatar projetos. Para criar um novo projeto, devem ter os documentos obrigatorios carregados: Comprovativo NIF, Relatorios de Atividades e Contas, Estatutos e Comprovativo IBAN.'
  }

  if (includesAny(text, ['projeto', 'ods', 'kpi', 'meta', 'galeria', 'foto', 'fotos'])) {
    return 'Cada projeto tem uma pagina propria com apresentacao da instituicao, resumo executivo, ODS, metas, KPI, galeria de fotos, contactos e botao Apoiar. Os projetos concluidos passam para a pagina Impacto Real.'
  }

  if (includesAny(text, ['rating', 'impacto', 'calculo', 'avaliacao', 'abrangencia', 'custo total'])) {
    return 'O Rating de Impacto valoriza o custo total do projeto, os KPI previstos, a verba ja assegurada e a area de abrangencia. Pode consultar a explicacao completa na pagina Rating de Impacto.'
  }

  if (includesAny(text, ['lei', 'mecenato', 'beneficio fiscal', 'irc', 'deducao'])) {
    return 'A pagina Lei do Mecenato resume a lei atual e inclui ligacao para a fonte oficial. A plataforma e uma iniciativa privada independente e os beneficios fiscais devem ser confirmados com contabilista certificado.'
  }

  if (includesAny(text, ['login', 'entrar', 'conta', 'password', 'palavra passe', 'recuperar', 'captcha'])) {
    return 'Na pagina Entrar pode iniciar sessao, criar conta e recuperar a palavra-passe. O captcha existe para reduzir registos automaticos e confirmar que o acesso esta a ser feito por uma pessoa.'
  }

  if (includesAny(text, ['admin', 'administracao', 'utilizadores', 'documentos', 'empresa', 'instituicoes'])) {
    return 'No painel de administracao pode consultar utilizadores, separados por empresa e instituicao, e abrir cada utilizador para ver os documentos submetidos.'
  }

  if (includesAny(text, ['contacto', 'contato', 'email', 'fala connosco', 'duvida', 'mensagem'])) {
    return 'Pode contactar a plataforma pelo email geral@leidomecenato.pt ou usar o formulario Fala Connosco no rodape do site.'
  }

  if (includesAny(text, ['cookies', 'privacidade', 'termos', 'dados', 'rgpd'])) {
    return 'As paginas de Cookies, Privacidade e Termos de Servico estao disponiveis no rodape. O aviso de cookies surge no site para recolher aceitacao.'
  }

  return 'So consigo responder a perguntas diretamente ligadas com a plataforma Lei do Mecenato: donativos, projetos, instituicoes, empresas, documentos, rating de impacto, login, contactos e paginas legais.'
}

export default function SiteChatbot({ setCurrentView }: Props) {
  const brand = useBrand()
  const [open, setOpen] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: 'bot',
      text: 'Ola. Sou o assistente da plataforma Lei do Mecenato. Posso ajudar com duvidas sobre donativos, projetos, instituicoes, empresas, documentos, rating de impacto, login e paginas legais.',
    },
  ])
  const nextId = useRef(2)

  const quickActions = useMemo(() => [
    { label: 'Como doar?', question: 'Como posso fazer um donativo?' },
    { label: 'Registar instituicao', question: 'Como uma instituicao pode registar um projeto?' },
    { label: 'Rating de Impacto', question: 'Como e calculado o rating de impacto?' },
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
