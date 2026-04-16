import { useState } from 'react'
import UserAvatar from '../common/UserAvatar'

export default function GoalCard({ goal, onEdit, onDelete, onComplete, onClick }) {
  const [hasPrompted, setHasPrompted] = useState(false)
  
  const isCompleted = goal.status === 'completed'
  const progress = parseFloat(goal.progress) || 0

  const showCompletePrompt = !isCompleted && progress >= 100 && !hasPrompted

  const handleMarkComplete = async (e) => {
    e.stopPropagation()
    const today = new Date().toISOString().split('T')[0]
    setHasPrompted(true)
    await onComplete(goal, today)
  }

  const handleDismissPrompt = (e) => {
    e.stopPropagation()
    setHasPrompted(true)
  }

  const getTimeRemaining = () => {
    if (!goal.target_date) return null
    if (isCompleted) return null
    
    const today = new Date()
    const target = new Date(goal.target_date)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { type: 'overdue', days: Math.abs(diffDays) }
    if (diffDays === 0) return { type: 'today', days: 0 }
    if (diffDays <= 7) return { type: 'soon', days: diffDays }
    return { type: 'normal', days: diffDays }
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div 
      className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
      onClick={onClick}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: goal.color 
      }}
    >
      {/* Completion Prompt */}
      {showCompletePrompt && (
        <div 
          className="absolute top-3 right-3 bg-green-50 border-2 border-green-500 rounded-lg p-3 shadow-xl z-20 max-w-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Chúc mừng!
              </p>
              <p className="text-xs text-green-800">
                Đã hoàn thành 100%. Đánh dấu hoàn thành?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMarkComplete}
              className="flex-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              ✓ Hoàn thành
            </button>
            <button
              onClick={handleDismissPrompt}
              className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* ✅ Header Row - Better alignment */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{goal.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 leading-tight">
                  {goal.name}
                </h3>
                {isCompleted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    ✓ Hoàn thành
                  </span>
                )}
              </div>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 ml-16">
                {goal.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(goal)
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Sửa"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Xóa goal "${goal.name}"?`)) {
                  onDelete(goal)
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ✅ Assignees - Aligned left */}
        {goal.assigned_to && goal.assigned_to.length > 0 && (
          <div className="flex items-center gap-3 mb-4 ml-16">
            <span className="text-sm text-gray-600">👥</span>
            <div className="flex -space-x-2">
              {goal.assigned_to.slice(0, 4).map((userId, index) => (
                <div key={userId} style={{ zIndex: 10 - index }}>
                  <UserAvatar userId={userId} size="sm" />
                </div>
              ))}
              {goal.assigned_to.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 border-2 border-white">
                  +{goal.assigned_to.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ Progress Bar - Better spacing */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Tiến độ</span>
            <span className="text-base font-bold text-gray-900">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* ✅ Footer Info - Better alignment & larger text */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              📋 <span className="font-semibold">{goal.completed_tasks || 0}/{goal.total_tasks || 0}</span>
            </span>
            {goal.category && (
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 font-medium">
                {goal.category}
              </span>
            )}
          </div>
          {goal.priority && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              goal.priority === 'urgent' ? 'bg-red-100 text-red-700' :
              goal.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {goal.priority === 'urgent' ? '🔴 Khẩn cấp' :
               goal.priority === 'high' ? '🟠 Cao' :
               goal.priority === 'medium' ? '🟡 Trung bình' : '🔵 Thấp'}
            </span>
          )}
        </div>

        {/* ✅ Time Remaining - Larger & clearer */}
        {timeRemaining && !isCompleted && (
          <div className={`flex items-center justify-between text-sm font-medium px-4 py-2.5 rounded-lg mt-3 ${
            timeRemaining.type === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
            timeRemaining.type === 'today' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            timeRemaining.type === 'soon' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <span className="flex items-center gap-2">
              {timeRemaining.type === 'overdue' ? '⚠️ Quá hạn' :
               timeRemaining.type === 'today' ? '⏰ Đến hạn hôm nay' :
               timeRemaining.type === 'soon' ? '🔔 Sắp đến hạn' :
               '📅 Còn lại'}
            </span>
            {timeRemaining.days > 0 && (
              <span className="font-bold text-base">
                {timeRemaining.days} ngày
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}