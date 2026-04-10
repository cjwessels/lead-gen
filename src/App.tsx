import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { SearchPage } from './pages/search/SearchPage'
import { LeadsPage } from './pages/leads/LeadsPage'
import { PipelinePage } from './pages/pipeline/PipelinePage'
import { OutreachPage } from './pages/outreach/OutreachPage'
import { BillingPage } from './pages/billing/BillingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ProtectedRoute } from './modules/auth/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/outreach" element={<OutreachPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
