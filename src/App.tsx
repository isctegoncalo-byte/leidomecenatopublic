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
import ImpactRatingPage from './components/ImpactRatingPage'
import ProjectDetailPage from './components/ProjectDetailPage'
import FaqPage from './components/FaqPage'
import MecenatoLawPage from './components/MecenatoLawPage'
import LoginPage from './components/LoginPage'
import PrivateAreaPage from './components/PrivateAreaPage'
import AdminPage from './components/AdminPage'
import LegalPage from './components/LegalPage'
import CookieConsent from './components/CookieConsent'
import SiteChatbot from './components/SiteChatbot'
import BrandSync from './components/BrandSync'
import { getSession, listAccounts } from './utils/authStore'
import { getRealSessionAccount, realBackendEnabled } from './utils/supabaseBackend'
import { createProof, getProofByContractId } from './utils/proofStore'
import { createCompanyDonationRegisteredNotification, createDonationIntentNotification } from './utils/notificationStore'
import { createThread } from './utils/chatStore'

type AppState =
  | { screen: 'main'; view: ViewType }
  | { screen: 'contract-success'; contract: ImpactContract }

const pathToView = (path: string): ViewType => {
  const clean = path.replace(/\/$/, '') || '/'
  if (clean.startsWith('/projeto/') || clean.startsWith('/projetos/')) return 'projeto'
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
    '/rating-de-impacto': 'rating-impacto',
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
    'rating-impacto': '/rating-de-impacto',
    projeto: window.location.pathname.startsWith('/projeto/') || window.location.pathname.startsWith('/projetos/') ? window.location.pathname : '/projetos',
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

const resolveInstitutionAccountId = (institutionId: string): string | undefined => {
  const accounts = listAccounts()
  const sampleAccount = accounts.find(account => account.role === 'instituicao' && account.id === `acc-i${institutionId}`)
  if (sampleAccount) return sampleAccount.id

  if (institutionId.startsWith('reg-')) {
    const nif = institutionId.slice(4)
    return accounts.find(account => account.role === 'instituicao' && account.nif === nif)?.id
  }

  return /^\d+$/.test(institutionId) ? undefined : institutionId || undefined
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
      const institutionAccountId = resolveInstitutionAccountId(contract.institutionId)
      const proof = createProof({
        contractId: contract.id,
        companyAccountId,
        companyName: contract.company,
        companyNif: contract.nif,
        companyEmail: contract.email,
        institutionAccountId,
        institutionName: contract.institutionName,
        donationType: contract.donationType,
        selectedNeedIds: contract.selectedNeedIds,
        amount: contract.donationAmount,
        projectCost: contract.projectCost,
        date: contract.donationDate,
        description: `Donativo (${contract.donationType === 'dinheiro' ? 'dinheiro' : 'produtos/serviços'}) à ${contract.institutionName}`,
        proofFileName: contract.proofFileName,
        proofFileDataUrl: contract.proofFileDataUrl,
        proofFileSize: contract.proofFileSize,
      })
      createThread(contract, session?.role === 'empresa' ? session : null, institutionAccountId, proof.id)
      createDonationIntentNotification(contract, institutionAccountId)
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
    if (account.role === 'admin') {
      setState({ screen: 'main', view: 'admin' })
      return
    }
    const pending = localStorage.getItem('leidomecenato_pending_project')
    if (pending && account.role === 'empresa') {
      setState({ screen: 'main', view: 'empresa' })
      return
    }
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
        {view === 'rating-impacto' && <ImpactRatingPage setCurrentView={setView} />}
        {view === 'projeto' && <ProjectDetailPage account={session} setCurrentView={setView} />}
        {view === 'faq' && <FaqPage setCurrentView={setView} />}
        {view === 'simulador' && <SimulatorPage setCurrentView={setView} />}
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
          <AdminPage setCurrentView={setView} session={session} onLogout={handleLogout} />
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
      <SiteChatbot setCurrentView={setView} />
      <CookieConsent setCurrentView={setView} />
    </div>
  )
}
