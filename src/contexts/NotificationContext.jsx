import { createContext, useContext, useState, useCallback } from 'react'
import NotificationToast from '../components/common/NotificationToast'

const NotificationContext = createContext(null)

let notificationId = 0

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = ++notificationId
    setNotifications(prev => [...prev, { id, type, title, message }])

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notifyBudgetExceeded = useCallback((categoryName, spent, limit) => {
    addNotification({
      type: 'error',
      title: '🚨 Vượt hạn mức ngân sách!',
      message: `Danh mục "${categoryName}" đã vượt hạn mức. Chi tiêu: ${spent.toLocaleString('vi-VN')}₫ / Hạn mức: ${limit.toLocaleString('vi-VN')}₫`,
      duration: 8000,
    })
  }, [addNotification])

  const notifyBudgetWarning = useCallback((categoryName, percentage) => {
    addNotification({
      type: 'warning',
      title: '⚡ Gần đạt hạn mức!',
      message: `Danh mục "${categoryName}" đã sử dụng ${percentage.toFixed(0)}% ngân sách tháng này.`,
      duration: 6000,
    })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{ addNotification, dismissNotification, notifyBudgetExceeded, notifyBudgetWarning }}>
      {children}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
