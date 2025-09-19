'use client'

import { useState } from 'react'

// 模拟数据
const mockBootcamps = [
  {
    id: '1',
    name: '行动家AI编程加强营',
    description: '深度学习AI编程技能',
    projectCount: 12
  },
  {
    id: '2',
    name: 'AI编程出海工具训练营',
    description: '打造国际化AI工具',
    projectCount: 8
  }
]

const mockProjects = [
  {
    id: '1',
    title: 'AI智能客服系统',
    description: '基于大语言模型的智能客服解决方案',
    author: {
      nickname: '张三',
      planetNumber: 'P001',
      role: '行动家'
    },
    bootcamp: '行动家AI编程加强营',
    coverImage: '/placeholder-cover.jpg',
    voteCount: 15,
    type: 'LINK',
    projectUrl: 'https://example.com'
  },
  {
    id: '2',
    title: '智能文档生成器',
    description: '自动生成各类技术文档的AI工具',
    author: {
      nickname: '李四',
      planetNumber: 'P002',
      role: '圈友'
    },
    bootcamp: 'AI编程出海工具训练营',
    coverImage: '/placeholder-cover.jpg',
    voteCount: 12,
    type: 'HTML_FILE'
  }
]

export default function Home() {
  const [selectedBootcamp, setSelectedBootcamp] = useState<string>('all')

  const filteredProjects = selectedBootcamp === 'all'
    ? mockProjects
    : mockProjects.filter(p => p.bootcamp === selectedBootcamp)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 训练营选择器 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">选择训练营</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedBootcamp('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedBootcamp === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部作品
          </button>
          {mockBootcamps.map(bootcamp => (
            <button
              key={bootcamp.id}
              onClick={() => setSelectedBootcamp(bootcamp.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedBootcamp === bootcamp.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {bootcamp.name} ({bootcamp.projectCount})
            </button>
          ))}
        </div>
      </div>

      {/* 作品展示区 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {selectedBootcamp === 'all' ? '全部作品' : selectedBootcamp}
        </h3>
        <p className="text-gray-600">
          共 {filteredProjects.length} 个作品，按投票数排序
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="card hover:shadow-lg transition-shadow">
            {/* 封面图 */}
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">封面图 800x600</span>
            </div>

            {/* 作品信息 */}
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {project.title}
            </h4>
            <p className="text-gray-600 text-sm mb-3">
              {project.description}
            </p>

            {/* 作者信息 */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500">
                <span className="font-medium">{project.author.nickname}</span>
                <span className="mx-1">·</span>
                <span>{project.author.planetNumber}</span>
                <span className="mx-1">·</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {project.author.role}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <button className="btn-primary text-sm">
                查看作品
              </button>
              <div className="flex items-center space-x-2">
                <button className="text-gray-500 hover:text-red-500 transition-colors">
                  ❤️ {project.voteCount}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无作品</p>
        </div>
      )}
    </div>
  )
}