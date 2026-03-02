import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import FinancialTracking from './pages/finance/FinancialTracking'
import TradeTracking from './pages/finance/TradeTracking'
import Wallets from './pages/finance/WalletConfig'
import Reports from './pages/Reports'
import Login from './pages/Login'
import PaybackTracking from './pages/finance/PaybackTracking'
import GoalsDashboard from './pages/goals/GoalsDashboard'
import GoalDetails from './pages/goals/GoalDetails'
import TaskDetails from './pages/goals/TaskDetails'
import PaybackPriorityConfig from './pages/finance/PaybackPriorityConfig'
import UserProfile from './pages/UserProfile'
import GoalsCalendarDashboard from './pages/goals/GoalsCalendarDashboard'
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard'

// ✅ Create ProtectedRoute component
function ProtectedRoute({ children, session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}

// ✅ Create PublicRoute component (redirect if already logged in)
function PublicRoute({ children, session }) {
  if (session) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* ✅ Public Route - Login */}
        <Route
          path="/login"
          element={
            <PublicRoute session={session}>
              <Login />
            </PublicRoute>
          }
        />

        {/* ✅ Protected Routes - Main App */}
        <Route
          path="/"
          element={
            <ProtectedRoute session={session}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/goals/calendar" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<FinancialTracking />} />
          <Route path="trades" element={<TradeTracking />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payback" element={<PaybackTracking />} />
          <Route path="payback/priorities" element={<PaybackPriorityConfig />} />
          <Route path="goals" element={<Navigate to="/goals/calendar" />} /> {/* ✅ Redirect to calendar */}
          <Route path="goals/calendar" element={<GoalsCalendarDashboard />} /> {/* ✅ NEW: Main calendar */}
          <Route path="goals/list" element={<GoalsDashboard />} /> {/* ✅ Goals list */}
          <Route path="goals/:goalId" element={<GoalDetails />} />
          <Route path="goals/:goalId/tasks/:taskId" element={<TaskDetails />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* ✅ Catch all - redirect to dashboard or login */}
        <Route
          path="*"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  )
}

export default App