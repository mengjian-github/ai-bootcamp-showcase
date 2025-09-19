import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
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