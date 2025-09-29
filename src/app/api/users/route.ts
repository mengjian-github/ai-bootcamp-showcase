import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    if (isAdmin) {
      // 管理员权限验证
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!currentUser || currentUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      // 获取包含作品数量的用户列表（管理员视图）
      const users = await prisma.user.findMany({
        include: {
          _count: {
            select: {
              projects: true
            }
          },
          projects: {
            select: {
              id: true,
              title: true,
              bootcamp: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(users)
    } else {
      // 普通用户列表（不包含敏感信息）
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nickname: true,
          planetNumber: true,
          role: true,
          avatar: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(users)
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nickname, planetNumber, role, skillLevel, avatar, email, password } = body

    // 检查必填字段
    if (!nickname || !planetNumber || !role || !skillLevel || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: nickname, planetNumber, role, skillLevel, password' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { planetNumber }
    })

    if (existingUser) {
      return NextResponse.json(existingUser, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        nickname,
        planetNumber,
        role,
        skillLevel,
        password,
        avatar: avatar || null,
        email: email || null
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}