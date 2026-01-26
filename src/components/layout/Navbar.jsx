import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="ml-3 text-xl font-bold">Finance Tracker</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center focus:outline-none"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white z-20">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm text-gray-500">Đăng nhập với</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}