import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录才能投票' },
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

    const projectId = params.id
    const voterId = decoded.userId

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: voterId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查作品是否存在且已审核
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, isApproved: true, authorId: true }
    })

    if (!project) {
      return NextResponse.json(
        { message: '作品不存在' },
        { status: 404 }
      )
    }

    if (!project.isApproved) {
      return NextResponse.json(
        { message: '只能为已审核的作品投票' },
        { status: 403 }
      )
    }

    // 用户不能为自己的作品投票
    if (project.authorId === voterId) {
      return NextResponse.json(
        { message: '不能为自己的作品投票' },
        { status: 403 }
      )
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        projectId_voterId: {
          projectId,
          voterId
        }
      }
    })

    if (existingVote) {
      // 取消投票
      await prisma.vote.delete({
        where: { id: existingVote.id }
      })

      await prisma.project.update({
        where: { id: projectId },
        data: { voteCount: { decrement: 1 } }
      })

      return NextResponse.json({ voted: false, message: '已取消投票' })
    } else {
      // 添加投票
      await prisma.vote.create({
        data: {
          projectId,
          voterId
        }
      })

      await prisma.project.update({
        where: { id: projectId },
        data: { voteCount: { increment: 1 } }
      })

      return NextResponse.json({ voted: true, message: '投票成功' })
    }
  } catch (error) {
    console.error('Error handling vote:', error)
    return NextResponse.json(
      { error: 'Failed to handle vote' },
      { status: 500 }
    )
  }
}