'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, Upload, LogOut } from 'lucide-react'

interface UserData {
  id: string
  nickname: string
  planetNumber: string
  role: string
}

export default function Navigation() {
  const [user, setUser] = useState<UserData | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    // 初始检查
    checkAuthStatus()

    // 监听storage事件（当localStorage在其他标签页改变时触发）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuthStatus()
      }
    }

    // 监听窗口焦点事件（当用户切换回这个标签页时检查）
    const handleFocus = () => {
      checkAuthStatus()
    }

    // 监听自定义登录事件
    const handleLoginSuccess = () => {
      checkAuthStatus()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('loginSuccess', handleLoginSuccess)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('loginSuccess', handleLoginSuccess)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="bg-slate-950/90 backdrop-blur-xl shadow-[0_12px_30px_rgba(2,6,23,0.6)] border-b border-cyan-500/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="破局黑客松AI编程大赛"
                className="h-16 w-auto object-contain max-w-32"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-fuchsia-400 transition-all duration-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                破局黑客松AI编程大赛
              </span>
            </motion.a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-cyan-500/20 transition-all duration-300 shadow-[0_8px_24px_rgba(2,6,23,0.55)]"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.45)]">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-100">{user.nickname}</div>
                    <div className="text-xs text-slate-400">{user.planetNumber}</div>
                  </div>
                  <motion.svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: showDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-64 bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_rgba(2,6,23,0.7)] border border-cyan-500/15 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-800/60">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.35)]">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{user.nickname}</p>
                            <p className="text-xs text-slate-400">星球编号: {user.planetNumber}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <motion.a
                          href="/profile"
                          whileHover={{ backgroundColor: "rgba(34, 211, 238, 0.08)" }}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-200 transition-colors"
                        >
                          <User className="w-4 h-4 text-cyan-400" />
                          <span>个人中心</span>
                        </motion.a>
                        <motion.a
                          href="/upload"
                          whileHover={{ backgroundColor: "rgba(34, 211, 238, 0.08)" }}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-200 transition-colors"
                        >
                          <Upload className="w-4 h-4 text-emerald-400" />
                          <span>上传作品</span>
                        </motion.a>
                        {user.role === 'ADMIN' && (
                          <motion.a
                            href="/admin"
                            whileHover={{ backgroundColor: "rgba(34, 211, 238, 0.08)" }}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-200 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-violet-400" />
                            <span>管理后台</span>
                          </motion.a>
                        )}
                      </div>

                      <div className="border-t border-slate-800/60 pt-2">
                        <motion.button
                          onClick={handleLogout}
                          whileHover={{ backgroundColor: "rgba(248, 113, 113, 0.12)" }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-rose-400 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>退出登录</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <motion.a
                  href="/login"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                >
                  登录
                </motion.a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 点击其他地方关闭下拉菜单 */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  )
}
