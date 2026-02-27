import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ✅ Initialize sidebar state on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) {
      setSidebarOpen(JSON.parse(saved))
    } else {
      // Default: open on desktop
      setSidebarOpen(window.innerWidth >= 1024)
    }
  }, [])

  // ✅ Auto-close on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  useEffect(() => {
    const mainContent = mainContentRef.current
    if (!mainContent) return

    const handleScroll = () => {
      // Chỉ đóng sidebar khi:
      // 1. Đang ở desktop (>= 1024px)
      // 2. Sidebar đang mở
      if (window.innerWidth >= 1024 && sidebarOpen) {
        handleCloseSidebar()
      }
    }

    // Thêm scroll listener
    mainContent.addEventListener('scroll', handleScroll)

    // Cleanup
    return () => {
      mainContent.removeEventListener('scroll', handleScroll)
    }
  }, [sidebarOpen])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    localStorage.setItem('sidebarOpen', 'false')
  }

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    localStorage.setItem('sidebarOpen', JSON.stringify(newState))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleCloseSidebar}
          onToggle={handleToggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={handleToggleSidebar} />
          
          <main 
            ref={mainContentRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}