'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface Bootcamp {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  _count: {
    projects: number
  }
}

interface Project {
  id: string
  title: string
  description: string | null
  type: 'LINK' | 'HTML_FILE'
  projectUrl: string | null
  htmlFile: string | null
  coverImage: string
  voteCount: number
  isApproved: boolean
  createdAt: string
  author: {
    id: string
    nickname: string
    planetNumber: string
    role: string
    avatar: string | null
  }
  bootcamp: {
    id: string
    name: string
  }
}

interface User {
  id: string
  nickname: string
  planetNumber: string
  role: string
  avatar: string | null
  email: string | null
  createdAt: string
  _count: {
    projects: number
  }
  projects?: Array<{
    id: string
    title: string
    bootcamp: {
      id: string
      name: string
    }
  }>
}

export default function AdminPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBootcamp, setEditingBootcamp] = useState<Bootcamp | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'bootcamps' | 'projects' | 'users'>('bootcamps')
  const [currentProjectPage, setCurrentProjectPage] = useState(1)
  const projectsPerPage = 10
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const usersPerPage = 10
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // 筛选和搜索状态
  const [projectFilters, setProjectFilters] = useState({
    bootcampId: '',
    isApproved: '',
    type: '',
    search: ''
  })
  const [userFilters, setUserFilters] = useState({
    role: '',
    hasProjects: '',
    search: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true
  })
  const router = useRouter()

  // Excel导出功能
  const exportUsersToExcel = () => {
    // 准备Excel数据
    const excelData = filteredUsers.map(user => ({
      '用户昵称': user.nickname,
      '星球编号': user.planetNumber,
      '角色': user.role,
      '邮箱': user.email || '',
      '提交作品数': user._count?.projects || 0,
      '参与训练营': user.projects && user.projects.length > 0 ?
        Array.from(new Set(user.projects.map(p => p.bootcamp?.name))).join(', ') : '未参与',
      '作品列表': user.projects && user.projects.length > 0 ?
        user.projects.map(p => p.title).join('; ') : '无作品',
      '注册时间': new Date(user.createdAt).toLocaleDateString()
    }))

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表')

    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 用户昵称
      { wch: 15 }, // 星球编号
      { wch: 12 }, // 角色
      { wch: 25 }, // 邮箱
      { wch: 12 }, // 提交作品数
      { wch: 20 }, // 参与训练营
      { wch: 40 }, // 作品列表
      { wch: 15 }  // 注册时间
    ]
    worksheet['!cols'] = colWidths

    // 导出文件
    const fileName = `用户管理_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(workbook, fileName)
    toast.success('用户数据导出成功')
  }

  const exportProjectsToExcel = () => {
    // 准备Excel数据
    const excelData = filteredProjects.map(project => ({
      '作品标题': project.title,
      '作者昵称': project.author?.nickname || '',
      '作者星球编号': project.author?.planetNumber || '',
      '训练营': project.bootcamp?.name || '',
      '作品类型': project.type === 'LINK' ? '链接' : 'HTML文件',
      '项目链接': project.projectUrl || '',
      '上传时间': project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '',
      '审核状态': project.isApproved ? '已审核' : '待审核',
      '投票数': project.voteCount || 0,
      '作品描述': project.description || ''
    }))

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '作品列表')

    // 设置列宽
    const colWidths = [
      { wch: 25 }, // 作品标题
      { wch: 15 }, // 作者昵称
      { wch: 15 }, // 作者星球编号
      { wch: 20 }, // 训练营
      { wch: 12 }, // 作品类型
      { wch: 40 }, // 项目链接
      { wch: 15 }, // 上传时间
      { wch: 12 }, // 审核状态
      { wch: 10 }, // 投票数
      { wch: 30 }  // 作品描述
    ]
    worksheet['!cols'] = colWidths

    // 导出文件
    const fileName = `作品管理_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(workbook, fileName)
    toast.success('作品数据导出成功')
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'ADMIN') {
        // 尝试重新获取用户信息，可能角色已更新
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const latestUserData = await response.json()
            if (latestUserData.role === 'ADMIN') {
              localStorage.setItem('user', JSON.stringify(latestUserData))
              setIsAuthenticated(true)
              fetchBootcamps()
              fetchProjects()
              fetchUsers()
              return
            }
          }
        } catch (error) {
          console.error('Error fetching latest user data:', error)
        }

        toast.error('访问被拒绝：需要管理员权限')
        router.push('/')
        return
      }
      setIsAuthenticated(true)
      fetchBootcamps()
      fetchProjects()
      fetchUsers()
    } catch (error) {
      router.push('/login')
    }
  }


  const fetchBootcamps = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/bootcamps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(`获取训练营数据失败: ${errorData.message || '未知错误'}`)
        setBootcamps([])
        return
      }

      const data = await response.json()
      console.log('Bootcamps data:', data)
      setBootcamps(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching bootcamps:', error)
      toast.error('网络错误，获取训练营数据失败')
      setBootcamps([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/projects?admin=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(`获取作品数据失败: ${errorData.message || '未知错误'}`)
        setProjects([])
        return
      }

      const data = await response.json()
      console.log('Projects data:', data)
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('网络错误，获取作品数据失败')
      setProjects([])
    }
  }

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/users?admin=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(`获取用户数据失败: ${errorData.message || '未知错误'}`)
        setUsers([])
        return
      }

      const data = await response.json()
      console.log('Users data:', data)
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('网络错误，获取用户数据失败')
      setUsers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const method = editingBootcamp ? 'PUT' : 'POST'
      const body = editingBootcamp
        ? { id: editingBootcamp.id, ...formData }
        : formData

      const response = await fetch('/api/bootcamps', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setFormData({ name: '', description: '', startDate: '', endDate: '', isActive: true })
        setShowForm(false)
        setEditingBootcamp(null)
        fetchBootcamps()
      }
    } catch (error) {
      console.error('Error submitting bootcamp:', error)
    }
  }

  const handleEdit = (bootcamp: Bootcamp) => {
    setEditingBootcamp(bootcamp)
    setFormData({
      name: bootcamp.name,
      description: bootcamp.description || '',
      startDate: new Date(bootcamp.startDate).toISOString().split('T')[0],
      endDate: bootcamp.endDate ? new Date(bootcamp.endDate).toISOString().split('T')[0] : '',
      isActive: bootcamp.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个训练营吗？删除后将无法恢复。')) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/bootcamps?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchBootcamps()
      }
    } catch (error) {
      console.error('Error deleting bootcamp:', error)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBootcamp(null)
    setFormData({ name: '', description: '', startDate: '', endDate: '', isActive: true })
  }

  const handleOpenPasswordModal = (user: User) => {
    setEditingUser(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setEditingUser(null)
    setNewPassword('')
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    // 去除密码前后空格
    const trimmedPassword = newPassword.trim()

    if (trimmedPassword.length < 6) {
      toast.error('密码至少需要6个字符')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: trimmedPassword })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`成功修改用户 ${editingUser.nickname} 的密码`)
        handleClosePasswordModal()
      } else {
        toast.error(data.message || '修改密码失败')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('修改密码失败，请重试')
    }
  }

  const handleApproveProject = async (projectId: string, isApproved: boolean) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: project.id,
          title: project.title,
          description: project.description,
          type: project.type,
          htmlFile: project.htmlFile,
          projectUrl: project.projectUrl,
          coverImage: project.coverImage,
          bootcampId: project.bootcamp.id,
          isApproved
        })
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error updating project approval:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？删除后将无法恢复。')) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  // 作品筛选逻辑
  const filteredProjects = projects.filter(project => {
    const matchesBootcamp = !projectFilters.bootcampId || project.bootcamp?.id === projectFilters.bootcampId
    const matchesApproval = projectFilters.isApproved === '' ||
      (projectFilters.isApproved === 'true' ? project.isApproved : !project.isApproved)
    const matchesType = !projectFilters.type || project.type === projectFilters.type
    const matchesSearch = !projectFilters.search ||
      project.title.toLowerCase().includes(projectFilters.search.toLowerCase()) ||
      project.author?.nickname.toLowerCase().includes(projectFilters.search.toLowerCase())

    return matchesBootcamp && matchesApproval && matchesType && matchesSearch
  })

  // 用户筛选逻辑
  const filteredUsers = users.filter(user => {
    const matchesRole = !userFilters.role || user.role === userFilters.role
    const matchesProjects = userFilters.hasProjects === '' ||
      (userFilters.hasProjects === 'true' ? (user._count?.projects || 0) > 0 : (user._count?.projects || 0) === 0)
    const matchesSearch = !userFilters.search ||
      user.nickname.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.planetNumber.toLowerCase().includes(userFilters.search.toLowerCase())

    return matchesRole && matchesProjects && matchesSearch
  })

  // 作品分页逻辑
  const totalProjectPages = Math.ceil(filteredProjects.length / projectsPerPage)
  const startProjectIndex = (currentProjectPage - 1) * projectsPerPage
  const endProjectIndex = startProjectIndex + projectsPerPage
  const currentProjects = filteredProjects.slice(startProjectIndex, endProjectIndex)

  // 用户分页逻辑
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startUserIndex = (currentUserPage - 1) * usersPerPage
  const endUserIndex = startUserIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startUserIndex, endUserIndex)

  // 重置页码当切换标签页时
  useEffect(() => {
    if (activeTab === 'projects') {
      setCurrentProjectPage(1)
    } else if (activeTab === 'users') {
      setCurrentUserPage(1)
    }
  }, [activeTab])

  // 重置页码当筛选条件改变时
  useEffect(() => {
    setCurrentProjectPage(1)
  }, [projectFilters])

  useEffect(() => {
    setCurrentUserPage(1)
  }, [userFilters])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">管理后台</h1>
        <p className="text-lg text-gray-600">管理训练营和作品内容</p>
      </div>

      {/* 标签页 */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('bootcamps')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bootcamps'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            训练营管理
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            作品管理
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            用户管理
          </button>
        </nav>
      </div>

      {activeTab === 'bootcamps' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">训练营管理</h2>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              新增训练营
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    训练营名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    开始日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(bootcamps) && bootcamps.length > 0 ? (
                  bootcamps.map((bootcamp) => (
                    <tr key={bootcamp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bootcamp.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bootcamp.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bootcamp._count?.projects || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bootcamp.startDate ? new Date(bootcamp.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bootcamp.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bootcamp.isActive ? '活跃' : '已结束'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(bootcamp)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(bootcamp.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      暂无训练营数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">作品管理</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                共 {filteredProjects.length} 个作品（总计 {projects.length} 个），每页显示 {projectsPerPage} 个
              </div>
              <button
                onClick={exportProjectsToExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>导出Excel</span>
              </button>
            </div>
          </div>

          {/* 作品筛选器 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <input
                  type="text"
                  placeholder="按作品标题或作者搜索..."
                  value={projectFilters.search}
                  onChange={(e) => setProjectFilters({ ...projectFilters, search: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">训练营</label>
                <select
                  value={projectFilters.bootcampId}
                  onChange={(e) => setProjectFilters({ ...projectFilters, bootcampId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">全部训练营</option>
                  {bootcamps.map(bootcamp => (
                    <option key={bootcamp.id} value={bootcamp.id}>{bootcamp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">审核状态</label>
                <select
                  value={projectFilters.isApproved}
                  onChange={(e) => setProjectFilters({ ...projectFilters, isApproved: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="true">已审核</option>
                  <option value="false">待审核</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品类型</label>
                <select
                  value={projectFilters.type}
                  onChange={(e) => setProjectFilters({ ...projectFilters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">全部类型</option>
                  <option value="LINK">链接</option>
                  <option value="HTML_FILE">HTML文件</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setProjectFilters({ bootcampId: '', isApproved: '', type: '', search: '' })}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    训练营
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    投票数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(currentProjects) && currentProjects.length > 0 ? (
                  currentProjects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.author?.nickname || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.bootcamp?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.type === 'LINK' ? '链接' : 'HTML文件'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.isApproved ? '已审核' : '待审核'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.voteCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              window.open(`/project/${project.id}`, '_blank')
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            查看作品
                          </button>
                          {!project.isApproved && (
                            <button
                              onClick={() => handleApproveProject(project.id, true)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              审核通过
                            </button>
                          )}
                          {project.isApproved && (
                            <button
                              onClick={() => handleApproveProject(project.id, false)}
                              className="text-yellow-600 hover:text-yellow-900 font-medium"
                            >
                              取消审核
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      暂无作品数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 作品分页控件 */}
          {totalProjectPages > 1 && (
            <div className="flex justify-center items-center space-x-3 mt-6">
              <button
                onClick={() => setCurrentProjectPage(Math.max(1, currentProjectPage - 1))}
                disabled={currentProjectPage === 1}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>上一页</span>
              </button>

              <div className="flex space-x-1">
                {(() => {
                  const maxVisiblePages = 5
                  const pages = []

                  if (totalProjectPages <= maxVisiblePages) {
                    // 如果总页数小于等于最大显示页数，显示所有页码
                    for (let i = 1; i <= totalProjectPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // 计算显示范围
                    let startPage = Math.max(1, currentProjectPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalProjectPages, startPage + maxVisiblePages - 1)

                    // 调整开始页，确保显示足够的页码
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }

                    // 添加第一页和省略号
                    if (startPage > 1) {
                      pages.push(1)
                      if (startPage > 2) {
                        pages.push('...')
                      }
                    }

                    // 添加中间页码
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i)
                    }

                    // 添加省略号和最后一页
                    if (endPage < totalProjectPages) {
                      if (endPage < totalProjectPages - 1) {
                        pages.push('...')
                      }
                      pages.push(totalProjectPages)
                    }
                  }

                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={index} className="w-10 h-10 flex items-center justify-center text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentProjectPage(page as number)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentProjectPage === page
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))
                })()}
              </div>

              <button
                onClick={() => setCurrentProjectPage(Math.min(totalProjectPages, currentProjectPage + 1))}
                disabled={currentProjectPage === totalProjectPages}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>下一页</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                共 {filteredUsers.length} 个用户（总计 {users.length} 个），每页显示 {usersPerPage} 个
              </div>
              <button
                onClick={exportUsersToExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>导出Excel</span>
              </button>
            </div>
          </div>

          {/* 用户筛选器 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <input
                  type="text"
                  placeholder="按用户昵称或星球编号搜索..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">全部角色</option>
                  <option value="ADMIN">管理员</option>
                  <option value="COACH">教练</option>
                  <option value="STAFF">工作人员</option>
                  <option value="ACTIONIST">行动家</option>
                  <option value="MEMBER">成员</option>
                  <option value="VOLUNTEER">志愿者</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品情况</label>
                <select
                  value={userFilters.hasProjects}
                  onChange={(e) => setUserFilters({ ...userFilters, hasProjects: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">全部用户</option>
                  <option value="true">已提交作品</option>
                  <option value="false">未提交作品</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setUserFilters({ role: '', hasProjects: '', search: '' })}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  清除筛选
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户昵称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    星球编号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    参与训练营
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交作品数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作品详情
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(currentUsers) && currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt={user.nickname}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          )}
                          {user.nickname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.planetNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'COACH' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'STAFF' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-32">
                          {user.projects && user.projects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(user.projects.map(p => p.bootcamp?.name))).map((bootcampName, index) => (
                                <span
                                  key={index}
                                  className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                                >
                                  {bootcampName || '未知训练营'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">未参与</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._count?.projects || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-48">
                          {user.projects && user.projects.length > 0 ? (
                            <div className="space-y-1">
                              {user.projects.map((project, index) => (
                                <div key={project.id} className="text-xs bg-gray-50 p-2 rounded">
                                  <div className="font-medium truncate">{project.title}</div>
                                  <div className="text-gray-500">训练营: {project.bootcamp?.name || '未知'}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">无作品</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // 查看用户详情和作品列表
                              window.open(`/profile?userId=${user.id}`, '_blank')
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            查看详情
                          </button>
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            修改密码
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      暂无用户数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 用户分页控件 */}
          {totalUserPages > 1 && (
            <div className="flex justify-center items-center space-x-3 mt-6">
              <button
                onClick={() => setCurrentUserPage(Math.max(1, currentUserPage - 1))}
                disabled={currentUserPage === 1}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>上一页</span>
              </button>

              <div className="flex space-x-1">
                {(() => {
                  const maxVisiblePages = 5
                  const pages = []

                  if (totalUserPages <= maxVisiblePages) {
                    // 如果总页数小于等于最大显示页数，显示所有页码
                    for (let i = 1; i <= totalUserPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // 计算显示范围
                    let startPage = Math.max(1, currentUserPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalUserPages, startPage + maxVisiblePages - 1)

                    // 调整开始页，确保显示足够的页码
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }

                    // 添加第一页和省略号
                    if (startPage > 1) {
                      pages.push(1)
                      if (startPage > 2) {
                        pages.push('...')
                      }
                    }

                    // 添加中间页码
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i)
                    }

                    // 添加省略号和最后一页
                    if (endPage < totalUserPages) {
                      if (endPage < totalUserPages - 1) {
                        pages.push('...')
                      }
                      pages.push(totalUserPages)
                    }
                  }

                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={index} className="w-10 h-10 flex items-center justify-center text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentUserPage(page as number)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentUserPage === page
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))
                })()}
              </div>

              <button
                onClick={() => setCurrentUserPage(Math.min(totalUserPages, currentUserPage + 1))}
                disabled={currentUserPage === totalUserPages}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>下一页</span>
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBootcamp ? '编辑训练营' : '新增训练营'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  训练营名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期 *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {editingBootcamp && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">激活状态</span>
                  </label>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingBootcamp ? '更新' : '创建'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">修改用户密码</h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-gray-700">
                <p><span className="font-medium">用户昵称：</span>{editingUser.nickname}</p>
                <p><span className="font-medium">星球编号：</span>{editingUser.planetNumber}</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码 *
                </label>
                <input
                  type="password"
                  required
                  placeholder="请输入新密码（至少6个字符）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">密码长度至少为6个字符</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  确认修改
                </button>
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}