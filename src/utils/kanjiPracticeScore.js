/**
 * Kanji Practice Score / Gamification Utility
 */

/**
 * Get star rating based on accuracy ratio
 * @param {number} accuracy - 0.0 to 1.0
 */
export function getStars(accuracy) {
  if (accuracy >= 0.95) return 3
  if (accuracy >= 0.8) return 2
  if (accuracy >= 0.6) return 1
  return 0
}

/**
 * Calculate final score for a practice session
 *
 * @param {number} correctStrokes - Number of correctly drawn strokes
 * @param {number} totalStrokes - Total strokes in the kanji
 * @param {number} timeSpent - Time in seconds
 * @returns {{ total: number, accuracy: number, stars: number, timeSpent: number }}
 */
export function calculateScore(correctStrokes, totalStrokes, timeSpent) {
  if (totalStrokes === 0) {
    return { total: 0, accuracy: 0, stars: 0, timeSpent }
  }

  const accuracyRatio = correctStrokes / totalStrokes
  const accuracyBonus = accuracyRatio * 70 // max 70 points

  // Time bonus: faster = higher score (max 30 points)
  const avgTimePerStroke = timeSpent / totalStrokes
  let timeBonus = 0
  if (avgTimePerStroke < 3) timeBonus = 30
  else if (avgTimePerStroke < 5) timeBonus = 20
  else if (avgTimePerStroke < 8) timeBonus = 10

  return {
    total: Math.round(accuracyBonus + timeBonus),
    accuracy: Math.round(accuracyRatio * 100),
    stars: getStars(accuracyRatio),
    timeSpent,
  }
}
