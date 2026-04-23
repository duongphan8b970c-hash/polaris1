export default function NotificationToast({ notifications = [], onDismiss }) {
  if (!notifications.length) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slideIn ${
            notif.type === 'error'
              ? 'bg-red-50 border-red-200'
              : notif.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : notif.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <span className="text-xl flex-shrink-0">
            {notif.type === 'error'
              ? '🚨'
              : notif.type === 'warning'
              ? '⚠️'
              : notif.type === 'success'
              ? '✅'
              : 'ℹ️'}
          </span>
          <div className="flex-1 min-w-0">
            {notif.title && (
              <p className={`font-semibold text-sm ${
                notif.type === 'error' ? 'text-red-800' :
                notif.type === 'warning' ? 'text-yellow-800' :
                notif.type === 'success' ? 'text-green-800' :
                'text-blue-800'
              }`}>
                {notif.title}
              </p>
            )}
            <p className={`text-sm mt-0.5 ${
              notif.type === 'error' ? 'text-red-700' :
              notif.type === 'warning' ? 'text-yellow-700' :
              notif.type === 'success' ? 'text-green-700' :
              'text-blue-700'
            }`}>
              {notif.message}
            </p>
          </div>
          <button
            onClick={() => onDismiss(notif.id)}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
              notif.type === 'error' ? 'hover:bg-red-100 text-red-500' :
              notif.type === 'warning' ? 'hover:bg-yellow-100 text-yellow-500' :
              notif.type === 'success' ? 'hover:bg-green-100 text-green-500' :
              'hover:bg-blue-100 text-blue-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
