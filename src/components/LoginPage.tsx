import { useState } from 'react'
import { Account, AccountRole, ViewType } from '../types'
import { login, registerAccount } from '../utils/authStore'
import { loginReal, realBackendEnabled, registerReal } from '../utils/supabaseBackend'

interface Props {
  onLogin: (account: Account) => void
  setCurrentView: (v: ViewType) => void
}

type Mode = 'login' | 'register'

export default function LoginPage({ onLogin, setCurrentView }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [role, setRole] = useState<AccountRole>('empresa')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [nif, setNif] = useState('')
  const [companyActivity, setCompanyActivity] = useState('')
  const [institutionLegalName, setInstitutionLegalName] = useState('')
  const [institutionCategory, setInstitutionCategory] = useState('')
  const [consentLogo, setConsentLogo] = useState(false)
  const [consentRGPD, setConsentRGPD] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = realBackendEnabled()
      ? await loginReal(email, password)
      : login(email, password)
    setLoading(false)
    if (!res.ok) { setError(res.error); return }
    onLogin(res.account)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password || !name || !nif) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }
    if (!consentRGPD) {
      setError('Deve aceitar o tratamento de dados de acordo com o RGPD para criar conta.')
      return
    }
    setLoading(true)
    const payload = {
      role,
      email, password, name, nif,
      companyActivity: role === 'empresa' ? companyActivity : undefined,
      institutionLegalName: role === 'instituicao' ? institutionLegalName : undefined,
      institutionCategory: role === 'instituicao' ? institutionCategory : undefined,
      consentLogoDisplay: consentLogo,
      consentRGPD: consentRGPD,
    }
    const res = realBackendEnabled()
      ? await registerReal(payload)
      : registerAccount(payload)
    setLoading(false)
    if (!res.ok) { setError(res.error); return }
    onLogin(res.account)
  }

  const fillDemo = (kind: AccountRole) => {
    setMode('login')
    setEmail(kind === 'empresa' ? 'empresa@demo.pt' : 'instituicao@demo.pt')
    setPassword('demo1234')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {mode === 'login' ? 'Iniciar Sessão' : 'Criar Conta'}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Acede à área privada para gerir documentos, donativos e comprovativos.
            </p>
            <div className={`mb-5 rounded-xl border p-3 text-xs font-semibold ${
              realBackendEnabled()
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {realBackendEnabled()
                ? 'Supabase ativo: contas e documentos usam a base real.'
                : 'Modo demo: falta configurar o ficheiro .env do Supabase.'}
            </div>

            {/* Toggle mode */}
            <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => { setMode('login'); setError('') }}
                className={`py-2 rounded-lg font-bold text-sm transition ${mode === 'login' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setMode('register'); setError('') }}
                className={`py-2 rounded-lg font-bold text-sm transition ${mode === 'register' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                Registar
              </button>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setRole('empresa')}
                  className={`p-4 rounded-xl border-2 text-sm font-bold transition ${role === 'empresa' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                >
                  🏢 Sou Empresa
                </button>
                <button
                  onClick={() => setRole('instituicao')}
                  className={`p-4 rounded-xl border-2 text-sm font-bold transition ${role === 'instituicao' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}
                >
                  🏛️ Sou Instituição
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">
                      {role === 'empresa' ? 'Nome da Empresa *' : 'Nome da Instituição *'}
                    </label>
                    <input value={name} onChange={e => setName(e.target.value)} required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">NIF *</label>
                    <input value={nif} onChange={e => setNif(e.target.value)} required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  {role === 'empresa' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Setor de Atividade</label>
                      <input value={companyActivity} onChange={e => setCompanyActivity(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  )}
                  {role === 'instituicao' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Denominação Legal</label>
                        <input value={institutionLegalName} onChange={e => setInstitutionLegalName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Área de Atuação</label>
                        <select value={institutionCategory} onChange={e => setInstitutionCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Selecione...</option>
                          <option>Infância e Juventude</option>
                          <option>Saúde</option>
                          <option>Cultura e Património</option>
                          <option>Ambiente</option>
                          <option>Desporto</option>
                          <option>Ciência e Investigação</option>
                          <option>Educação</option>
                          <option>Ação Social</option>
                          <option>Outra</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Palavra-passe *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                {mode === 'register' && <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres.</p>}
              </div>

              {mode === 'register' && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={consentRGPD} onChange={e => setConsentRGPD(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">
                      <strong>Consinto o tratamento dos meus dados pessoais</strong> de acordo com o RGPD (Regulamento Geral sobre a Proteção de Dados) para efeitos de registo, comunicação e funcionamento da plataforma. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={consentLogo} onChange={e => setConsentLogo(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">
                      <strong>Autorizo a utilização do logótipo</strong> da minha {role === 'empresa' ? 'empresa' : 'instituição'} na secção de parceiros do site Lei do Mecenato, para divulgação de que {role === 'empresa' ? 'a empresa fez um donativo' : 'a instituição recebeu um donativo'} ao abrigo da Lei do Mecenato.
                    </span>
                  </label>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition">
                {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setCurrentView('home')} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                ← Voltar ao início
              </button>
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-8 text-white">
              <h2 className="text-2xl font-black mb-3">Área Privada</h2>
              <p className="text-blue-200 mb-5 text-sm leading-relaxed">
                Tudo num só sítio: dados de registo, documentos, donativos e comprovativos validados.
              </p>
              <ul className="space-y-2 text-sm text-blue-100">
                <li className="flex items-start gap-2"><span>✓</span>Gestão de documentos (estatutos, contas, etc.)</li>
                <li className="flex items-start gap-2"><span>✓</span>Histórico de donativos</li>
                <li className="flex items-start gap-2"><span>✓</span>Comprovativos de donativo validados</li>
                <li className="flex items-start gap-2"><span>✓</span>Acesso aos relatórios de impacto</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 mb-2 text-sm">🧪 Contas de demonstração</h3>
              <p className="text-amber-700 text-xs mb-3">Usa estas contas para experimentar o fluxo completo:</p>
              <div className="space-y-2">
                <button onClick={() => fillDemo('empresa')}
                  className="w-full text-left bg-white border border-amber-200 rounded-xl p-3 hover:bg-amber-100 transition">
                  <div className="font-bold text-slate-800 text-sm">🏢 empresa@demo.pt</div>
                  <div className="text-xs text-slate-500">palavra-passe: demo1234</div>
                </button>
                <button onClick={() => fillDemo('instituicao')}
                  className="w-full text-left bg-white border border-amber-200 rounded-xl p-3 hover:bg-amber-100 transition">
                  <div className="font-bold text-slate-800 text-sm">🏛️ instituicao@demo.pt</div>
                  <div className="text-xs text-slate-500">palavra-passe: demo1234</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
