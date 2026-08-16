import { useState } from 'react'
import PageHeader from '../components/layout/PageHeader'
import FinanceCalendar from '../components/calendar/FinanceCalendar'
import GoalsCalendarDashboard from './goals/GoalsCalendarDashboard'


export default function UnifiedCalendarDashboard() {
  const [activeCalendar, setActiveCalendar] = useState('goals')

  return (
    <div className="space-y-4">
      <PageHeader
        title="🗓️ Tổng quan"
      />

      <div className="border-b border-gray-200">
        <nav className="flex gap-5" aria-label="Loại lịch tổng quan">
          <button
            onClick={() => setActiveCalendar('finance')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeCalendar === 'finance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            💳 Finance
          </button>
          <button
            onClick={() => setActiveCalendar('goals')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeCalendar === 'goals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            🎯 Performance
          </button>
        </nav>
      </div>

      {activeCalendar === 'finance' ? <FinanceCalendar /> : <GoalsCalendarDashboard embedded />}
    </div>
  )
}
