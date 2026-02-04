import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react' // ✅ THÊM useState

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  
  // ✅ THÊM: State để track expanded menu
  const [expandedMenu, setExpandedMenu] = useState('financial') // default expand financial

  // ✅ THAY ĐỔI: Cấu trúc menu mới với submenu
  const menuSections = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      submenu: null // no submenu
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
        name: 'Payback', 
        path: '/payback', 
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
        }
      ]
    },
    {
      id: 'reports',
      name: 'Báo cáo',
      path: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      submenu: null
    }
  ]

  // ✅ Function để toggle submenu
  const toggleMenu = (menuId) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId)
  }

  // ✅ Function để check active state
  const isMenuActive = (section) => {
    if (section.path) {
      return location.pathname === section.path
    }
    if (section.submenu) {
      return section.submenu.some(item => location.pathname === item.path)
    }
    return false
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b-2 border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">Polaris</span>
        </div>

        {/* Close button (Mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* ✅ THAY ĐỔI: Navigation với submenu support */}
      <nav className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
        <div className="space-y-1">
          {menuSections.map((section) => {
            const isActive = isMenuActive(section)
            const hasSubmenu = section.submenu && section.submenu.length > 0
            const isExpanded = expandedMenu === section.id

            return (
              <div key={section.id}>
                {/* Main Menu Item */}
                {!hasSubmenu ? (
                  // ✅ Direct link (no submenu)
                  <Link
                    to={section.path}
                    onClick={onClose}
                    className={`flex items-center justify-between space-x-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {section.icon}
                      <span>{section.name}</span>
                    </div>
                  </Link>
                ) : (
                  // ✅ Menu with submenu (expandable)
                  <>
                    <button
                      onClick={() => toggleMenu(section.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-semibold ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {section.icon}
                        <span>{section.name}</span>
                      </div>
                      {/* Chevron icon */}
                      <svg 
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* ✅ Submenu Items */}
                    {isExpanded && (
                      <div className="mt-1 ml-4 space-y-1">
                        {section.submenu.map((item) => {
                          const isSubmenuActive = location.pathname === item.path
                          
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={onClose}
                              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                                isSubmenuActive
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              {item.icon}
                              <span>{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </div>
  )
}