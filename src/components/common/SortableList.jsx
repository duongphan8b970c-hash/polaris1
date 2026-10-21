import { useRef, useState } from 'react'

/**
 * Vertical drag-to-reorder list built on pointer events, so it works with both
 * mouse and touch. Only the handle starts a drag (the rest of the row keeps its
 * own click behaviour); the handle also supports ArrowUp/ArrowDown.
 *
 * renderItem(item, { handleProps, isDragging }) must spread `handleProps` onto
 * the element that acts as the drag handle.
 */
export default function SortableList({ items, getKey, onReorder, renderItem, className = '' }) {
  const rowRefs = useRef(new Map())
  const dragRef = useRef(null)
  const [drag, setDrag] = useState(null) // { from, over, dy, shift }

  const move = (from, to) => {
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  const handlePointerDown = (e, index) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)

    const rects = items.map((item) => rowRefs.current.get(getKey(item))?.getBoundingClientRect())
    if (rects.some((r) => !r)) return
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0

    dragRef.current = { from: index, over: index, startY: e.clientY, rects }
    setDrag({ from: index, over: index, dy: 0, shift: rects[index].height + gap })
  }

  const handlePointerMove = (e) => {
    const state = dragRef.current
    if (!state) return
    const { from, startY, rects } = state
    const dy = e.clientY - startY
    const center = rects[from].top + rects[from].height / 2 + dy

    let over = 0
    rects.forEach((r, j) => {
      if (j !== from && r.top + r.height / 2 < center) over++
    })
    state.over = over
    setDrag((prev) => (prev ? { ...prev, dy, over } : prev))
  }

  const endDrag = (commit) => {
    const state = dragRef.current
    dragRef.current = null
    if (commit && state) move(state.from, state.over)
    setDrag(null)
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      move(index, index - 1)
    } else if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault()
      move(index, index + 1)
    }
  }

  const offsetFor = (index) => {
    if (!drag) return 0
    const { from, over, dy, shift } = drag
    if (index === from) return dy
    if (from < over && index > from && index <= over) return -shift
    if (from > over && index >= over && index < from) return shift
    return 0
  }

  return (
    <div className={className}>
      {items.map((item, index) => {
        const key = getKey(item)
        const isDragging = drag?.from === index
        return (
          <div
            key={key}
            ref={(el) => {
              if (el) rowRefs.current.set(key, el)
              else rowRefs.current.delete(key)
            }}
            style={{
              transform: drag ? `translateY(${offsetFor(index)}px)` : undefined,
              transition: drag && !isDragging ? 'transform 150ms ease' : undefined,
              position: 'relative',
              zIndex: isDragging ? 10 : undefined,
            }}
            className={isDragging ? 'shadow-lg rounded-lg opacity-95' : ''}
          >
            {renderItem(item, {
              isDragging,
              handleProps: {
                onPointerDown: (e) => handlePointerDown(e, index),
                onPointerMove: handlePointerMove,
                onPointerUp: () => endDrag(true),
                onPointerCancel: () => endDrag(false),
                onKeyDown: (e) => handleKeyDown(e, index),
                style: { touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' },
                role: 'button',
                tabIndex: 0,
                'aria-label': 'Kéo để sắp xếp (hoặc dùng phím ↑ ↓)',
                title: 'Kéo để sắp xếp',
              },
            })}
          </div>
        )
      })}
    </div>
  )
}
