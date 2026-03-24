import { useState, useRef, useEffect, useCallback } from 'react'
import KanjiCanvas from './KanjiCanvas'
import useKanjiStrokes from '../../hooks/study/useKanjiStrokes'
import useKanjiPractice from '../../hooks/study/useKanjiPractice'
import { validateStroke } from '../../utils/strokeRecognition'
import { calculateScore } from '../../utils/kanjiPracticeScore'

function StarDisplay({ count }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map(n => (
        <svg
          key={n}
          className={`w-10 h-10 ${n <= count ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ScoreModal({ result, onTryAgain, onClose }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10">
      <div className="bg-white rounded-2xl p-8 mx-4 text-center shadow-2xl max-w-sm w-full animate-bounce-once">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Kết quả luyện tập</h2>

        <div className="mb-4">
          <StarDisplay count={result.stars} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-600">{result.total}</div>
            <div className="text-xs text-gray-500 mt-1">Điểm</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-600">{result.accuracy}%</div>
            <div className="text-xs text-gray-500 mt-1">Chính xác</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-purple-600">{result.timeSpent}s</div>
            <div className="text-xs text-gray-500 mt-1">Thời gian</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onTryAgain}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KanjiWritingPractice({ kanji, onClose }) {
  const canvasSize = Math.min(
    typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.85, window.innerHeight * 0.5) : 400,
    480
  )

  const [guided, setGuided] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [feedbackColor, setFeedbackColor] = useState('text-gray-600')
  const [correctCount, setCorrectCount] = useState(0)
  const [scoreResult, setScoreResult] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const canvasRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  const strokeResultsRef = useRef([]) // { isCorrect, accuracy } per stroke

  const { strokes, totalStrokes, loading, error, refetch } = useKanjiStrokes(kanji, canvasSize)
  const { savePracticeSession } = useKanjiPractice()

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const reset = useCallback(() => {
    setFeedback('')
    setFeedbackColor('text-gray-600')
    setCorrectCount(0)
    setScoreResult(null)
    strokeResultsRef.current = []
    startTimeRef.current = Date.now()
    canvasRef.current?.clear()
  }, [])

  const handleStrokeComplete = useCallback(
    (points, strokeIndex) => {
      if (totalStrokes === 0 || strokes.length === 0) return

      const correctStroke = strokes[strokeIndex]
      if (!correctStroke) return

      const result = validateStroke(points, correctStroke, canvasSize)
      strokeResultsRef.current[strokeIndex] = result

      const color = result.isCorrect ? '#10B981' : '#EF4444'
      canvasRef.current?.updateStrokeColor(strokeIndex, color)

      setFeedback(result.feedback)
      setFeedbackColor(result.isCorrect ? 'text-green-600' : 'text-red-600')

      const newCorrectCount = strokeResultsRef.current.filter(r => r?.isCorrect).length
      setCorrectCount(newCorrectCount)

      // Check completion after a brief pause
      const drawnCount = strokeResultsRef.current.filter(Boolean).length
      if (drawnCount >= totalStrokes) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
        const score = calculateScore(newCorrectCount, totalStrokes, timeSpent)
        setScoreResult(score)
        savePracticeSession({
          kanji,
          mode: guided ? 'guided' : 'free',
          ...score,
        })
      }
    },
    [strokes, totalStrokes, canvasSize, guided, kanji, savePracticeSession]
  )

  const handleShowAnimation = useCallback(() => {
    if (!strokes || strokes.length === 0) return
    setIsAnimating(true)
    canvasRef.current?.clear()
    canvasRef.current?.playAnimation(strokes, () => setIsAnimating(false))
  }, [strokes])

  const handleCheck = useCallback(() => {
    if (!canvasRef.current || totalStrokes === 0) return
    const userStrokes = canvasRef.current.getStrokes()

    let correct = 0
    userStrokes.forEach((pts, idx) => {
      if (!strokes[idx]) return
      const result = validateStroke(pts, strokes[idx], canvasSize)
      strokeResultsRef.current[idx] = result
      canvasRef.current?.updateStrokeColor(idx, result.isCorrect ? '#10B981' : '#EF4444')
      if (result.isCorrect) correct++
    })

    setCorrectCount(correct)
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    if (userStrokes.length > 0) {
      const lastResult = strokeResultsRef.current[userStrokes.length - 1]
      setFeedback(lastResult?.feedback || '')
      setFeedbackColor(lastResult?.isCorrect ? 'text-green-600' : 'text-red-600')
    }

    if (userStrokes.length >= totalStrokes) {
      const score = calculateScore(correct, totalStrokes, timeSpent)
      setScoreResult(score)
      savePracticeSession({ kanji, mode: guided ? 'guided' : 'free', ...score })
    }
  }, [strokes, totalStrokes, canvasSize, guided, kanji, savePracticeSession])

  const progressPercent = totalStrokes > 0 ? Math.round((correctCount / totalStrokes) * 100) : 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Luyện viết kanji ${kanji}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg mx-3 overflow-hidden flex flex-col"
        style={{ maxHeight: '96vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-5xl font-serif leading-none">{kanji}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">Luyện viết Kanji</div>
              <div className="text-xs text-gray-500">
                {totalStrokes > 0 ? `${totalStrokes} nét` : loading ? 'Đang tải...' : 'Không có dữ liệu'}
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">{guided ? 'Có gợi ý' : 'Tự do'}</span>
            <button
              onClick={() => {
                setGuided(g => !g)
                reset()
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                guided ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle guided mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  guided ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalStrokes > 0 && (
          <div className="px-5 py-2 bg-white border-b border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{correctCount}/{totalStrokes} nét đúng</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang tải dữ liệu nét...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-center p-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="relative" style={{ touchAction: 'none' }}>
              <KanjiCanvas
                ref={canvasRef}
                size={canvasSize}
                guided={guided}
                strokes={strokes}
                onStrokeComplete={handleStrokeComplete}
              />
              {scoreResult && (
                <ScoreModal
                  result={scoreResult}
                  onTryAgain={reset}
                  onClose={onClose}
                />
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && !scoreResult && (
          <div className={`px-5 py-2 text-sm font-medium text-center ${feedbackColor}`}>
            {feedback}
          </div>
        )}

        {/* Control buttons */}
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={reset}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-xs font-medium min-h-[52px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa
            </button>

            <button
              onClick={handleShowAnimation}
              disabled={isAnimating || loading || !!error || totalStrokes === 0}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors text-xs font-medium min-h-[52px] disabled:opacity-50"
            >
              {isAnimating ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Xem nét
            </button>

            <button
              onClick={handleCheck}
              disabled={loading || !!error || totalStrokes === 0}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors text-xs font-medium min-h-[52px] disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Kiểm tra
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors text-xs font-medium min-h-[52px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
