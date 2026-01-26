export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">
            Delete
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}