import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

// ─── Pure drawing helpers (outside component) ──────────────────────────────

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    }
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function drawUserPath(ctx, points, color, lineWidth) {
  if (points.length < 2) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

function buildPath2D(pathStr, scale) {
  const path = new Path2D()
  const commands = pathStr.match(/[MLCSQTAZmlcsqtaz][^MLCSQTAZmlcsqtaz]*/g)
  if (!commands) return path

  let cx = 0, cy = 0

  commands.forEach(cmd => {
    const type = cmd[0]
    const isRel = type === type.toLowerCase() && type.toLowerCase() !== 'z'
    const args = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number)

    switch (type.toUpperCase()) {
      case 'M':
        for (let i = 0; i < args.length; i += 2) {
          cx = isRel ? cx + args[i] : args[i]
          cy = isRel ? cy + args[i + 1] : args[i + 1]
          if (i === 0) path.moveTo(cx * scale, cy * scale)
          else path.lineTo(cx * scale, cy * scale)
        }
        break
      case 'L':
        for (let i = 0; i < args.length; i += 2) {
          cx = isRel ? cx + args[i] : args[i]
          cy = isRel ? cy + args[i + 1] : args[i + 1]
          path.lineTo(cx * scale, cy * scale)
        }
        break
      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          const cp1x = isRel ? cx + args[i] : args[i]
          const cp1y = isRel ? cy + args[i + 1] : args[i + 1]
          const cp2x = isRel ? cx + args[i + 2] : args[i + 2]
          const cp2y = isRel ? cy + args[i + 3] : args[i + 3]
          const ex = isRel ? cx + args[i + 4] : args[i + 4]
          const ey = isRel ? cy + args[i + 5] : args[i + 5]
          path.bezierCurveTo(cp1x * scale, cp1y * scale, cp2x * scale, cp2y * scale, ex * scale, ey * scale)
          cx = ex; cy = ey
        }
        break
      case 'S':
        for (let i = 0; i < args.length; i += 4) {
          const cp2x = isRel ? cx + args[i] : args[i]
          const cp2y = isRel ? cy + args[i + 1] : args[i + 1]
          const ex = isRel ? cx + args[i + 2] : args[i + 2]
          const ey = isRel ? cy + args[i + 3] : args[i + 3]
          path.bezierCurveTo(cx * scale, cy * scale, cp2x * scale, cp2y * scale, ex * scale, ey * scale)
          cx = ex; cy = ey
        }
        break
      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          const cpx = isRel ? cx + args[i] : args[i]
          const cpy = isRel ? cy + args[i + 1] : args[i + 1]
          const ex = isRel ? cx + args[i + 2] : args[i + 2]
          const ey = isRel ? cy + args[i + 3] : args[i + 3]
          path.quadraticCurveTo(cpx * scale, cpy * scale, ex * scale, ey * scale)
          cx = ex; cy = ey
        }
        break
      case 'Z':
        path.closePath()
        break
      default:
        break
    }
  })
  return path
}

function drawSVGPath(ctx, pathStr, canvasSize, color, lineWidth) {
  if (!pathStr) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const scale = canvasSize / 109
  const path2D = buildPath2D(pathStr, scale)
  ctx.stroke(path2D)
  ctx.restore()
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * KanjiCanvas - Drawing canvas with touch and mouse support
 * Uses HTML5 Canvas for maximum mobile compatibility
 *
 * Exposed ref methods: clear(), getStrokes(), updateStrokeColor(), redraw(), playAnimation()
 */
const KanjiCanvas = forwardRef(function KanjiCanvas(
  { size, guided, strokes: referenceStrokes, onStrokeComplete },
  ref
) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef([])
  const allUserStrokes = useRef([])
  const animFrameRef = useRef(null)
  const animTimeoutRef = useRef(null)

  // ─── Redraw ───────────────────────────────────────────────────────────────

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw guide strokes
    if (guided && referenceStrokes && referenceStrokes.length > 0) {
      referenceStrokes.forEach((stroke, idx) => {
        drawSVGPath(ctx, stroke.path, size, '#E5E7EB', 3)

        // Draw stroke order number at start point
        if (stroke.startPoint) {
          ctx.save()
          ctx.font = `bold ${Math.max(10, size * 0.035)}px sans-serif`
          ctx.fillStyle = '#9CA3AF'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(idx + 1), stroke.startPoint.x, stroke.startPoint.y - size * 0.025)
          ctx.restore()
        }
      })
    }

    // Redraw user strokes
    allUserStrokes.current.forEach(({ points, color }) => {
      if (points.length < 2) return
      drawUserPath(ctx, points, color || '#111827', 8)
    })
  }, [guided, referenceStrokes, size])

  // ─── Touch / Mouse handlers ───────────────────────────────────────────────

  const startDraw = useCallback((e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    const pos = getPos(e, canvas)
    currentStroke.current = [pos]
  }, [])

  const continueDraw = useCallback((e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    currentStroke.current.push(pos)

    // Draw the live stroke incrementally
    const pts = currentStroke.current
    if (pts.length >= 2) {
      ctx.save()
      ctx.strokeStyle = '#111827'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const pts = [...currentStroke.current]
    currentStroke.current = []

    if (pts.length < 2) return

    const strokeIndex = allUserStrokes.current.length
    allUserStrokes.current.push({ points: pts, color: '#111827' })

    if (onStrokeComplete) {
      onStrokeComplete(pts, strokeIndex)
    }
  }, [onStrokeComplete])

  // ─── Imperative API ───────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    clear() {
      allUserStrokes.current = []
      currentStroke.current = []
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      redrawAll()
    },

    getStrokes() {
      return allUserStrokes.current.map(s => s.points)
    },

    updateStrokeColor(index, color) {
      if (allUserStrokes.current[index]) {
        allUserStrokes.current[index].color = color
        redrawAll()
      }
    },

    redraw() {
      redrawAll()
    },

    playAnimation(strokesData, onDone) {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

      const canvas = canvasRef.current
      if (!canvas || !strokesData || strokesData.length === 0) {
        onDone && onDone()
        return
      }

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw guides behind animation
      if (guided && referenceStrokes && referenceStrokes.length > 0) {
        referenceStrokes.forEach(stroke => {
          drawSVGPath(ctx, stroke.path, size, '#E5E7EB', 3)
        })
      }

      let strokeIdx = 0
      const DURATION = 1000 // 1 second per stroke

      function animateStroke() {
        if (strokeIdx >= strokesData.length) {
          onDone && onDone()
          return
        }

        const stroke = strokesData[strokeIdx]
        const points = stroke.points || []
        if (points.length < 2) {
          strokeIdx++
          animTimeoutRef.current = setTimeout(animateStroke, 200)
          return
        }

        let ptIdx = 0
        const stepCount = points.length
        const interval = DURATION / stepCount

        function drawNextPoint() {
          if (ptIdx >= stepCount) {
            strokeIdx++
            animTimeoutRef.current = setTimeout(animateStroke, 200)
            return
          }

          if (ptIdx > 0) {
            ctx.save()
            ctx.strokeStyle = '#EF4444'
            ctx.lineWidth = 10
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            ctx.moveTo(points[ptIdx - 1].x, points[ptIdx - 1].y)
            ctx.lineTo(points[ptIdx].x, points[ptIdx].y)
            ctx.stroke()
            ctx.restore()
          }

          ptIdx++
          animFrameRef.current = requestAnimationFrame(() => {
            animTimeoutRef.current = setTimeout(drawNextPoint, interval)
          })
        }

        drawNextPoint()
      }

      animateStroke()
    },
  }), [redrawAll, guided, referenceStrokes, size])

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    redrawAll()
  }, [redrawAll])

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        touchAction: 'none',
        cursor: 'crosshair',
        display: 'block',
      }}
      className="rounded-xl border-2 border-gray-200 bg-white"
      onMouseDown={startDraw}
      onMouseMove={continueDraw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={continueDraw}
      onTouchEnd={endDraw}
    />
  )
})

export default KanjiCanvas
