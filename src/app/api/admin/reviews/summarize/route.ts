/**
 * 統合レビュー生成API
 * 収集した情報源を統合して1つの要約レビューを生成
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { generateSummarizedReview, type ReviewSource } from '@/lib/ai/summarizer'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const summarizeReviewSchema = z.object({
  reviewId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // 認証チェック（管理者のみ）
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId } = summarizeReviewSchema.parse(body)

    // レビューと情報源を取得
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        shoe: true,
        aiSources: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'レビューが見つかりません' }, { status: 404 })
    }

    if (review.type !== 'AI_SUMMARY') {
      return NextResponse.json({ error: 'AI要約レビューのみ統合できます' }, { status: 400 })
    }

    if (review.aiSources.length === 0) {
      return NextResponse.json({ error: '情報源がありません' }, { status: 400 })
    }

    // 情報源をReviewSource形式に変換
    const sources: ReviewSource[] = review.aiSources.map((source) => ({
      type: source.sourceType as 'WEB_ARTICLE' | 'YOUTUBE_VIDEO' | 'MANUAL',
      title: source.sourceTitle || 'タイトル不明',
      content: source.summary || (source.rawData as any)?.content || '',
      author: source.sourceAuthor || undefined,
      url: source.sourceUrl,
      summary: source.summary,
    }))

    // 統合レビューを生成
    const summarizedReview = await generateSummarizedReview(
      sources,
      review.shoe.brand,
      review.shoe.modelName
    )

    // レビューを更新
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        title: summarizedReview.title,
        pros: summarizedReview.pros,
        cons: summarizedReview.cons,
        recommendedFor: summarizedReview.recommendedFor,
        content: summarizedReview.summary,
        sourceCount: review.aiSources.length,
      },
      include: {
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
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

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: '統合レビューを生成しました',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Summarize review error:', error)
    return NextResponse.json(
      { error: '統合レビューの生成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

