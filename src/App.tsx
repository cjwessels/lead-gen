import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { SearchPage } from './pages/search/SearchPage'
import { LeadsPage } from './pages/leads/LeadsPage'
import { PipelinePage } from './pages/pipeline/PipelinePage'
import { OutreachPage } from './pages/outreach/OutreachPage'
import { BillingPage } from './pages/billing/BillingPage'

export default function App() {
  return (
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
  )
}
