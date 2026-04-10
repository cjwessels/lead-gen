import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PublicShell } from './components/layout/PublicShell'
import { ProtectedRoute } from './modules/auth/ProtectedRoute'
import { HomePage } from './pages/public/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { SearchPage } from './pages/search/SearchPage'
import { LeadsPage } from './pages/leads/LeadsPage'
import { PipelinePage } from './pages/pipeline/PipelinePage'
import { OutreachPage } from './pages/outreach/OutreachPage'
import { BillingPage } from './pages/billing/BillingPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicShell>
            <HomePage />
          </PublicShell>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="outreach" element={<OutreachPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
