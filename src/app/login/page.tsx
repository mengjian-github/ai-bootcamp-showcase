'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    planetNumber: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center hero-section">
      <div className="max-w-md w-full form-section">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">欢迎回来</h1>
          <p className="text-gray-600">
            还没有账号？{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              立即注册
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">
              🌟 星球编号
            </label>
            <input
              type="text"
              required
              placeholder="请输入纯数字星球编号，例如：001"
              className="form-input"
              value={formData.planetNumber}
              onChange={(e) => setFormData({ ...formData, planetNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">
              🔐 密码
            </label>
            <input
              type="password"
              required
              placeholder="请输入密码"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                登录中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                ✨ 登录
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="btn-secondary">
            🏠 返回首页
          </a>
        </div>
      </div>
    </div>
  )
}