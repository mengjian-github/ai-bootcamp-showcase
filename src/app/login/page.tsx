'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Lock, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    planetNumber: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // 触发自定义事件通知其他组件登录状态改变
        window.dispatchEvent(new CustomEvent('loginSuccess'))

        toast.success(`欢迎回来，${data.user.nickname}！🎉`)

        // 根据用户角色跳转
        setTimeout(() => {
          if (data.user.role === 'ADMIN') {
            router.push('/admin')
          } else {
            router.push('/')
          }
        }, 1500)
      } else {
        setError(data.message || '登录失败')
        toast.error(data.message || '登录失败，请检查用户名和密码')
      }
    } catch (error) {
      setError('登录失败，请重试')
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-3xl font-bold text-white">欢迎回来</h1>
            <div className="w-16" />
          </div>

          {/* 注册链接 */}
          <div className="text-center mb-8">
            <p className="text-white/70">
              还没有账号？{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-white hover:text-purple-300 font-medium transition-colors"
              >
                立即注册
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 星球编号 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Star className="w-5 h-5 inline mr-2" />
                星球编号
              </label>
              <input
                type="text"
                name="planetNumber"
                value={formData.planetNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="请输入纯数字星球编号，例如：001"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Lock className="w-5 h-5 inline mr-2" />
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="请输入密码"
              />
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    登录
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}