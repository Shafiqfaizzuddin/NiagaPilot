import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { BusinessSetupPage } from './pages/business/BusinessSetupPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ExpensesPage } from './pages/expenses/ExpensesPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ComingSoonPage } from './pages/ComingSoonPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/business/setup" element={<BusinessSetupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sales" element={<ComingSoonPage type="sales" />} />
          <Route path="/insights" element={<ComingSoonPage type="insights" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
