import { useEffect, useState } from 'react'
import { ViewType } from '../types'

const COOKIE_CONSENT_KEY = 'leidomecenato_cookie_consent_v1'

interface Props {
  setCurrentView: (v: ViewType) => void
}

export default function CookieConsent({ setCurrentView }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_CONSENT_KEY) !== 'accepted')
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 px-4 py-5 md:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
            🍪
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900">Utilização de cookies</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Usamos cookies e armazenamento local necessários para manter a sessão, proteger a área privada,
              guardar preferências e melhorar o funcionamento da plataforma. Ao continuar, aceita a utilização
              destes mecanismos essenciais.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={accept}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Aceitar cookies
              </button>
              <button
                onClick={() => setCurrentView('cookies')}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Ver política de cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
