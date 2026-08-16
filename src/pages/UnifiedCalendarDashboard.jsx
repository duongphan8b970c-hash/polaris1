import { useState } from 'react'
import PageHeader from '../components/layout/PageHeader'
import FinanceCalendar from '../components/calendar/FinanceCalendar'
import GoalsCalendarDashboard from './goals/GoalsCalendarDashboard'

/**
 * Overview deliberately keeps financial due dates and Goal work separate.
 * Mixing them made each calendar cell ambiguous and hid the work-focused
 * controls that the Goal calendar already provides.
 */
export default function UnifiedCalendarDashboard() {
  const [activeCalendar, setActiveCalendar] = useState('finance')

  return (
    <div className="space-y-4">
      <PageHeader
        title="🗓️ Tổng quan"
        subtitle="Theo dõi lịch tài chính và lịch thực hiện Goal trong hai không gian riêng."
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
            💳 Lịch tài chính
          </button>
          <button
            onClick={() => setActiveCalendar('goals')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeCalendar === 'goals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            🎯 Lịch Goal
          </button>
        </nav>
      </div>

      {activeCalendar === 'finance' ? <FinanceCalendar /> : <GoalsCalendarDashboard embedded />}
    </div>
  )
}
