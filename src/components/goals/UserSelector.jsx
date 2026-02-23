import { useState, useRef, useEffect } from 'react'
import { useUsers } from '../../hooks/useUsers'
import UserAvatar from '../common/UserAvatar'

export default function UserSelector({ 
  selectedUserIds = [], 
  onChange, 
  label = 'Assign to',
  placeholder = 'Select users...',
  disabled = false 
}) {
  const { users, loading } = useUsers()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleUser = (userId) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId]
    onChange(newSelection)
  }

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id))
  
  // Filter users by search term
  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Selected users display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedUsers.length > 0 ? (
              <>
                {selectedUsers.slice(0, 3).map(user => (
                  <div key={user.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-1 pr-2 py-0.5">
                    <UserAvatar userId={user.id} size="xs" showTooltip={false} />
                    <span className="text-xs text-gray-700">
                      {user.full_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                ))}
                {selectedUsers.length > 3 && (
                  <span className="text-sm text-gray-600">
                    +{selectedUsers.length - 3} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Users list */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No users found
              </div>
            ) : (
              <div className="py-1">
                {filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id)
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <UserAvatar userId={user.id} size="sm" showTooltip={false} />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}