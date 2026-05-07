import { useEffect, useState } from 'react'
import { Account, ImpactContract, ViewType } from './types'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './components/HomePage'
import SimulatorPage from './components/SimulatorPage'
import CompanyDonationPage from './components/CompanyDonationPage'
import InstitutionRegisterPage from './components/InstitutionRegisterPage'
import ImpactContractSuccessPage from './components/ImpactContractSuccessPage'
import ImpactStoriesPage from './components/ImpactStoriesPage'
import FaqPage from './components/FaqPage'
import MecenatoLawPage from './components/MecenatoLawPage'
import LoginPage from './components/LoginPage'
import PrivateAreaPage from './components/PrivateAreaPage'
import AdminPage from './components/AdminPage'
import LegalPage from './components/LegalPage'
import CookieConsent from './components/CookieConsent'
import BrandSync from './components/BrandSync'
import { getSession, findAccountByEmail } from './utils/authStore'
import { getRealSessionAccount, realBackendEnabled } from './utils/supabaseBackend'
import { createProof, getProofByContractId } from './utils/proofStore'
import { createCompanyDonationRegisteredNotification, createDonationIntentNotification } from './utils/notificationStore'
import { createThread } from './utils/chatStore'

type AppState =
  | { screen: 'main'; view: ViewType }
  | { screen: 'contract-success'; contract: ImpactContract }

const pathToView = (path: string): ViewType => {
  const clean = path.replace(/\/$/, '') || '/'
  const routes: Record<string, ViewType> = {
    '/': 'home',
    '/empresa/donativo': 'empresa',
    '/instituicao/registo': 'instituicao',
    '/empresas': 'empresas',
    '/instituicoes': 'instituicoes',
    '/relatorios': 'relatorios',
    '/simulador': 'simulador',
    '/lei-do-mecenato': 'lei-mecenato',
    '/impacto-real': 'impacto-real',
    '/faq': 'faq',
    '/entrar': 'login',
    '/area-privada': 'area-privada',
    '/admin': 'admin',
    '/privacidade': 'privacidade',
    '/termos': 'termos',
    '/cookies': 'cookies',
  }
  return routes[clean] || 'home'
}

const viewToPath = (view: ViewType): string => {
  const routes: Partial<Record<ViewType, string>> = {
    home: '/',
    empresa: '/empresa/donativo',
    instituicao: '/instituicao/registo',
    empresas: '/empresas',
    instituicoes: '/instituicoes',
    relatorios: '/relatorios',
    simulador: '/simulador',
    'lei-mecenato': '/lei-do-mecenato',
    'impacto-real': '/impacto-real',
    faq: '/faq',
    login: '/entrar',
    'area-privada': '/area-privada',
    admin: '/admin',
    privacidade: '/privacidade',
    termos: '/termos',
    cookies: '/cookies',
  }
  return routes[view] || '/'
}

export default function App() {
  const [state, setState] = useState<AppState>(() => ({ screen: 'main', view: pathToView(window.location.pathname) }))
  const [session, setSession] = useState<Account | null>(null)

  useEffect(() => {
    let alive = true
    if (realBackendEnabled()) {
      getRealSessionAccount().then(account => {
        if (alive) setSession(account)
      })
    } else {
      setSession(getSession())
    }
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const onPop = () => setState({ screen: 'main', view: pathToView(window.location.pathname) })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [state])

  const setView = (view: ViewType) => {
    const path = viewToPath(view)
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setState({ screen: 'main', view })
  }

  const handleContractComplete = (contract: ImpactContract) => {
    if (!getProofByContractId(contract.id)) {
      const companyAccountId = session?.role === 'empresa' ? session.id : 'guest-' + contract.nif
      const institutionAccount = findAccountByEmail(`institucao-${contract.institutionId}@demo.pt`)
        || findAccountByEmail('instituicao@demo.pt')
      const proof = createProof({
        contractId: contract.id,
        companyAccountId,
        institutionAccountId: institutionAccount?.id,
        institutionName: contract.institutionName,
        amount: contract.donationAmount,
        date: contract.donationDate,
        description: `Donativo (${contract.donationType === 'dinheiro' ? 'dinheiro' : 'produtos/serviços'}) à ${contract.institutionName}`,
        proofFileName: contract.proofFileName,
        proofFileDataUrl: contract.proofFileDataUrl,
        proofFileSize: contract.proofFileSize,
      })
      createThread(contract, session?.role === 'empresa' ? session : null, institutionAccount?.id, proof.id)
      createDonationIntentNotification(contract, institutionAccount?.id)
      createCompanyDonationRegisteredNotification(contract, session?.role === 'empresa' ? session.id : undefined)
    }
    setState({ screen: 'contract-success', contract })
  }

  const handleGoToPrivate = () => {
    if (session) setState({ screen: 'main', view: 'area-privada' })
    else setState({ screen: 'main', view: 'login' })
  }

  const handleHome = () => setState({ screen: 'main', view: 'home' })

  const handleLogin = (account: Account) => {
    setSession(account)
    setState({ screen: 'main', view: 'area-privada' })
  }

  const handleLogout = () => {
    setSession(null)
    setState({ screen: 'main', view: 'home' })
  }

  if (state.screen === 'contract-success') {
    return (
      <>
        <BrandSync view="area-privada" />
        <ImpactContractSuccessPage
          contract={state.contract}
          onGoToPrivate={handleGoToPrivate}
          onHome={handleHome}
        />
      </>
    )
  }

  const { view } = state

  return (
    <div className="flex flex-col min-h-screen">
      <BrandSync view={view} />
      <Header currentView={view} setCurrentView={setView} session={session} />

      <main className="flex-1">
        {view === 'home' && <HomePage setCurrentView={setView} />}
        {view === 'lei-mecenato' && <MecenatoLawPage setCurrentView={setView} />}
        {view === 'impacto-real' && <ImpactStoriesPage setCurrentView={setView} />}
        {view === 'faq' && <FaqPage setCurrentView={setView} />}
        {view === 'simulador' && <SimulatorPage />}
        {view === 'empresa' && (
          <CompanyDonationPage onContractComplete={handleContractComplete} account={session} />
        )}
        {view === 'instituicao' && (
          <InstitutionRegisterPage onComplete={handleHome} />
        )}
        {(view === 'empresas' || view === 'instituicoes' || view === 'relatorios') && (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
             <div className="max-w-2xl text-center bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
                <div className="text-6xl mb-6">🚀</div>
                <h1 className="text-3xl font-black mb-4 capitalize">{view}</h1>
                <p className="text-slate-500 mb-8 text-lg">Estamos a preparar conteúdos exclusivos para esta página. Junte-se à plataforma para ser notificado.</p>
                <button onClick={() => setView('login')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">Criar Conta Gratuitamente</button>
             </div>
          </div>
        )}
        {view === 'login' && (
          <LoginPage onLogin={handleLogin} setCurrentView={setView} />
        )}
        {view === 'area-privada' && (
          session ? (
            <PrivateAreaPage account={session} onLogout={handleLogout} setCurrentView={setView} />
          ) : (
            <LoginPage onLogin={handleLogin} setCurrentView={setView} />
          )
        )}
        {view === 'admin' && (
          <AdminPage setCurrentView={setView} />
        )}
        {view === 'privacidade' && (
          <LegalPage kind="privacidade" setCurrentView={setView} />
        )}
        {view === 'termos' && (
          <LegalPage kind="termos" setCurrentView={setView} />
        )}
        {view === 'cookies' && (
          <LegalPage kind="cookies" setCurrentView={setView} />
        )}
      </main>

      <Footer setCurrentView={setView} />
      <CookieConsent setCurrentView={setView} />
    </div>
  )
}
