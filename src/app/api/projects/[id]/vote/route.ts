import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAfterDeadline } from '@/lib/deadline'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查是否已超过截止时间
    if (isAfterDeadline()) {
      return NextResponse.json(
        { message: '投票已截止，无法点赞' },
        { status: 403 }
      )
    }

    const projectId = params.id
    const authHeader = request.headers.get('authorization')
    let voterId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
        voterId = decoded.userId
      } catch (error) {
        // 忽略无效的 token，按匿名访客处理
      }
    }

    let visitorId = request.cookies.get('visitorId')?.value || ''
    let shouldSetCookie = false

    if (!visitorId) {
      visitorId = randomUUID()
      shouldSetCookie = true
    }

    // 使用事务和优化的查询 - 一次性验证所有条件
    const result = await prisma.$transaction(async (tx) => {
      // 查询项目和可选用户
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, isApproved: true, authorId: true }
      })

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND')
      }

      if (!project.isApproved) {
        throw new Error('PROJECT_NOT_APPROVED')
      }

      if (voterId) {
        const user = await tx.user.findUnique({
          where: { id: voterId },
          select: { id: true }
        })

        if (!user) {
          throw new Error('USER_NOT_FOUND')
        }

        if (project.authorId === voterId) {
          throw new Error('CANNOT_VOTE_OWN_PROJECT')
        }
      }

      // 查询当前访客或用户是否已经投票
      const voteQueryConditions: any[] = [{ visitorId }]
      if (voterId) {
        voteQueryConditions.push({ voterId })
      }

      const existingVote = await tx.vote.findFirst({
        where: {
          projectId,
          OR: voteQueryConditions
        },
        select: { id: true }
      })

      if (existingVote) {
        await tx.vote.delete({
          where: { id: existingVote.id }
        })

        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { voteCount: { decrement: 1 } },
          select: { voteCount: true }
        })

        return {
          voted: false,
          message: '已取消投票',
          voteCount: updatedProject.voteCount
        }
      }

      await tx.vote.create({
        data: {
          projectId,
          visitorId,
          voterId: voterId || null
        }
      })

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { voteCount: { increment: 1 } },
        select: { voteCount: true }
      })

      return {
        voted: true,
        message: '投票成功',
        voteCount: updatedProject.voteCount
      }
    })

    const response = NextResponse.json(result)

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

  } catch (error: any) {
    console.error('Error handling vote:', error)

    // 处理业务逻辑错误
    switch (error.message) {
      case 'USER_NOT_FOUND':
        return NextResponse.json(
          { message: '用户不存在' },
          { status: 404 }
        )
      case 'PROJECT_NOT_FOUND':
        return NextResponse.json(
          { message: '作品不存在' },
          { status: 404 }
        )
      case 'PROJECT_NOT_APPROVED':
        return NextResponse.json(
          { message: '只能为已审核的作品投票' },
          { status: 403 }
        )
      case 'CANNOT_VOTE_OWN_PROJECT':
        return NextResponse.json(
          { message: '不能为自己的作品投票' },
          { status: 403 }
        )
      default:
        return NextResponse.json(
          { error: 'Failed to handle vote' },
          { status: 500 }
        )
    }
  }
}
