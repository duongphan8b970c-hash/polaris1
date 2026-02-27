export default function StatsCard({ icon, label, value, subtext, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700'
  }

  const iconBgColors = {
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    orange: 'bg-orange-200',
    red: 'bg-red-200'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${iconBgColors[color]} rounded-full flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            trend > 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtext && (
        <p className="text-xs opacity-70">{subtext}</p>
      )}
    </div>
  )
}