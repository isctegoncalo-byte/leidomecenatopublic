import { useEffect, useState } from 'react'
import { ViewType } from '../types'
import { getCookieConsent, setCookieConsent } from '../utils/analytics'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function CookieConsent({ setCurrentView }: Props) {
  const [visible, setVisible] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    setVisible(!getCookieConsent())
  }, [])

  const save = (preferences: { analytics: boolean; marketing: boolean }) => {
    setCookieConsent(preferences)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 px-4 py-5 md:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl" />
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900">Utilizacao de cookies</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Usamos cookies e armazenamento local necessarios para manter a sessao, proteger a area privada
              e guardar preferencias tecnicas. Com consentimento, usamos Google Analytics 4 para estatistica agregada
              e Meta Pixel para medir campanhas e conversoes, sem enviar emails, NIFs, nomes, contactos ou valores.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Pode aceitar apenas os mecanismos essenciais. Os dados opcionais so sao ativados depois de consentimento
              e sao tratados de acordo com a Politica de Privacidade e o RGPD.
            </p>
            <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Cookies essenciais para login, seguranca e funcionamento da plataforma</span>
              </label>
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={event => setAnalytics(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Estatistica agregada com Google Analytics 4</span>
              </label>
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={event => setMarketing(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Marketing e conversoes com Meta Pixel</span>
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => save({ analytics: true, marketing: true })}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Aceitar todos
              </button>
              <button
                onClick={() => save({ analytics, marketing })}
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Guardar preferencias
              </button>
              <button
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Apenas essenciais
              </button>
              <button
                onClick={() => setCurrentView('cookies')}
                className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Ver politica de cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
