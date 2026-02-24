import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function UserAvatar({ userId, size = 'md', showTooltip = true }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  // ✅ Get initials from name
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  // ✅ Generate consistent color based on userId
  const getBackgroundColor = () => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ]
    if (!userId) return 'bg-gray-400'
    const index = userId.charCodeAt(0) % colors.length
    return colors[index]
  }

  // ✅ Loading state
  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse border-2 border-white`} />
    )
  }

  const displayName = profile?.full_name || profile?.username || 'User'

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${getBackgroundColor()} text-white font-bold flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform`}
      title={showTooltip ? displayName : ''} // ✅ Conditional tooltip
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={displayName}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        getInitials()
      )}
    </div>
  )
}