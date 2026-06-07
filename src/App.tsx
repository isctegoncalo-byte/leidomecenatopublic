import { useEffect, useRef, useState } from 'react'
import { Account, ImpactContract, ViewType } from './types'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './components/HomePage'
import SimulatorPage from './components/SimulatorPage'
import CompanyDonationPage from './components/CompanyDonationPage'
import InstitutionRegisterPage from './components/InstitutionRegisterPage'
import ImpactContractSuccessPage from './components/ImpactContractSuccessPage'
import ImpactStoriesPage from './components/ImpactStoriesPage'
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
import { getRealSessionAccount, notifyAdminAboutDonationIntent, realBackendEnabled } from './utils/supabaseBackend'
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
    '/historias-de-impacto': 'impacto-real',
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
    'impacto-real': '/historias-de-impacto',
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
  const [sessionReady, setSessionReady] = useState(false)
  const sessionRef = useRef<Account | null>(null)

  const setStableSession = (account: Account | null) => {
    sessionRef.current = account
    setSession(account)
  }

  useEffect(() => {
    let alive = true
    if (realBackendEnabled()) {
      getRealSessionAccount().then(account => {
        if (alive && !sessionRef.current) setStableSession(account)
        if (alive) setSessionReady(true)
      }).catch(() => {
        if (alive) setSessionReady(true)
      })
    } else {
      setStableSession(getSession())
      setSessionReady(true)
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
    const resolvedView = view === 'area-privada' && session?.role === 'admin' ? 'admin' : view
    const path = viewToPath(resolvedView)
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setState({ screen: 'main', view: resolvedView })
  }

  const handleContractComplete = (contract: ImpactContract) => {
    if (!getProofByContractId(contract.id)) {
      const activeSession = sessionRef.current
      const companyAccountId = activeSession?.role === 'empresa' ? activeSession.id : 'guest-' + contract.nif
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
        reportTierName: contract.reportTier.name,
        reportPrice: contract.reportPrice,
        reportVat: contract.reportVat,
        reportTotal: contract.reportTotal,
        reportPaymentStatus: contract.reportPaymentStatus || (contract.reportPrice > 0 ? 'pending' : 'none'),
        amount: contract.donationAmount,
        publicDonationAmountConsent: contract.publicDonationAmountConsent,
        projectCost: contract.projectCost,
        date: contract.donationDate,
        description: `Donativo (${contract.donationType === 'dinheiro' ? 'apoio financeiro' : 'produtos/serviços'}) à ${contract.institutionName}`,
        proofFileName: contract.proofFileName,
        proofFileDataUrl: contract.proofFileDataUrl,
        proofFileSize: contract.proofFileSize,
      })
      createThread(contract, activeSession?.role === 'empresa' ? activeSession : null, institutionAccountId, proof.id)
      const donationNotification = createDonationIntentNotification(contract, institutionAccountId)
      if (realBackendEnabled()) void notifyAdminAboutDonationIntent(contract, donationNotification)
      createCompanyDonationRegisteredNotification(contract, activeSession?.role === 'empresa' ? activeSession.id : undefined)
    }
    setState({ screen: 'contract-success', contract })
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') !== 'success') return
    if (!sessionReady) return

    const raw = localStorage.getItem('leidomecenato_pending_report_payment')
    if (!raw) return

    try {
      const pending = JSON.parse(raw) as { contract?: ImpactContract; paymentStatus?: 'pending' | 'paid' }
      if (!pending.contract) return
      localStorage.removeItem('leidomecenato_pending_report_payment')
      window.history.replaceState({}, '', '/empresa/donativo')
      handleContractComplete({ ...pending.contract, reportPaymentStatus: 'paid' })
    } catch {
      localStorage.removeItem('leidomecenato_pending_report_payment')
    }
  }, [sessionReady, session?.id])

  const handleGoToPrivate = () => {
    if (session) setView(session.role === 'admin' ? 'admin' : 'area-privada')
    else setState({ screen: 'main', view: 'login' })
  }

  const handleHome = () => setState({ screen: 'main', view: 'home' })

  const handleLogin = (account: Account) => {
    setStableSession(account)
    if (account.role === 'admin') {
      const path = viewToPath('admin')
      if (window.location.pathname !== path) window.history.pushState({}, '', path)
      setState({ screen: 'main', view: 'admin' })
      return
    }
    const pending = localStorage.getItem('leidomecenato_pending_project')
    if (pending && account.role === 'empresa') {
      const path = viewToPath('empresa')
      if (window.location.pathname !== path) window.history.pushState({}, '', path)
      setState({ screen: 'main', view: 'empresa' })
      return
    }
    const path = viewToPath('area-privada')
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setState({ screen: 'main', view: 'area-privada' })
  }

  const handleLogout = () => {
    setStableSession(null)
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
      <a href="#conteudo-principal" className="skip-link">Saltar para o conteúdo principal</a>
      <Header currentView={view} setCurrentView={setView} session={session} />

      <main id="conteudo-principal" className="flex-1" tabIndex={-1}>
        {view === 'home' && <HomePage setCurrentView={setView} />}
        {view === 'lei-mecenato' && <MecenatoLawPage setCurrentView={setView} />}
        {view === 'impacto-real' && <ImpactStoriesPage setCurrentView={setView} />}
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
                <div className="text-6xl mb-6"></div>
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
          session?.role === 'admin' ? (
            <AdminPage setCurrentView={setView} session={session} onLogout={handleLogout} />
          ) : session ? (
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
