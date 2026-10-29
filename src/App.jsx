import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { BusinessRequiredRoute, ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { BusinessSetupPage } from './pages/business/BusinessSetupPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ExpensesPage } from './pages/expenses/ExpensesPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { SalesPage } from './pages/sales/SalesPage'
import { InsightsPage } from './pages/insights/InsightsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/business/setup" element={<BusinessSetupPage />} />
          <Route element={<BusinessRequiredRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/ai-insights" element={<InsightsPage />} />
            <Route path="/insights" element={<Navigate to="/ai-insights" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
