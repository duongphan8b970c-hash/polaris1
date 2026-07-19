import { useState } from 'react'
import TradePlanning from './TradePlanning'
import TradeTracking from './TradeTracking'

const TABS = [
  { id: 'planning', label: 'Kế hoạch Trade', icon: '📋' },
  { id: 'tracking', label: 'Quản lý Trade', icon: '📈' }
]

export default function Trade() {
  // Mặc định mở tab "Kế hoạch Trade"
  const [activeTab, setActiveTab] = useState('planning')

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
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
      {activeTab === 'planning' ? <TradePlanning /> : <TradeTracking />}
    </div>
  )
}
