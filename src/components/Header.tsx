import { Account, ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

interface Props {
  currentView: ViewType
  setCurrentView: (v: ViewType) => void
  session?: Account | null
}

export default function Header({ currentView, setCurrentView, session }: Props) {
  const brand = useBrand()
  const navItems: { label: string; view: ViewType }[] = [
    { label: 'Início', view: 'home' },
    { label: 'Lei do Mecenato', view: 'lei-mecenato' },
    { label: 'Histórias de Impacto', view: 'impacto-real' },
    { label: 'Simulador', view: 'simulador' },
    { label: 'FAQ', view: 'faq' },
  ]

  // Estilo dinâmico baseado na identidade
  const headerStyle = {
    background: `linear-gradient(to right, ${brand.primaryColor}, ${brand.primaryColor}cc, ${brand.primaryColor})`,
    fontFamily: brand.primaryFont,
  }

  return (
    <header className="text-white shadow-xl sticky top-0 z-50" style={headerStyle}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentView('home')} className="flex items-center space-x-3 group" aria-label="Ir para a página inicial">
            <div className="bg-white rounded-xl p-1.5 group-hover:bg-slate-100 transition shadow-md">
              <img src="/images/logo-leidomecenato-official.svg" alt={brand.name} className="h-10 w-10 object-contain" />
            </div>
            <div className="text-left">
              <div className="text-xl font-extrabold tracking-tight leading-none">{brand.name}</div>
              <p className="text-xs font-medium" style={{ color: brand.accentColor }}>{brand.tagline}</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center space-x-1" aria-label="Navegação principal">
            {navItems.map(item => (
              <button key={item.view} onClick={() => setCurrentView(item.view)}
                aria-current={currentView === item.view ? 'page' : undefined}
                className="px-3 py-2 rounded-lg text-sm font-medium transition"
                style={currentView === item.view
                  ? { backgroundColor: brand.secondaryColor, color: '#ffffff' }
                  : { color: '#cbd5e1' }}
                onMouseEnter={e => { if (currentView !== item.view) e.currentTarget.style.backgroundColor = `${brand.secondaryColor}40` }}
                onMouseLeave={e => { if (currentView !== item.view) e.currentTarget.style.backgroundColor = 'transparent' }}>
                {item.label}
              </button>
            ))}
            {session ? (
              <button
                onClick={() => setCurrentView('area-privada')}
                aria-label={`Abrir área privada de ${session.name}`}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition"
                style={{ backgroundColor: '#10b981' }}>
                 {session.name.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-bold transition text-slate-900"
                style={{ backgroundColor: brand.accentColor }}>
                Entrar / Registar
              </button>
            )}
          </nav>

          <div className="md:hidden flex space-x-2">
            {session ? (
              <button onClick={() => setCurrentView('area-privada')}
                className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold">Área Privada</button>
            ) : (
              <button onClick={() => setCurrentView('login')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-900"
                style={{ backgroundColor: brand.accentColor }}>Entrar</button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
