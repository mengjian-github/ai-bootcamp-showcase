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

    // 使用事务和优化的查询 - 一次性验证所有条件
    const result = await prisma.$transaction(async (tx) => {
      // 一次查询获取所有需要的信息
      const [user, project, existingVote] = await Promise.all([
        tx.user.findUnique({
          where: { id: voterId },
          select: { id: true }
        }),
        tx.project.findUnique({
          where: { id: projectId },
          select: { id: true, isApproved: true, authorId: true, voteCount: true }
        }),
        tx.vote.findUnique({
          where: {
            projectId_voterId: {
              projectId,
              voterId
            }
          },
          select: { id: true }
        })
      ])

      // 验证条件
      if (!user) {
        throw new Error('USER_NOT_FOUND')
      }

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND')
      }

      if (!project.isApproved) {
        throw new Error('PROJECT_NOT_APPROVED')
      }

      if (project.authorId === voterId) {
        throw new Error('CANNOT_VOTE_OWN_PROJECT')
      }

      // 执行投票操作
      if (existingVote) {
        // 取消投票 - 使用原子操作
        await Promise.all([
          tx.vote.delete({
            where: { id: existingVote.id }
          }),
          tx.project.update({
            where: { id: projectId },
            data: { voteCount: { decrement: 1 } }
          })
        ])

        return {
          voted: false,
          message: '已取消投票',
          voteCount: project.voteCount - 1
        }
      } else {
        // 添加投票 - 使用原子操作
        await Promise.all([
          tx.vote.create({
            data: {
              projectId,
              voterId
            }
          }),
          tx.project.update({
            where: { id: projectId },
            data: { voteCount: { increment: 1 } }
          })
        ])

        return {
          voted: true,
          message: '投票成功',
          voteCount: project.voteCount + 1
        }
      }
    })

    return NextResponse.json(result)

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