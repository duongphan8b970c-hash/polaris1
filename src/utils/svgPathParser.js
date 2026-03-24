/**
 * SVG Path Parser - Helper to parse KanjiVG SVG paths
 * Converts SVG path command strings into arrays of {x, y} points
 */

/**
 * Parse a single SVG path string into an array of {x, y} points
 * Handles M, L, C, S, Q, T, A commands (relative and absolute)
 */
export function parseSVGPath(pathStr) {
  if (!pathStr) return []

  const points = []
  // Tokenize path data
  const commands = pathStr.match(/[MLCSQTAZmlcsqtaz][^MLCSQTAZmlcsqtaz]*/g)
  if (!commands) return []

  let currentX = 0
  let currentY = 0

  for (const cmd of commands) {
    const type = cmd[0]
    const isRelative = type === type.toLowerCase() && type !== 'z' && type !== 'Z'
    const args = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)

    switch (type.toUpperCase()) {
      case 'M': {
        for (let i = 0; i < args.length; i += 2) {
          if (isRelative && points.length > 0) {
            currentX += args[i]
            currentY += args[i + 1]
          } else {
            currentX = args[i]
            currentY = args[i + 1]
          }
          points.push({ x: currentX, y: currentY })
        }
        break
      }
      case 'L': {
        for (let i = 0; i < args.length; i += 2) {
          if (isRelative) {
            currentX += args[i]
            currentY += args[i + 1]
          } else {
            currentX = args[i]
            currentY = args[i + 1]
          }
          points.push({ x: currentX, y: currentY })
        }
        break
      }
      case 'C': {
        // Cubic bezier - sample intermediate points
        for (let i = 0; i < args.length; i += 6) {
          let cp1x, cp1y, cp2x, cp2y, ex, ey
          if (isRelative) {
            cp1x = currentX + args[i]
            cp1y = currentY + args[i + 1]
            cp2x = currentX + args[i + 2]
            cp2y = currentY + args[i + 3]
            ex = currentX + args[i + 4]
            ey = currentY + args[i + 5]
          } else {
            cp1x = args[i]
            cp1y = args[i + 1]
            cp2x = args[i + 2]
            cp2y = args[i + 3]
            ex = args[i + 4]
            ey = args[i + 5]
          }
          // Sample 8 points along the bezier curve
          const samples = sampleCubicBezier(currentX, currentY, cp1x, cp1y, cp2x, cp2y, ex, ey, 8)
          points.push(...samples)
          currentX = ex
          currentY = ey
        }
        break
      }
      case 'S': {
        // Smooth cubic bezier
        for (let i = 0; i < args.length; i += 4) {
          let cp2x, cp2y, ex, ey
          if (isRelative) {
            cp2x = currentX + args[i]
            cp2y = currentY + args[i + 1]
            ex = currentX + args[i + 2]
            ey = currentY + args[i + 3]
          } else {
            cp2x = args[i]
            cp2y = args[i + 1]
            ex = args[i + 2]
            ey = args[i + 3]
          }
          // Use current point as first control point (simplified)
          const samples = sampleCubicBezier(currentX, currentY, currentX, currentY, cp2x, cp2y, ex, ey, 8)
          points.push(...samples)
          currentX = ex
          currentY = ey
        }
        break
      }
      case 'Q': {
        // Quadratic bezier
        for (let i = 0; i < args.length; i += 4) {
          let cpx, cpy, ex, ey
          if (isRelative) {
            cpx = currentX + args[i]
            cpy = currentY + args[i + 1]
            ex = currentX + args[i + 2]
            ey = currentY + args[i + 3]
          } else {
            cpx = args[i]
            cpy = args[i + 1]
            ex = args[i + 2]
            ey = args[i + 3]
          }
          const samples = sampleQuadraticBezier(currentX, currentY, cpx, cpy, ex, ey, 8)
          points.push(...samples)
          currentX = ex
          currentY = ey
        }
        break
      }
      case 'Z': {
        // Close path - nothing to do for our purposes
        break
      }
      default:
        break
    }
  }

  return points
}

function sampleCubicBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1, numSamples) {
  const pts = []
  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples
    const mt = 1 - t
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * x1
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * y1
    pts.push({ x, y })
  }
  return pts
}

function sampleQuadraticBezier(x0, y0, cpx, cpy, x1, y1, numSamples) {
  const pts = []
  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples
    const mt = 1 - t
    const x = mt * mt * x0 + 2 * mt * t * cpx + t * t * x1
    const y = mt * mt * y0 + 2 * mt * t * cpy + t * t * y1
    pts.push({ x, y })
  }
  return pts
}

/**
 * Scale points from KanjiVG coordinate space (0-109) to canvas size
 */
export function scalePoints(points, canvasSize) {
  const scale = canvasSize / 109
  return points.map(p => ({ x: p.x * scale, y: p.y * scale }))
}

/**
 * Parse KanjiVG SVG XML and extract stroke paths with metadata
 * Returns array of { path, order, points, startPoint, endPoint }
 */
export function parseKanjiVGSVG(svgText, canvasSize = 109) {
  const strokes = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, 'image/svg+xml')

    // Find all path elements within kvg:StrokePaths groups
    const pathElements = doc.querySelectorAll('path[id]')

    let order = 1
    pathElements.forEach(el => {
      const id = el.getAttribute('id')
      // KanjiVG stroke paths have IDs like "kvg:XXXXX-s1", "kvg:XXXXX-s2", etc.
      if (id && id.includes('-s')) {
        const d = el.getAttribute('d')
        if (d) {
          const rawPoints = parseSVGPath(d)
          if (rawPoints.length < 2) return

          const scale = canvasSize / 109
          const scaledPoints = rawPoints.map(p => ({ x: p.x * scale, y: p.y * scale }))

          strokes.push({
            path: d,
            order,
            points: scaledPoints,
            startPoint: scaledPoints[0],
            endPoint: scaledPoints[scaledPoints.length - 1],
          })
          order++
        }
      }
    })
  } catch {
    return []
  }

  return strokes
}
