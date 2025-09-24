import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(
        { message: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 检查用户是否有权限访问这个用户的喜欢列表（只能访问自己的）
    if (decoded.userId !== params.id) {
      return NextResponse.json(
        { message: '无权限访问' },
        { status: 403 }
      )
    }

    // 获取分页参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const skip = (page - 1) * limit

    // 获取总数
    const totalCount = await prisma.vote.count({
      where: {
        voterId: params.id
      }
    })

    // 获取用户投票过的作品（即喜欢的作品）
    const favoriteProjects = await prisma.vote.findMany({
      where: {
        voterId: params.id
      },
      include: {
        project: {
          include: {
            bootcamp: {
              select: {
                id: true,
                name: true
              }
            },
            author: {
              select: {
                id: true,
                nickname: true,
                planetNumber: true
              }
            },
            _count: {
              select: {
                votes: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // 按投票时间倒序排列
      },
      skip,
      take: limit
    })

    // 提取项目信息，并添加投票时间
    const projects = favoriteProjects.map(vote => ({
      ...vote.project,
      voteCount: vote.project._count.votes,
      likedAt: vote.createdAt // 投票时间作为喜欢时间
    }))

    return NextResponse.json({
      projects,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasMore: skip + limit < totalCount
    })

  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return NextResponse.json(
      { message: '获取喜欢的作品失败' },
      { status: 500 }
    )
  }
}