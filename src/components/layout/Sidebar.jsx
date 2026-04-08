import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

export default function Sidebar({ isOpen, onClose, onToggle, darkMode = false }) {
  const location = useLocation()
  
  // ✅ FIX: Default to null (all collapsed)
  const [expandedMenu, setExpandedMenu] = useState(null) // ❌ WAS: 'financial'
  const prevPathname = useRef(location.pathname)

  // ✅ FIX: Auto-expand based on current route
  useEffect(() => {
    // Check which section current route belongs to
    if (location.pathname.startsWith('/goals')) {
      setExpandedMenu('goals')
    } else if (
      location.pathname.startsWith('/wallets') ||
      location.pathname.startsWith('/transactions') ||
      location.pathname.startsWith('/trades') ||
      location.pathname.startsWith('/a-better-day')
    ) {
      setExpandedMenu('financial')
    } else if (location.pathname.startsWith('/study')) {
      setExpandedMenu('study')
    } else if (location.pathname === '/dashboard') {
      setExpandedMenu(null) // Collapse all when on dashboard
    }
  }, []) // ✅ Only run on mount

  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname
      if (window.innerWidth < 1024 && isOpen) {
        onClose()
      }
    }
  }, [location.pathname, onClose, isOpen])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const menuSections = [
    {
      id: 'goals',
      name: 'Mục tiêu',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      submenu: [
        {
          name: 'Calendar',
          path: '/goals/calendar',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          name: 'All Goals',
          path: '/goals/list',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'financial',
      name: 'Tài chính',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      submenu: [
       { 
        name: 'Dashboard',
        path: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>)
        },
        {
          name: 'Ví',
          path: '/wallets',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        },
        {
          name: 'Giao dịch',
          path: '/transactions',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          name: 'Trades',
          path: '/trades',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        },
        {
          name: 'Kế hoạch Trade',
          path: '/trades/planning',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )
        },
        {
          name: 'A better day',
          path: '/a-better-day',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'study',
      name: 'Học tập',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      submenu: [
        {
          name: 'Kanji Group & Comparator',
          path: '/study/kanji',
          icon: <span className="text-base leading-none">🎌</span>
        },
        {
          name: 'Material Vault',
          path: '/study/materials',
          icon: <span className="text-base leading-none">📚</span>
        }
      ]
    },
  ]

  const isActiveRoute = (path) => {
    return location.pathname === path
  }

  // ✅ FIX: Check if ANY child route is active
  const hasActiveChild = (section) => {
    if (!section.submenu) return false
    return section.submenu.some(item => location.pathname.startsWith(item.path))
  }

  const toggleMenu = (menuId) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 ${
          darkMode
            ? 'bg-[#0b0e1a]/95 backdrop-blur-md border-r border-[#1e293b]'
            : 'bg-white border-r border-gray-200'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between px-4 py-5 border-b ${
            darkMode ? 'border-[#1e293b]' : 'border-gray-200'
          }`}>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⭐</span>
              </div>
              <span className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Polaris</span>
            </Link>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onToggle) {
                  onToggle()
                }
              }}
              className={`p-1.5 rounded-md transition-colors ${
                darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#1e293b]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Đóng menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {menuSections.map((section) => (
                <li key={section.id}>
                  {section.submenu ? (
                    <>
                      {/* Parent with submenu */}
                      <button
                        onClick={() => toggleMenu(section.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          expandedMenu === section.id
                            ? darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                            : hasActiveChild(section)
                            ? darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                            : darkMode ? 'text-gray-300 hover:bg-[#1e293b]' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span className="font-medium">{section.name}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedMenu === section.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Submenu */}
                      {expandedMenu === section.id && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {section.submenu.map((item) => (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                  isActiveRoute(item.path)
                                    ? darkMode ? 'bg-blue-500/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                                    : darkMode ? 'text-gray-400 hover:bg-[#1e293b] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                {item.icon}
                                <span>{item.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    /* Simple link without submenu */
                    <Link
                      to={section.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActiveRoute(section.path)
                          ? darkMode ? 'bg-blue-500/10 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                          : darkMode ? 'text-gray-300 hover:bg-[#1e293b]' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {section.icon}
                      <span className="font-medium">{section.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}