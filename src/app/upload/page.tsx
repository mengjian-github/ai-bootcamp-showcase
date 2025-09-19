'use client'

import { useState } from 'react'

const USER_ROLES = [
  { value: 'COACH', label: '教练' },
  { value: 'ACTIONIST', label: '行动家' },
  { value: 'MEMBER', label: '圈友' },
  { value: 'VOLUNTEER', label: '志愿者' },
  { value: 'STAFF', label: '工作人员' },
]

const BOOTCAMPS = [
  { value: '1', label: '行动家AI编程加强营' },
  { value: '2', label: 'AI编程出海工具训练营' },
]

export default function UploadPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bootcampId: '',
    projectType: 'LINK' as 'LINK' | 'HTML_FILE',
    projectUrl: '',
    nickname: '',
    planetNumber: '',
    role: '',
    email: '',
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [htmlFile, setHtmlFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 实现上传逻辑
    console.log('提交表单:', formData, coverImage, htmlFile)
    alert('功能开发中...')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">上传作品</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 作品基本信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">作品信息</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作品标题 *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作品描述
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属训练营 *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.bootcampId}
                  onChange={(e) => setFormData({...formData, bootcampId: e.target.value})}
                >
                  <option value="">请选择训练营</option>
                  {BOOTCAMPS.map(bootcamp => (
                    <option key={bootcamp.value} value={bootcamp.value}>
                      {bootcamp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作品类型 *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="projectType"
                      value="LINK"
                      checked={formData.projectType === 'LINK'}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value as 'LINK'})}
                      className="mr-2"
                    />
                    作品链接
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="projectType"
                      value="HTML_FILE"
                      checked={formData.projectType === 'HTML_FILE'}
                      onChange={(e) => setFormData({...formData, projectType: e.target.value as 'HTML_FILE'})}
                      className="mr-2"
                    />
                    HTML文件上传
                  </label>
                </div>
              </div>

              {formData.projectType === 'LINK' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作品链接 *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.projectUrl}
                    onChange={(e) => setFormData({...formData, projectUrl: e.target.value})}
                  />
                </div>
              )}

              {formData.projectType === 'HTML_FILE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML文件 *
                  </label>
                  <input
                    type="file"
                    accept=".html,.htm"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    只支持HTML文件上传
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图片 *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  建议尺寸：800x600px，格式：JPG/PNG，大小不超过2MB
                </p>
              </div>
            </div>
          </div>

          {/* 学员信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">学员信息</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  昵称 *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  星球编号 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：P001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.planetNumber}
                  onChange={(e) => setFormData({...formData, planetNumber: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学员身份 *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="">请选择身份</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-between">
            <a href="/" className="btn-secondary">
              返回首页
            </a>
            <button type="submit" className="btn-primary">
              提交作品
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}