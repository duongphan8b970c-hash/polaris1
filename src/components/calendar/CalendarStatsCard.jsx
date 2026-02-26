export default function CalendarStatsCard({ icon, label, value, color, trend }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200'
  }

  const iconBgColors = {
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    orange: 'bg-orange-200'
  }

  const iconColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700'
  }

  const textColors = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColors[color]} opacity-80 mb-1`}>
            {label}
          </p>
          <p className={`text-3xl font-bold ${textColors[color]}`}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-gray-600 mt-1">
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBgColors[color]} rounded-full flex items-center justify-center`}>
          <span className={`text-2xl ${iconColors[color]}`}>{icon}</span>
        </div>
      </div>
    </div>
  )
}