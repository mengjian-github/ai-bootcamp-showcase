import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取并验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    // 获取用户的作品
    // 如果是查看自己的作品，返回所有作品（包括未审核的）
    // 如果是查看他人的作品，只返回已审核的作品
    const isOwnProfile = decoded.userId === params.id

    const projects = await prisma.project.findMany({
      where: {
        authorId: params.id,
        // 如果不是查看自己的作品，只显示已审核的作品
        ...(isOwnProfile ? {} : { isApproved: true })
      },
      include: {
        bootcamp: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching user projects:', error)
    return NextResponse.json(
      { message: '获取作品失败' },
      { status: 500 }
    )
  }
}