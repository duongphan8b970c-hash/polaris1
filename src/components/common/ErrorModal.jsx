export default function ErrorModal({ isOpen, title = 'Lỗi', message, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>
          
          {/* Button */}
          <button
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
