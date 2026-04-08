import { useState } from 'react'
import PaybackTracking from './PaybackTracking'
import PageHeader from '../../components/layout/PageHeader'

const TABS = [
  { id: 'payback', label: 'Payback', icon: '💳', description: 'Theo dõi các khoản cần trả' },
  { id: 'plan', label: 'Plan', icon: '📋', description: 'Kế hoạch chi tiêu hàng tháng' }
]

export default function ABetterDay() {
  const [activeTab, setActiveTab] = useState('payback')

  return (
    <div>
      <PageHeader title="A Better Day" />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <PaybackTracking goalType={activeTab} />
    </div>
  )
}
