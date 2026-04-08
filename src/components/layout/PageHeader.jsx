export default function PageHeader({ title, subtitle, action, darkMode = false }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-2 text-sm sm:text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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