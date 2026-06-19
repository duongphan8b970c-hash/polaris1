import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Header({ onMenuClick, darkMode = false }) {
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [user, setUser] = useState(null)

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className={`h-12 md:h-14 px-3 md:px-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300 ${
      darkMode
        ? 'bg-[#0b0e1a]/90 backdrop-blur-md border-b border-[#1e293b]'
        : 'bg-white border-b border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        {/* ✅ Menu Button - SHOW ON ALL SCREENS */}
        <button
          onClick={onMenuClick}
          className={`p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-[#1e293b] text-gray-300' : 'hover:bg-gray-100'
          }`}
          aria-label="Toggle menu"
          title="Mở/Đóng menu"
        >
          <svg className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page Title (optional) */}
        <h1 className={`hidden md:block text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Polaris 
        </h1>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-[#1e293b]' : 'hover:bg-gray-100'
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showUserMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowUserMenu(false)}
            />
            <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 z-20 ${
              darkMode
                ? 'bg-[#111827] border border-[#1e293b]'
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user?.email?.split('@')[0]}</p>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
              </div>
              
              <button
                onClick={() => {
                  navigate('/profile')
                  setShowUserMenu(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                  darkMode ? 'text-gray-300 hover:bg-[#1e293b]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>

              <button
                onClick={handleLogout}
                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                  darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}