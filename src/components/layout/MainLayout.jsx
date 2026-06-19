import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { TradeDarkModeProvider, useTradeDarkMode } from '../../hooks/useTradeDarkMode'

function MainLayoutInner() {
  const location = useLocation()
  const mainContentRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) return JSON.parse(saved)
    return window.innerWidth >= 1024
  })
  const { darkMode, setDarkMode } = useTradeDarkMode()

  // Auto-enable dark mode on /trades, auto-disable when leaving
  useEffect(() => {
    const isTradesPage = location.pathname === '/trades'
    if (!isTradesPage && darkMode) {
      setDarkMode(false)
    }
  }, [location.pathname, darkMode, setDarkMode])

  // ✅ Auto-close on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    localStorage.setItem('sidebarOpen', 'false')
  }

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    localStorage.setItem('sidebarOpen', JSON.stringify(newState))
  }

  useEffect(() => {
    const mainContent = mainContentRef.current
    if (!mainContent) return

    const handleScroll = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        handleCloseSidebar()
      }
    }

    mainContent.addEventListener('scroll', handleScroll)

    return () => {
      mainContent.removeEventListener('scroll', handleScroll)
    }
  }, [sidebarOpen])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0b0e1a]' : 'bg-gray-50'}`}>
      {/* Night sky stars overlay */}
      {darkMode && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="night-sky-stars" />
        </div>
      )}

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleCloseSidebar}
          onToggle={handleToggleSidebar}
          darkMode={darkMode}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={handleToggleSidebar} darkMode={darkMode} />
          
          <main 
            ref={mainContentRef}
            className={`flex-1 overflow-y-auto p-3 md:p-4 lg:p-5 transition-colors duration-300 ${
              darkMode ? 'text-gray-100' : ''
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default function MainLayout() {
  return (
    <TradeDarkModeProvider>
      <MainLayoutInner />
    </TradeDarkModeProvider>
  )
}