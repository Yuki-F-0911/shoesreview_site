import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { reviewSchema } from '@/lib/validations/review'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
    const skip = (page - 1) * pageSize

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {},
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
              imageUrls: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        // Note: orderBy removed because createdAt column doesn't exist in Review model
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: {},
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: reviews,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'レビューの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // シューズが存在するか確認
    const shoe = await prisma.shoe.findUnique({
      where: { id: validatedData.shoeId },
    })

    if (!shoe) {
      return NextResponse.json({ error: 'シューズが見つかりません' }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        type: 'USER',
      } as any,
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

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    // Zodバリデーションエラー
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any
      return NextResponse.json(
        {
          error: '入力データが正しくありません',
          details: zodError.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || error.message
        },
        { status: 400 }
      )
    }

    // Prismaエラー（データベース制約違反など）
    if (error instanceof Error && error.message.includes('Prisma')) {
      console.error('Prisma error:', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました。サポートにお問い合わせください。', details: error.message },
        { status: 500 }
      )
    }

    console.error('Create review error:', error)
    return NextResponse.json({ error: 'レビューの作成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

