/**
 * Stroke Recognition Utility
 * Validates user-drawn strokes against KanjiVG reference strokes
 */

/**
 * Euclidean distance between two points
 */
export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Calculate the primary direction vector of a stroke path
 * Returns a normalized {x, y} vector
 */
export function calculateDirection(points) {
  if (!points || points.length < 2) return { x: 0, y: 0 }

  // Use first and last point for overall direction
  const start = points[0]
  const end = points[points.length - 1]
  const dx = end.x - start.x
  const dy = end.y - start.y
  const mag = Math.sqrt(dx * dx + dy * dy)

  if (mag < 0.001) return { x: 0, y: 0 }
  return { x: dx / mag, y: dy / mag }
}

/**
 * Cosine similarity between two direction vectors
 * Returns a value between -1 and 1 (1 = same direction)
 */
export function cosineSimilarity(vec1, vec2) {
  const dot = vec1.x * vec2.x + vec1.y * vec2.y
  const mag1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y)
  const mag2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y)

  if (mag1 < 0.001 || mag2 < 0.001) return 0
  return dot / (mag1 * mag2)
}

/**
 * Calculate total path length for an array of points
 */
export function calculatePathLength(points) {
  if (!points || points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i])
  }
  return total
}

/**
 * Subsample an array of points to at most maxPoints
 */
export function subsamplePoints(points, maxPoints = 100) {
  if (!points || points.length <= maxPoints) return points
  const result = []
  const step = points.length / maxPoints
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.floor(i * step)])
  }
  result.push(points[points.length - 1])
  return result
}

/**
 * Validate a user-drawn stroke against a reference stroke
 *
 * @param {Array<{x,y}>} userStroke - Array of points from user drawing
 * @param {Object} correctStroke - Reference stroke with startPoint, endPoint, points
 * @param {number} canvasSize - Current canvas size (for threshold scaling)
 * @returns {{ isCorrect: boolean, accuracy: number, feedback: string }}
 */
export function validateStroke(userStroke, correctStroke, canvasSize = 400) {
  if (!userStroke || userStroke.length < 2) {
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Nét vẽ quá ngắn. Hãy vẽ đầy đủ nét.',
    }
  }

  if (!correctStroke || !correctStroke.startPoint || !correctStroke.endPoint) {
    return { isCorrect: true, accuracy: 80, feedback: 'Nét vẽ được chấp nhận.' }
  }

  // Scale threshold proportionally to canvas size
  const threshold = canvasSize * 0.1 // 10% of canvas size

  const sampledUser = subsamplePoints(userStroke, 100)

  // 1. Check start point
  const startDist = distance(sampledUser[0], correctStroke.startPoint)
  if (startDist > threshold) {
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Điểm bắt đầu chưa đúng. Hãy bắt đầu gần điểm gợi ý hơn.',
    }
  }

  // 2. Check direction
  const userDirection = calculateDirection(sampledUser)
  const correctDirection = calculateDirection(correctStroke.points || [correctStroke.startPoint, correctStroke.endPoint])
  const dirSimilarity = cosineSimilarity(userDirection, correctDirection)

  if (dirSimilarity < 0.6) {
    return {
      isCorrect: false,
      accuracy: Math.max(0, Math.round(((dirSimilarity + 1) / 2) * 100)),
      feedback: 'Hướng nét vẽ chưa đúng. Hãy vẽ theo hướng gợi ý.',
    }
  }

  // 3. Check end point
  const endDist = distance(sampledUser[sampledUser.length - 1], correctStroke.endPoint)
  if (endDist > threshold * 1.5) {
    return {
      isCorrect: false,
      accuracy: Math.round(dirSimilarity * 100),
      feedback: 'Điểm kết thúc chưa chính xác.',
    }
  }

  // 4. Check length ratio
  const userLength = calculatePathLength(sampledUser)
  const correctLength = calculatePathLength(
    correctStroke.points || [correctStroke.startPoint, correctStroke.endPoint]
  )

  if (correctLength > 0) {
    const lengthRatio = userLength / correctLength
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      return {
        isCorrect: false,
        accuracy: 75,
        feedback: 'Độ dài nét chưa phù hợp.',
      }
    }
  }

  // All checks passed
  const endFactor = Math.max(0, 1 - endDist / (threshold * 1.5))
  const accuracy = Math.min(100, Math.round(dirSimilarity * 0.7 * 100 + endFactor * 30))
  return {
    isCorrect: true,
    accuracy,
    feedback: 'Tuyệt vời! Nét vẽ chính xác! ✨',
  }
}
