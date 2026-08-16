import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      navigate('/reports')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* ✅ FULLSCREEN VIDEO BACKGROUND */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40"></div>

      {/* ✅ FLOATING LOGIN CARD */}
      <div className="relative z-10 min-h-screen flex items-end md:items-center justify-center md:justify-end p-4 md:p-8 lg:p-12">
        
        {/* Floating Card with Water Effect */}
        <div className="floating-card w-full max-w-md md:max-w-sm">
          
          {/* Glass Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10 relative overflow-hidden">
            
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-50 shine-effect"></div>
            
            {/* Ripple effect overlay */}
            <div className="absolute inset-0 ripple-effect opacity-30"></div>

            {/* Content */}
            <div className="relative z-10">
              
              {/* App Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  私たちの銀河
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-white/50 group-focus-within:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 focus:bg-white/15 transition-all backdrop-blur-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-white/50 group-focus-within:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 focus:bg-white/15 transition-all backdrop-blur-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-sm animate-shake">
                    <p className="text-sm text-white flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang đăng nhập...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Đăng nhập
                      </span>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
