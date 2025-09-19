'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const USER_ROLES = [
  { value: 'COACH', label: '教练' },
  { value: 'ACTIONIST', label: '行动家' },
  { value: 'MEMBER', label: '圈友' },
  { value: 'VOLUNTEER', label: '志愿者' },
  { value: 'STAFF', label: '工作人员' },
]

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: '🌱 零基础小白', description: '刚接触编程，充满学习热情' },
  { value: 'INTERMEDIATE', label: '💪 有一定基础', description: '掌握基本编程概念，希望提升技能' },
  { value: 'ADVANCED', label: '🚀 专业程序员', description: '具备丰富编程经验，追求技术深度' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    planetNumber: '',
    role: '',
    skillLevel: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('密码确认不匹配，请重新输入')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          planetNumber: formData.planetNumber,
          role: formData.role,
          skillLevel: formData.skillLevel,
          email: formData.email || null,
          password: formData.password
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // 触发自定义事件通知其他组件登录状态改变
        window.dispatchEvent(new CustomEvent('loginSuccess'))

        toast.success('🎉 注册成功！欢迎加入AI编程训练营！')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.message || '注册失败，请重试')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-section flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">加入我们</h2>
          <p className="text-blue-100">
            已有账号？{' '}
            <a href="/login" className="text-white hover:text-blue-200 font-semibold transition-colors">
              点击登录
            </a>
          </p>
        </div>

        <div className="form-section">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">
                👤 昵称 *
              </label>
              <input
                type="text"
                required
                placeholder="输入你的昵称"
                className="form-input"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label">
                🌟 星球编号 *
              </label>
              <input
                type="text"
                required
                placeholder="请输入纯数字，例如：001"
                className="form-input"
                value={formData.planetNumber}
                onChange={(e) => setFormData({...formData, planetNumber: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label">
                🎯 学员身份 *
              </label>
              <div className="select-wrapper">
                <select
                  required
                  className="enhanced-select"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  onFocus={(e) => e.target.parentElement.classList.add('focused')}
                  onBlur={(e) => e.target.parentElement.classList.remove('focused')}
                >
                  <option value="">请选择身份</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">
                📊 技术水平 *
              </label>
              <div className="select-wrapper">
                <select
                  required
                  className="enhanced-select"
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                  onFocus={(e) => e.target.parentElement.classList.add('focused')}
                  onBlur={(e) => e.target.parentElement.classList.remove('focused')}
                >
                  <option value="">请选择技术水平</option>
                  {SKILL_LEVELS.map(level => (
                    <option key={level.value} value={level.value} title={level.description}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.skillLevel && SKILL_LEVELS.find(l => l.value === formData.skillLevel)?.description}
              </p>
            </div>

            <div>
              <label className="form-label">
                📧 邮箱（可选）
              </label>
              <input
                type="email"
                placeholder="输入你的邮箱地址"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label">
                🔐 密码 *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="设置密码（至少6位）"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label">
                🔒 确认密码 *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="再次输入密码"
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 btn-secondary"
              >
                🏠 返回首页
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    注册中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    ✨ 注册
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}