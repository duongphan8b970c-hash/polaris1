import { useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from './Modal'

const SUBTASK_STATUS_CONFIG = {
  completed: { label: 'Xong', bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
  todo: { label: 'Chưa', bg: 'bg-gray-100', text: 'text-gray-600', icon: '📝' },
}

function SubtaskInlineDetail({ subtask, onClose, indentPx }) {
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          className="bg-purple-50 border-l-4 border-purple-300 py-3 pr-4"
          style={{ paddingLeft: `${indentPx}px` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{subtask.title}</p>
              {subtask.description && (
                <p className="text-xs text-gray-600 mt-1">{subtask.description}</p>
              )}
              {subtask.scheduled_date && (
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(subtask.scheduled_date).toLocaleDateString('vi-VN')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    subtask.is_completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {subtask.is_completed ? '✅ Hoàn thành' : '📝 Chưa xong'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

function SubtaskEditModal({ subtask, onSave, onClose }) {
  const [title, setTitle] = useState(subtask?.title || '')
  const [description, setDescription] = useState(subtask?.description || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    await onSave({ title: title.trim(), description: description.trim() })
    setSubmitting(false)
  }

  return createPortal(
    <Modal isOpen title={subtask ? 'Sửa Subtask' : 'Thêm Subtask'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tiêu đề subtask..."
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Mô tả thêm (tuỳ chọn)..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>,
    document.body
  )
}

export default function TableSubTaskRow({
  subtask,
  depth = 2,
  onToggle,
  onUpdate,
  onDelete,
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const indentPx = depth * 28 + 8
  const detailIndentPx = depth * 28 + 28

  const handleRowClick = () => setShowDetail((v) => !v)

  const handleSave = async (data) => {
    const result = await onUpdate(subtask.id, {
      ...data,
      is_completed: subtask.is_completed,
    })
    if (result?.success) setShowEdit(false)
  }

  return (
    <>
      <tr
        className="hover:bg-purple-50 border-b border-gray-100 transition-colors cursor-pointer"
        onClick={handleRowClick}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
        aria-label={`Subtask: ${subtask.title}`}
      >
        {/* Name */}
        <td className="py-2 pr-3" style={{ paddingLeft: `${indentPx}px` }}>
          <div className="flex items-center gap-2">
            {/* Spacer for chevron alignment */}
            <div className="w-5 flex-shrink-0" />
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle(subtask.id, subtask.is_completed)
              }}
              className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                subtask.is_completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-400 hover:border-green-500'
              }`}
              title={subtask.is_completed ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
            >
              {subtask.is_completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`text-sm ${
                subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {subtask.title}
            </span>
            <span className="text-xs text-purple-400 flex-shrink-0">• subtask</span>
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-2 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              subtask.is_completed
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {subtask.is_completed ? '✅ Xong' : '📝 Chưa'}
          </span>
        </td>

        {/* Priority - N/A */}
        <td className="px-3 py-2 text-gray-400 text-xs">—</td>

        {/* Count - N/A */}
        <td className="px-3 py-2 text-gray-400 text-xs">—</td>

        {/* Deadline */}
        <td className="px-3 py-2 text-xs text-gray-600">
          {subtask.scheduled_date
            ? new Date(subtask.scheduled_date).toLocaleDateString('vi-VN')
            : <span className="text-gray-400">—</span>}
        </td>

        {/* Actions - ALWAYS VISIBLE */}
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowEdit(true)
              }}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Sửa"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Xóa subtask "${subtask.title}"?`)) onDelete(subtask.id)
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Xóa"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Inline Detail */}
      {showDetail && (
        <SubtaskInlineDetail
          subtask={subtask}
          onClose={() => setShowDetail(false)}
          indentPx={detailIndentPx}
        />
      )}

      {/* Edit Modal (portaled to body) */}
      {showEdit && (
        <SubtaskEditModal
          subtask={subtask}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
