import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore }   from '@/store/useAuthStore'
import { useThemeStore }  from '@/store/useThemeStore'
import { useWalletStore } from '@/store/useWalletStore'

// Auth
import ProtectedRoute from '@/pages/auth/ProtectedRoute'
import Login          from '@/pages/auth/Login'
import Register       from '@/pages/auth/Register'
// Onboarding
import Onboarding     from '@/pages/onboarding/Onboarding'
// Main pages
import Home           from '@/pages/Home'
import Cards          from '@/pages/Cards'
import Rewards        from '@/pages/Rewards'
import Finance        from '@/pages/Finance'
import Profile        from '@/pages/Profile'
import Bills          from '@/pages/Bills'
import Savings        from '@/pages/Savings'
import Notifications  from '@/pages/Notifications'
import Settings       from '@/pages/Settings'
// v3 pages
import Investments    from '@/pages/investments/Investments'
import Loans          from '@/pages/loans/Loans'
import KYC            from '@/pages/kyc/KYC'
import Support        from '@/pages/support/Support'
import QRScan         from '@/pages/scan/QRScan'
import P2PTransfer    from '@/pages/p2p/P2PTransfer'
// v4 new pages
import Exchange       from '@/pages/exchange/Exchange'
import Insurance      from '@/pages/insurance/Insurance'
import Analytics      from '@/pages/analytics/Analytics'
import Scheduler      from '@/pages/scheduler/Scheduler'
import Budget         from '@/pages/budget/Budget'
import Cashback       from '@/pages/airtime/Cashback'
// v5 new pages
import CreditScore    from '@/pages/creditScore/CreditScore'
import GiftCards      from '@/pages/giftCards/GiftCards'
import SplitPay       from '@/pages/splitPay/SplitPay'
import Remittance     from '@/pages/remittance/Remittance'
import Subscriptions  from '@/pages/subscriptions/Subscriptions'
// v7 Batch 2
import NetWorth      from '@/pages/netWorth/NetWorth'
import PayLater      from '@/pages/payLater/PayLater'
import MerchantPage  from '@/pages/merchant/Merchant'
import SecurityCenter from '@/pages/security/Security'
import PensionPlanner from '@/pages/pension/Pension'
// v8 Batch 3
import ReferralCenter   from '@/pages/referralCenter/ReferralCenter'
import WireTransfer     from '@/pages/wireTransfer/WireTransfer'
import TaxCenter        from '@/pages/taxCenter/TaxCenter'
import BudgetChallenges from '@/pages/budgetChallenges/BudgetChallenges'
import TravelPage       from '@/pages/travel/Travel'
// v9 Batch 4
import SocialFeed      from '@/pages/social/Social'
import EscrowPage      from '@/pages/escrow/Escrow'
import PaymentLinksPage from '@/pages/paymentLinks/PaymentLinks'
import PortfolioPage   from '@/pages/portfolio/Portfolio'
import FamilyPage      from '@/pages/family/Family'
// v10 Batch 5
import AirtimeDataPage  from '@/pages/airtimeData/AirtimeData'
import BillPaymentsPage from '@/pages/billPayments/BillPayments'
import LoanCalcPage     from '@/pages/loanCalculator/LoanCalculator'
import AlertsPage       from '@/pages/alertsManager/AlertsManager'
import CryptoPage       from '@/pages/crypto/Crypto'
// Layout
import Sidebar        from '@/components/layout/Sidebar'
import BottomNav      from '@/components/layout/BottomNav'

function AppShell() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar/>
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden"><Outlet/></main>
      <BottomNav/>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, refreshMe } = useAuthStore()
  const { isDark }       = useThemeStore()
  const { fetchBalance } = useWalletStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    if (isAuthenticated) { refreshMe(); fetchBalance() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-center" gutter={8} toastOptions={{
        duration: 3500,
        style: { borderRadius:'16px', fontSize:'14px', fontWeight:600, fontFamily:"'Sora',sans-serif", padding:'12px 16px' },
        success: { iconTheme:{ primary:'#16a34a', secondary:'#fff' } },
        error:   { iconTheme:{ primary:'#ef4444', secondary:'#fff' } },
      }}/>
      <Routes>
        <Route path="/onboarding" element={<Onboarding/>}/>
        <Route path="/login"      element={<Login/>}/>
        <Route path="/register"   element={<Register/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route element={<AppShell/>}>
            {/* Core */}
            <Route index                element={<Home/>}/>
            <Route path="/rewards"      element={<Rewards/>}/>
            <Route path="/finance"      element={<Finance/>}/>
            <Route path="/cards"        element={<Cards/>}/>
            <Route path="/savings"      element={<Savings/>}/>
            <Route path="/bills"        element={<Bills/>}/>
            <Route path="/profile"      element={<Profile/>}/>
            <Route path="/notifications" element={<Notifications/>}/>
            <Route path="/settings"     element={<Settings/>}/>
            {/* v3 */}
            <Route path="/investments"  element={<Investments/>}/>
            <Route path="/loans"        element={<Loans/>}/>
            <Route path="/kyc"          element={<KYC/>}/>
            <Route path="/support"      element={<Support/>}/>
            <Route path="/scan"         element={<QRScan/>}/>
            <Route path="/send"         element={<P2PTransfer/>}/>
            {/* v4 NEW */}
            <Route path="/exchange"     element={<Exchange/>}/>
            <Route path="/insurance"    element={<Insurance/>}/>
            <Route path="/analytics"    element={<Analytics/>}/>
            <Route path="/scheduler"    element={<Scheduler/>}/>
            <Route path="/budget"       element={<Budget/>}/>
            <Route path="/cashback"     element={<Cashback/>}/>
            {/* v5 new pages */}
            <Route path="/credit-score"   element={<CreditScore/>}/>
            <Route path="/gift-cards"     element={<GiftCards/>}/>
            <Route path="/split-pay"      element={<SplitPay/>}/>
            <Route path="/remittance"     element={<Remittance/>}/>
            <Route path="/subscriptions"  element={<Subscriptions/>}/>
            {/* v7 Batch 2 */}
            <Route path="/net-worth"       element={<NetWorth/>}/>
            <Route path="/pay-later"       element={<PayLater/>}/>
            <Route path="/merchant"        element={<MerchantPage/>}/>
            <Route path="/security"        element={<SecurityCenter/>}/>
            <Route path="/pension"         element={<PensionPlanner/>}/>
            {/* v8 Batch 3 */}
            <Route path="/referrals"       element={<ReferralCenter/>}/>
            <Route path="/wire-transfer"   element={<WireTransfer/>}/>
            <Route path="/tax"             element={<TaxCenter/>}/>
            <Route path="/challenges"      element={<BudgetChallenges/>}/>
            <Route path="/travel"          element={<TravelPage/>}/>
            {/* v9 Batch 4 */}
            <Route path="/social"          element={<SocialFeed/>}/>
            <Route path="/escrow"          element={<EscrowPage/>}/>
            <Route path="/payment-links"   element={<PaymentLinksPage/>}/>
            <Route path="/portfolio"       element={<PortfolioPage/>}/>
            <Route path="/family"          element={<FamilyPage/>}/>
            {/* v10 Batch 5 */}
            <Route path="/airtime-data"    element={<AirtimeDataPage/>}/>
            <Route path="/bill-payments"   element={<BillPaymentsPage/>}/>
            <Route path="/loan-calc"       element={<LoanCalcPage/>}/>
            <Route path="/alerts"          element={<AlertsPage/>}/>
            <Route path="/crypto"          element={<CryptoPage/>}/>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
