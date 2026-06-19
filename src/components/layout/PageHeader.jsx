export default function PageHeader({ title, subtitle, action, darkMode = false }) {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-0.5 text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}