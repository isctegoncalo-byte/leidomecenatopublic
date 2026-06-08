import { useEffect, useState } from 'react'
import { ViewType } from '../types'
import { getCookieConsent, setCookieConsent } from '../utils/analytics'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function CookieConsent({ setCurrentView }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!getCookieConsent())
  }, [])

  const save = (analytics: boolean) => {
    setCookieConsent(analytics)
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
              e guardar preferencias tecnicas. Com o seu consentimento, usamos tambem Google Analytics 4 para medir
              utilizacao agregada da plataforma, sem enviar emails, NIFs, nomes ou valores de donativos.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Pode aceitar apenas os mecanismos essenciais. Os dados analiticos so sao ativados depois de consentimento
              e sao tratados de acordo com a Politica de Privacidade e o RGPD.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => save(true)}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Aceitar essenciais e analytics
              </button>
              <button
                onClick={() => save(false)}
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
