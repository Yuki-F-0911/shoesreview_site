/**
 * レビュー収集API
 * Web記事またはYouTube動画からレビュー情報を収集
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { scrapeWebArticle } from '@/lib/ai/web-scraper'
import { summarizeYouTubeVideo, extractYouTubeVideoId } from '@/lib/ai/youtube-summarizer'
import { z } from 'zod'

const collectReviewSchema = z.object({
  shoeId: z.string().min(1),
  sourceType: z.enum(['WEB_ARTICLE', 'YOUTUBE_VIDEO']),
  sourceUrl: z.string().url(),
})

export async function POST(request: Request) {
  try {
    // 認証チェック（管理者のみ）
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { shoeId, sourceType, sourceUrl } = collectReviewSchema.parse(body)

    // シューズが存在するか確認
    const shoe = await prisma.shoe.findUnique({
      where: { id: shoeId },
    })

    if (!shoe) {
      return NextResponse.json({ error: 'シューズが見つかりません' }, { status: 404 })
    }

    let aiSourceData: {
      sourceType: string
      sourceUrl: string
      sourceTitle?: string
      sourceAuthor?: string
      youtubeVideoId?: string
      summary?: string
      rawData?: any
    }

    // ソースタイプに応じて処理
    if (sourceType === 'WEB_ARTICLE') {
      // Web記事をスクレイピング
      const articleInfo = await scrapeWebArticle(sourceUrl)
      aiSourceData = {
        sourceType: 'WEB_ARTICLE',
        sourceUrl: articleInfo.url,
        sourceTitle: articleInfo.title,
        sourceAuthor: articleInfo.author,
        rawData: {
          // 元データを詳細に保存
          content: articleInfo.content,
          publishedAt: articleInfo.publishedAt?.toISOString(),
          rawHtml: articleInfo.rawHtml, // 元のHTML（必要に応じて）
          metadata: articleInfo.metadata,
          scrapedAt: new Date().toISOString(),
        },
      }
    } else if (sourceType === 'YOUTUBE_VIDEO') {
      // YouTube動画を要約
      const videoId = extractYouTubeVideoId(sourceUrl)
      if (!videoId) {
        return NextResponse.json({ error: '無効なYouTube URLです' }, { status: 400 })
      }

      const result = await summarizeYouTubeVideo(sourceUrl, shoe.brand, shoe.modelName)
      aiSourceData = {
        sourceType: 'YOUTUBE_VIDEO',
        sourceUrl: result.videoInfo.url,
        sourceTitle: result.videoInfo.title,
        sourceAuthor: result.videoInfo.channel,
        youtubeVideoId: videoId,
        summary: result.summary.summary,
        rawData: {
          // 元データを詳細に保存
          videoInfo: result.videoInfo,
          transcription: {
            text: result.transcription.text,
            language: result.transcription.language,
          },
          summary: result.summary,
          scrapedAt: new Date().toISOString(),
        },
      }
    } else {
      return NextResponse.json({ error: '無効なソースタイプです' }, { status: 400 })
    }

    // 既存のレビューを検索（同じシューズ、AI要約タイプ）
    const existingReview = await prisma.review.findFirst({
      where: {
        shoeId,
        type: 'AI_SUMMARY',
      },
      include: {
        aiSources: true,
      },
    })

    // 既存のレビューがある場合は、AISourceを追加
    if (existingReview) {
      // 同じURLのソースが既に存在するかチェック
      const existingSource = existingReview.aiSources.find(
        (source) => source.sourceUrl === aiSourceData.sourceUrl
      )

      if (existingSource) {
        return NextResponse.json(
          { error: 'この情報源は既に収集されています' },
          { status: 400 }
        )
      }

      // AISourceを追加
      const aiSource = await prisma.aISource.create({
        data: {
          reviewId: existingReview.id,
          ...aiSourceData,
        },
      })

      // ソース数を更新
      await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          sourceCount: existingReview.aiSources.length + 1,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          reviewId: existingReview.id,
          aiSource,
          message: '情報源を追加しました',
        },
      })
    }

    // 新しいレビューを作成（要約は後で生成）
    // まず、一時的なレビューを作成
    const newReview = await prisma.review.create({
      data: {
        shoeId,
        userId: null, // AI要約の場合はnull
        type: 'AI_SUMMARY',
        overallRating: 5.0, // 仮の値（10.0点満点）
        title: `${shoe.brand} ${shoe.modelName} レビュー要約（収集中）`,
        content: 'レビューを収集中です。統合レビューを生成してください。',
        pros: [],
        cons: [],
        sourceCount: 1,
        isPublished: false, // 要約生成まで非公開
        isDraft: true,
      },
    })

    // AISourceを作成
    const aiSource = await prisma.aISource.create({
      data: {
        reviewId: newReview.id,
        ...aiSourceData,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        reviewId: newReview.id,
        aiSource,
        message: '情報源を収集しました。統合レビューを生成してください。',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Collect review error:', error)
    return NextResponse.json(
      { error: 'レビューの収集に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

