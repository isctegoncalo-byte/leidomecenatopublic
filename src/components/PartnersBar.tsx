import { useEffect, useState } from 'react'
import { Account } from '../types'
import { listAccountsWithLogoConsent } from '../utils/authStore'
import { useBrand } from '../hooks/useBrand'

export default function PartnersBar() {
  const brand = useBrand()
  const [partners, setPartners] = useState<Account[]>([])

  useEffect(() => {
    setPartners(listAccountsWithLogoConsent().filter(p => p.role === 'empresa'))
  }, [])

  if (partners.length === 0) return null

  return (
    <section className="py-10 bg-white border-b border-slate-100">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          Empresas que já se juntaram à {brand.name}
        </p>
        <div className="relative overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {/* Duplicamos para efeito de scroll infinito */}
            {[...partners, ...partners].map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex-shrink-0 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 min-w-[220px]"
              >
                {p.institutionLogoUrl ? (
                  <img src={p.institutionLogoUrl} alt={p.name} className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-100 p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                    style={{ backgroundColor: p.role === 'empresa' ? '#2563eb' : '#16a34a' }}>
                    {p.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide"> Empresa</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
