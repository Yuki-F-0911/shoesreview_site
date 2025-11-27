import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { reviewSchema } from '@/lib/validations/review'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
            releaseYear: true,
            officialPrice: true,
          },
        },
        aiSources: {
          orderBy: {
            scrapedAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error('Get review error:', error)
    return NextResponse.json({ error: 'レビューの取得に失敗しました' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reviewSchema.partial().parse(body)

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedReview })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error },
        { status: 400 }
      )
    }

    console.error('Update review error:', error)
    return NextResponse.json({ error: 'レビューの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    await prisma.review.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json({ error: 'レビューの削除に失敗しました' }, { status: 500 })
  }
}

