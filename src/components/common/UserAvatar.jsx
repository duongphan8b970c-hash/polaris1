import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function UserAvatar({ userId, size = 'md', showTooltip = true }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    if (!userId) return
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, email')
      .eq('id', userId)
      .single()
    
    if (data) setProfile(data)
  }

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  // Generate color from userId
  const getColorFromId = (id) => {
    if (!id) return '#94a3b8'
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Get initials from name or email
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    if (profile?.email) {
      return profile.email.substring(0, 2).toUpperCase()
    }
    return '?'
  }

  const bgColor = getColorFromId(userId)
  const initials = getInitials()
  const displayName = profile?.full_name || profile?.email || 'Unknown User'

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${getBackgroundColor()} text-white font-bold flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform`}
      title={showTooltip ? displayName : ''} // ✅ Only show if prop is true
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