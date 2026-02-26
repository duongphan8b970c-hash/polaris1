import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  // ✅ Default to true on desktop, false on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  // ✅ Persist sidebar state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) {
      setSidebarOpen(JSON.parse(saved))
    }
  }, [])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    localStorage.setItem('sidebarOpen', 'false')
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
    localStorage.setItem('sidebarOpen', (!sidebarOpen).toString())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleCloseSidebar}
          onToggle={handleToggleSidebar} // ✅ Pass toggle function
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={handleToggleSidebar} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}