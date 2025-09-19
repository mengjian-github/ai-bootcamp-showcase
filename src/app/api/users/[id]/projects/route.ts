import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    // 检查用户是否有权限查看这些作品（只能查看自己的作品）
    if (decoded.userId !== params.id) {
      return NextResponse.json(
        { message: '无权限访问' },
        { status: 403 }
      )
    }

    // 获取用户的所有作品
    const projects = await prisma.project.findMany({
      where: {
        authorId: params.id
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