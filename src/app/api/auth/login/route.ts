import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { planetNumber, password } = await request.json()

    // 去除账号和密码前后空格
    const trimmedPlanetNumber = planetNumber?.trim() || ''
    const trimmedPassword = password?.trim() || ''

    // 从数据库查找用户
    const user = await prisma.user.findUnique({
      where: { planetNumber: trimmedPlanetNumber },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
        email: true,
        avatar: true,
        password: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: '星球编号或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(trimmedPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { message: '星球编号或密码错误' },
        { status: 401 }
      )
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        planetNumber: user.planetNumber,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // 返回用户信息（排除密码）
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      token,
      user: userWithoutPassword,
      message: '登录成功'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: '登录失败，请重试' },
      { status: 500 }
    )
  }
}