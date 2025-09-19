'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const USER_ROLES = [
  { value: 'COACH', label: '教练' },
  { value: 'ACTIONIST', label: '行动家' },
  { value: 'MEMBER', label: '圈友' },
  { value: 'VOLUNTEER', label: '志愿者' },
  { value: 'STAFF', label: '工作人员' },
]

interface Bootcamp {
  id: string
  name: string
}

export default function UploadPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bootcampId: '',
    projectType: 'LINK' as 'LINK' | 'HTML_FILE',
    projectUrl: '',
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [htmlFile, setHtmlFile] = useState<File | null>(null)

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      window.location.href = '/login'
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      window.location.href = '/login'
      return
    }

    fetchBootcamps()
  }, [])

  const fetchBootcamps = async () => {
    try {
      const response = await fetch('/api/bootcamps')
      const data = await response.json()
      setBootcamps(data)
    } catch (error) {
      console.error('Error fetching bootcamps:', error)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    const result = await response.json()
    return result.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!coverImage) {
        toast.error('请上传封面图片')
        return
      }

      const coverImagePath = await uploadFile(coverImage)
      let htmlFilePath = null

      if (formData.projectType === 'HTML_FILE' && htmlFile) {
        htmlFilePath = await uploadFile(htmlFile)
      }

      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.projectType,
          htmlFile: htmlFilePath,
          projectUrl: formData.projectType === 'LINK' ? formData.projectUrl : null,
          coverImage: coverImagePath,
          bootcampId: formData.bootcampId
        })
      })

      if (projectResponse.ok) {
        toast.success('🎉 作品提交成功！\n等待审核后将在首页展示。', {
          duration: 5000,
        })
        setFormData({
          title: '',
          description: '',
          bootcampId: '',
          projectType: 'LINK',
          projectUrl: '',
        })
        setCoverImage(null)
        setHtmlFile(null)
      } else {
        const errorData = await projectResponse.json()
        toast.error(errorData.message || '提交失败，请重试')
        throw new Error(errorData.message || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error submitting project:', error)
      toast.error('提交失败，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            上传作品
          </h1>
          <p className="text-lg text-secondary">
            分享你的AI编程成果，让世界看到你的创意
          </p>
        </div>

        <div className="form-section">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              创作信息表单
            </h2>
            <p className="text-gray-600">分享你的作品，让创意闪闪发光✨</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 作品基本信息 */}
            <div className="form-section">
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></span>
                作品基本信息
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="form-label">
                    作品标题 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="输入你的创意作品标题..."
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="form-label">
                    作品描述
                  </label>
                  <textarea
                    rows={4}
                    placeholder="描述你的作品特色和创新点..."
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="form-label">
                    所属训练营 *
                  </label>
                  <div className="select-wrapper">
                    <select
                      required
                      className="enhanced-select"
                      value={formData.bootcampId}
                      onChange={(e) => setFormData({...formData, bootcampId: e.target.value})}
                      onFocus={(e) => e.target.parentElement.classList.add('focused')}
                      onBlur={(e) => e.target.parentElement.classList.remove('focused')}
                    >
                      <option value="">请选择训练营</option>
                      {bootcamps.map(bootcamp => (
                        <option key={bootcamp.id} value={bootcamp.id}>
                          {bootcamp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    作品类型 *
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-center p-4 rounded-xl border border-gray-200 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30 group">
                      <input
                        type="radio"
                        name="projectType"
                        value="LINK"
                        checked={formData.projectType === 'LINK'}
                        onChange={(e) => setFormData({...formData, projectType: e.target.value as 'LINK'})}
                        className="form-radio mr-4"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700">🔗 作品链接</span>
                        <p className="text-sm text-gray-500 mt-1">提供在线作品的链接地址</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 rounded-xl border border-gray-200 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30 group">
                      <input
                        type="radio"
                        name="projectType"
                        value="HTML_FILE"
                        checked={formData.projectType === 'HTML_FILE'}
                        onChange={(e) => setFormData({...formData, projectType: e.target.value as 'HTML_FILE'})}
                        className="form-radio mr-4"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700">📁 HTML文件上传</span>
                        <p className="text-sm text-gray-500 mt-1">上传本地HTML文件</p>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.projectType === 'LINK' && (
                  <div>
                    <label className="form-label">
                      作品链接 *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://your-awesome-project.com"
                      className="form-input"
                      value={formData.projectUrl}
                      onChange={(e) => setFormData({...formData, projectUrl: e.target.value})}
                    />
                  </div>
                )}

                {formData.projectType === 'HTML_FILE' && (
                  <div>
                    <label className="form-label">
                      HTML文件 *
                    </label>
                    <input
                      type="file"
                      accept=".html,.htm"
                      required
                      className="form-file"
                      onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      📝 只支持HTML文件上传，文件大小不超过10MB
                    </p>
                  </div>
                )}

                <div>
                  <label className="form-label">
                    封面图片 *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="form-file"
                    onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    🖼️ 建议尺寸：800x600px，格式：JPG/PNG/WebP，大小不超过2MB
                  </p>
                </div>
              </div>
            </div>

            {/* 提交者信息展示 */}
            {user && (
              <div className="form-section">
                <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></span>
                  提交者信息
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">昵称</label>
                    <div className="form-input bg-gray-50">{user.nickname}</div>
                  </div>

                  <div>
                    <label className="form-label">星球编号</label>
                    <div className="form-input bg-gray-50">{user.planetNumber}</div>
                  </div>

                  <div>
                    <label className="form-label">学员身份</label>
                    <div className="form-input bg-gray-50">
                      {USER_ROLES.find(r => r.value === user.role)?.label}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">邮箱</label>
                    <div className="form-input bg-gray-50">{user.email || '未设置'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-between items-center pt-8">
              <a href="/" className="btn-secondary">
                🏠 返回首页
              </a>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    提交中...
                  </span>
                ) : (
                  <span className="flex items-center">
                    ✨ 提交作品
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