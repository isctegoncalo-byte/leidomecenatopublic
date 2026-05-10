import { FormEvent, useState } from 'react'
import { ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

interface Props {
  setCurrentView?: (v: ViewType) => void
}

export default function Footer({ setCurrentView }: Props) {
  const brand = useBrand()
  const [contactOpen, setContactOpen] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const subject = contactForm.subject.trim() || 'Pedido de contacto'
    const body = [
      'Novo pedido enviado através do formulário Fala Connosco.',
      '',
      `Nome: ${contactForm.name}`,
      `Email: ${contactForm.email}`,
      '',
      'Mensagem:',
      contactForm.message,
    ].join('\n')

    localStorage.setItem('leidomecenato_last_contact_request', JSON.stringify({
      ...contactForm,
      subject,
      createdAt: new Date().toISOString(),
    }))
    window.location.href = `mailto:geral@leidomecenato.pt?subject=${encodeURIComponent(`[Lei do Mecenato] ${subject}`)}&body=${encodeURIComponent(body)}`
    setContactSent(true)
  }

  return (
    <footer className="text-white pt-16 pb-8" style={{ backgroundColor: brand.primaryColor, fontFamily: brand.secondaryFont }}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white rounded-xl p-1.5 shadow-md">
                <img src="/images/logo-leidomecenato-official.svg" alt={brand.name} className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">{brand.name}</h3>
                <p className="text-sm" style={{ color: brand.accentColor }}>{brand.tagline}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {brand.description}
            </p>
            <div className="mt-4 p-3 bg-amber-900/50 border border-amber-800 rounded-lg">
              <p className="text-xs text-amber-300">
                ⚠️ Iniciativa privada independente — não somos um organismo público nem uma entidade certificadora oficial.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Recursos</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition">Estatuto do Mecenato</a></li>
              <li><a href="#" className="hover:text-white transition">Lei n.º 16/2001</a></li>
              <li><a href="#" className="hover:text-white transition">Portal AT – IRC</a></li>
              <li><a href="#" className="hover:text-white transition">ODS – Portugal 2030</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Contacto</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>📧 {brand.contactEmail}</li>
              <li>📞 {brand.contactPhone}</li>
              {brand.website && <li>🌐 {brand.website}</li>}

            </ul>
            <div className="mt-5">
              <p className="font-bold text-white mb-3">Fala Connosco</p>
              <button
                onClick={() => {
                  setContactOpen(true)
                  setContactSent(false)
                }}
                className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Enviar dúvida
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {brand.name} — Iniciativa privada independente.</p>
          <div className="flex space-x-6 text-slate-500 text-sm">
            <button onClick={() => setCurrentView?.('privacidade')} className="hover:text-white transition">Privacidade e RGPD</button>
            <button onClick={() => setCurrentView?.('termos')} className="hover:text-white transition">Termos de Serviço</button>
            <button onClick={() => setCurrentView?.('cookies')} className="hover:text-white transition">Cookies</button>
          </div>
        </div>
      </div>
      {contactOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">Fala Connosco</h3>
                <p className="mt-1 text-sm text-slate-600">A sua mensagem será encaminhada para geral@leidomecenato.pt.</p>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                aria-label="Fechar formulário"
              >
                X
              </button>
            </div>

            {contactSent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                O pedido ficou preparado para envio por email. Confirme o envio na janela do seu programa de email.
              </div>
            ) : null}

            <form onSubmit={handleContactSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Nome
                  <input
                    required
                    value={contactForm.name}
                    onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="O seu nome"
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Email
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="email@exemplo.pt"
                  />
                </label>
              </div>
              <label className="block text-sm font-bold text-slate-700">
                Assunto
                <input
                  value={contactForm.subject}
                  onChange={(event) => setContactForm({ ...contactForm, subject: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Resumo da dúvida"
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Mensagem
                <textarea
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Escreva aqui a sua dúvida"
                />
              </label>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs leading-relaxed text-blue-800">
                  <strong>RGPD:</strong> os dados deste formulario serao usados apenas para responder ao seu pedido.
                  Não inclua dados pessoais sensíveis ou informação de terceiros que não seja necessária.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-5 py-3 text-sm font-bold text-slate-950 shadow-sm"
                  style={{ backgroundColor: brand.accentColor }}
                >
                  Enviar para geral@leidomecenato.pt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  )
}
