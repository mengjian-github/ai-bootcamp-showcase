import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { isAfterDeadline } from '@/lib/deadline'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bootcampId = searchParams.get('bootcampId')
    const isAdmin = searchParams.get('admin') === 'true'

    // 获取当前访客ID
    let visitorId = request.cookies.get('visitorId')?.value || ''
    let shouldSetCookie = false
    if (!visitorId) {
      visitorId = randomUUID()
      shouldSetCookie = true
    }

    // 获取当前用户ID
    let currentUserId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const jwt = require('jsonwebtoken')
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
        currentUserId = decoded.userId
      } catch (error) {
        // Token无效，继续不带用户信息
      }
    }

    // 检查是否为管理员请求
    let whereClause: any = {}
    if (isAdmin) {
      const user = requireAdmin(request)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // 管理员可以看到所有项目
      whereClause = bootcampId ? { bootcampId } : {}
    } else {
      // 普通用户只能看到已审核的项目
      whereClause = {
        isApproved: true,
        ...(bootcampId && { bootcampId })
      }
    }

    const voteConditions: any[] = [{ visitorId }]
    if (currentUserId) {
      voteConditions.push({ voterId: currentUserId })
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            planetNumber: true,
            role: true,
            skillLevel: true,
            avatar: true
          }
        },
        bootcamp: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { votes: true }
        },
        votes: {
          where: { OR: voteConditions },
          select: { id: true }
        }
      },
      orderBy: { voteCount: 'desc' }
    })

    // 添加用户是否已投票的标识
    const projectsWithVoteStatus = projects.map(project => ({
      ...project,
      hasVoted: project.votes.length > 0,
      votes: undefined // 移除votes字段，只保留hasVoted
    }))

    const response = NextResponse.json(projectsWithVoteStatus)

    if (shouldSetCookie) {
      response.cookies.set({
        name: 'visitorId',
        value: visitorId,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 * 5,
        secure: process.env.NODE_ENV === 'production'
      })
    }

    return response
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录才能提交作品' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    let decoded: any
    try {
      const jwt = require('jsonwebtoken')
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(
        { message: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 检查是否已超过截止时间
    if (isAfterDeadline()) {
      return NextResponse.json(
        { message: '提交已截止，无法提交作品' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      htmlFile,
      projectUrl,
      coverImage,
      bootcampId
    } = body

    console.log('Create project request body:', body)

    // 验证必需字段
    if (!title || !type || !bootcampId) {
      return NextResponse.json(
        { message: '缺少必需字段：title, type, bootcampId' },
        { status: 400 }
      )
    }

    if (!coverImage) {
      return NextResponse.json(
        { message: '封面图片是必需的' },
        { status: 400 }
      )
    }

    // 使用JWT中的用户ID作为作者ID
    const authorId = decoded.userId

    console.log('Creating project with data:', {
      title,
      description,
      type,
      htmlFile: htmlFile || null,
      projectUrl: projectUrl || null,
      coverImage,
      bootcampId,
      authorId,
      isApproved: true
    })

    const project = await prisma.project.create({
      data: {
        title,
        description,
        type,
        htmlFile: htmlFile || null,
        projectUrl: projectUrl || null,
        coverImage,
        bootcampId,
        authorId,
        isApproved: true
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            planetNumber: true,
            role: true,
            skillLevel: true,
            avatar: true
          }
        },
        bootcamp: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // 验证管理员权限
  const user = requireAdmin(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      id,
      title,
      description,
      type,
      htmlFile,
      projectUrl,
      coverImage,
      bootcampId,
      isApproved
    } = body

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        type,
        htmlFile: htmlFile || null,
        projectUrl: projectUrl || null,
        coverImage,
        bootcampId,
        isApproved
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            planetNumber: true,
            role: true,
            skillLevel: true,
            avatar: true
          }
        },
        bootcamp: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // 验证管理员权限
  const user = requireAdmin(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
