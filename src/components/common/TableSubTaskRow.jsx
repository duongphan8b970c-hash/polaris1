import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Modal from './Modal'

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
    <Modal isOpen title="Sửa Subtask" onClose={onClose}>
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

function SubtaskInlineDetail({ subtask, onEdit, onClose, indentPx }) {
  const hasInfo = subtask.description
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          className="bg-purple-50/60 border-b border-purple-100 py-2 pr-4 flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ paddingLeft: `${indentPx}px` }}
        >
          {hasInfo ? (
            <span className="text-xs text-gray-600 italic">{subtask.description}</span>
          ) : (
            <span className="text-xs text-gray-400 italic">Không có mô tả</span>
          )}
          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              ✏️ Sửa
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function TableSubTaskRow({
  subtask,
  depth = 2,
  onToggle,
  onUpdate,
  onDelete,
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const dateInputRef = useRef(null)

  const indentPx = depth * 28 + 8

  // Shared helper: merge partial changes into a full update call
  const updateField = useCallback((changes) => {
    return onUpdate(subtask.id, {
      title: subtask.title,
      description: subtask.description,
      is_completed: subtask.is_completed,
      scheduled_date: subtask.scheduled_date,
      is_calendar_visible: subtask.is_calendar_visible,
      ...changes,
    })
  }, [subtask, onUpdate])

  const handleSave = async (data) => {
    const result = await updateField(data)
    if (result?.success) setShowEdit(false)
  }

  const handleDateChange = useCallback(async (e) => {
    await updateField({ scheduled_date: e.target.value || null })
  }, [updateField])

  const handleCalendarToggle = useCallback(async (e) => {
    e.stopPropagation()
    await updateField({ is_calendar_visible: !subtask.is_calendar_visible })
  }, [updateField, subtask.is_calendar_visible])

  const handleDateClick = (e) => {
    e.stopPropagation()
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try { dateInputRef.current.showPicker() } catch { dateInputRef.current.click() }
      } else {
        dateInputRef.current.click()
      }
    }
  }

  return (
    <>
      <tr
        className="hover:bg-purple-50 border-b border-gray-100 transition-colors cursor-pointer"
        aria-label={`Subtask: ${subtask.title}`}
        onClick={() => setShowDetail(true)}
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

        {/* Deadline — inline date picker + calendar toggle */}
        <td className="px-3 py-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            {/* Inline date picker trigger */}
            <div className="relative">
              <button
                onClick={handleDateClick}
                className="hover:text-blue-600 hover:underline transition-colors"
                title="Chọn ngày"
              >
                {subtask.scheduled_date
                  ? new Date(subtask.scheduled_date).toLocaleDateString('vi-VN')
                  : <span className="text-gray-400">—</span>}
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={subtask.scheduled_date || ''}
                onChange={handleDateChange}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            {/* Calendar visibility toggle */}
            <button
              onClick={handleCalendarToggle}
              title={subtask.is_calendar_visible ? 'Bỏ khỏi Calendar' : 'Thêm vào Calendar'}
              className={`p-0.5 rounded transition-colors ${
                subtask.is_calendar_visible
                  ? 'text-blue-500 hover:text-blue-700'
                  : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </td>

        {/* Actions */}
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowEdit(true)
              }}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Sửa tiêu đề / mô tả"
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

      {/* Edit Modal for title/description only (portaled to body) */}
      {showEdit && (
        <SubtaskEditModal
          subtask={subtask}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Inline Subtask Detail */}
      {showDetail && (
        <SubtaskInlineDetail
          subtask={subtask}
          onEdit={() => { setShowDetail(false); setShowEdit(true) }}
          onClose={() => setShowDetail(false)}
          indentPx={indentPx + 20}
        />
      )}
    </>
  )
}
