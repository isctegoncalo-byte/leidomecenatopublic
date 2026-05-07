import { ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

interface Props {
  setCurrentView?: (v: ViewType) => void
}

export default function Footer({ setCurrentView }: Props) {
  const brand = useBrand()
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
          </div>
        </div>
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {brand.name} — Iniciativa privada independente.</p>
          <div className="flex space-x-6 text-slate-500 text-sm">
            <button onClick={() => setCurrentView?.('privacidade')} className="hover:text-white transition">Privacidade</button>
            <button onClick={() => setCurrentView?.('termos')} className="hover:text-white transition">Termos de Serviço</button>
            <button onClick={() => setCurrentView?.('cookies')} className="hover:text-white transition">Cookies</button>
            {setCurrentView && (
              <button onClick={() => setCurrentView('admin')} className="hover:text-white transition flex items-center gap-1">
                <span>⚙️</span> <span>Administração</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
