/**
 * ⚠️ 警告: このスクリプトは廃止予定です
 * 
 * 著作権および利用規約の遵守について:
 * 
 * このスクリプトは元々スクレイピングで取得したレビューをインポートするために
 * 作成されましたが、以下の理由から使用を控えてください：
 * 
 * 1. **著作権侵害のリスク**
 *    - 他サイトのレビューを転載することは著作権侵害になる可能性があります
 *    - レビューは著作物として保護されています
 * 
 * 2. **利用規約違反のリスク**
 *    - ECサイトやレビューサイトの利用規約でスクレイピングは禁止されています
 * 
 * 3. **推奨される代替方法**
 *    - サイト独自のユーザーレビュー機能を使用
 *    - 公式APIを通じて取得した情報のみを使用
 *    - 適切な引用（出典明記、必要最小限の範囲）
 * 
 * 元の使用方法（参考のみ、使用は非推奨）:
 *   tsx src/scripts/import-scraped-reviews.ts [jsonファイルのパス] [オプション]
 */

import { PrismaClient, Prisma } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ScrapedReview {
  query: string
  query_type?: string
  url: string
  article_length?: number
  analysis?: {
    text?: string
    status?: string
    error?: string
  }
  processed_at?: string
  from_cache?: boolean
  service?: string
}

interface ParsedShoeInfo {
  brand_name: string
  model_name: string
  category: string
  release_year?: number | null
  price_usd?: number | null
}

interface ParsedReviewContent {
  summary_ja?: string
  pros?: string[]
  cons?: string[]
  comparable_shoes?: string[]
}

interface ParsedAnalysis {
  sentiment_score?: number
  recommended_runner_level?: string
  best_for?: string
}

interface ParsedData {
  product_info: ParsedShoeInfo
  review_content: ParsedReviewContent
  analysis: ParsedAnalysis
  specs?: {
    weight_g?: number
    drop_mm?: number
    stack_height_heel_mm?: number
    stack_height_forefoot_mm?: number
  }
}

/**
 * analysisオブジェクトからJSONを抽出してパース
 */
function extractParsedData(analysis: any): ParsedData | null {
  try {
    if (!analysis || typeof analysis !== 'object') {
      return null
    }

    // statusがfailedの場合はスキップ
    if (analysis.status === 'failed' || analysis.error) {
      return null
    }

    const text = analysis.text || ''
    if (!text) {
      return null
    }

    // JSONコードブロックからJSONを抽出
    let jsonStr: string | null = null
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    } else {
      // コードブロックがない場合は、最初の{から最後の}までを探す
      const braceMatch = text.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        jsonStr = braceMatch[0]
      }
    }

    if (!jsonStr) {
      return null
    }

    const parsed = JSON.parse(jsonStr) as ParsedData
    return parsed
  } catch (error) {
    console.error('JSON解析エラー:', error)
    return null
  }
}

/**
 * センチメントスコアを10.0点満点の評価に変換
 */
function sentimentScoreToRating(sentimentScore?: number): number {
  if (!sentimentScore) {
    return 5.0 // デフォルトは5.0
  }
  // 0-100のスコアを0.0-10.0の評価に変換
  return Math.round((sentimentScore / 100) * 10 * 10) / 10 // 小数点第1位まで
}

/**
 * カテゴリーを正規化
 */
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'Daily Trainer': 'ランニング',
    'Race/Carbon': 'レース',
    'Stability': 'スタビリティ',
    'Trail': 'トレイル',
    'Unknown': 'ランニング',
  }

  return categoryMap[category] || category || 'ランニング'
}

/**
 * 引き付けられるタイトルを生成
 */
function generateAttractiveTitle(
  brandName: string,
  modelName: string,
  reviewContent: ParsedReviewContent
): string {
  const titles = [
    `${brandName} ${modelName}をはじめて履いてみた本音レビュー`,
    `${brandName} ${modelName}を3ヶ月履いて分かったこと`,
    `${brandName} ${modelName}を100km走ってみた感想`,
    `${brandName} ${modelName}の実際の履き心地をレビュー`,
    `${brandName} ${modelName}を長期間使ってみた結果`,
    `${brandName} ${modelName}の購入前に知っておきたいこと`,
    `${brandName} ${modelName}を実際に履いて評価してみた`,
    `${brandName} ${modelName}の使用感を詳しくレビュー`,
  ]

  // レビュー内容から使用期間や距離の情報があれば、それに基づいてタイトルを選択
  const summary = reviewContent.summary_ja || ''
  if (summary.includes('ヶ月') || summary.includes('か月')) {
    const monthMatch = summary.match(/(\d+)[ヶか]月/)
    if (monthMatch) {
      const months = parseInt(monthMatch[1])
      return `${brandName} ${modelName}を${months}ヶ月履いてみた本音レビュー`
    }
  }
  if (summary.includes('km') || summary.includes('キロ')) {
    const kmMatch = summary.match(/(\d+)km|(\d+)キロ/)
    if (kmMatch) {
      const km = kmMatch[1] || kmMatch[2]
      return `${brandName} ${modelName}を${km}km走ってみた感想`
    }
  }
  if (summary.includes('マイル') || summary.includes('mile')) {
    const mileMatch = summary.match(/(\d+)[マミ]イル|(\d+)mile/i)
    if (mileMatch) {
      const miles = mileMatch[1] || mileMatch[2]
      return `${brandName} ${modelName}を${miles}マイル走ってみた感想`
    }
  }

  // デフォルトでランダムに選択
  return titles[Math.floor(Math.random() * titles.length)]
}

/**
 * 靴を検索または作成
 */
async function findOrCreateShoe(shoeInfo: ParsedShoeInfo): Promise<string> {
  const brand = shoeInfo.brand_name.trim()
  const modelName = shoeInfo.model_name.trim()
  const category = normalizeCategory(shoeInfo.category || 'ランニング')

  // 既存の靴を検索（大文字小文字を区別しない）
  const existingShoe = await prisma.shoe.findFirst({
    where: {
      brand: {
        equals: brand,
        mode: 'insensitive',
      },
      modelName: {
        equals: modelName,
        mode: 'insensitive',
      },
    },
  })

  if (existingShoe) {
    console.log(`  ✓ 既存の靴を発見: ${brand} ${modelName}`)
    return existingShoe.id
  }

  // 靴を作成
  const price = shoeInfo.price_usd ? Math.round(shoeInfo.price_usd * 150) : null // USDをJPYに変換（概算）

  const shoe = await prisma.shoe.create({
    data: {
      brand,
      modelName,
      category,
      releaseYear: shoeInfo.release_year || null,
      officialPrice: price,
      imageUrls: [],
      description: null,
    },
  })

  console.log(`  ✓ 新しい靴を作成: ${brand} ${modelName}`)
  return shoe.id
}

/**
 * レビューを保存
 */
async function createReview(
  shoeId: string,
  parsedData: ParsedData,
  sourceUrl: string,
  sourceTitle?: string
): Promise<string> {
  const reviewContent = parsedData.review_content || {}
  const analysis = parsedData.analysis || {}
  const shoeInfo = parsedData.product_info

  // タイトルを生成（引き付けられるタイトルにする）
  const title = generateAttractiveTitle(shoeInfo.brand_name, shoeInfo.model_name, reviewContent)

  // コンテンツを生成
  const contentParts: string[] = []
  if (reviewContent.summary_ja) {
    contentParts.push(reviewContent.summary_ja)
  }
  if (reviewContent.pros && reviewContent.pros.length > 0) {
    contentParts.push(`\n\n【長所】\n${reviewContent.pros.join('\n')}`)
  }
  if (reviewContent.cons && reviewContent.cons.length > 0) {
    contentParts.push(`\n\n【短所】\n${reviewContent.cons.join('\n')}`)
  }
  const content = contentParts.join('')

  // 評価を計算
  const overallRating = sentimentScoreToRating(analysis.sentiment_score)

  // 使用シーンを設定
  const usageScene: string[] = []
  if (analysis.best_for) {
    usageScene.push(...analysis.best_for.split(',').map((s) => s.trim()))
  }

  // レビューを作成
  const review = await prisma.review.create({
    data: {
      shoeId,
      userId: null, // AI要約なのでnull
      type: 'AI_SUMMARY',
      overallRating: new Prisma.Decimal(overallRating),
      comfortRating: null,
      designRating: null,
      durabilityRating: null,
      title,
      content,
      imageUrls: [],
      usagePeriod: null,
      usageScene,
      pros: reviewContent.pros || [],
      cons: reviewContent.cons || [],
      recommendedFor: analysis.recommended_runner_level || null,
      sourceCount: 1,
      // isPublished removed from schema
      // isDraft removed from schema
    },
  })

  return review.id
}

/**
 * AISourceを保存
 */
async function createAISource(
  reviewId: string,
  sourceUrl: string,
  sourceTitle: string,
  rawData: any
): Promise<void> {
  await prisma.aISource.create({
    data: {
      reviewId,
      sourceType: 'WEB_ARTICLE',
      sourceUrl,
      sourceTitle,
      sourceAuthor: null,
      youtubeVideoId: null,
      summary: null,
      rawData: rawData,
      reliability: 0.7, // デフォルトの信頼性
    },
  })
}

/**
 * 同じ靴のレビューを統合
 */
async function processShoeGroup(
  shoeInfo: ParsedShoeInfo,
  reviews: Array<{ parsedData: ParsedData; sourceUrl: string; sourceTitle?: string }>,
  consolidate: boolean = false
): Promise<void> {
  console.log(`\n処理中: ${shoeInfo.brand_name} ${shoeInfo.model_name} (${reviews.length}件のレビュー)`)

  // 靴を検索または作成
  const shoeId = await findOrCreateShoe(shoeInfo)

  if (consolidate && reviews.length > 1) {
    // 統合モード: 1つのレビューに複数のソースを追加
    await processConsolidatedReview(shoeId, shoeInfo, reviews)
  } else {
    // 個別モード: 各レビューを個別に保存
    await processIndividualReviews(shoeId, reviews)
  }
}

/**
 * 個別レビューを処理
 */
async function processIndividualReviews(
  shoeId: string,
  reviews: Array<{ parsedData: ParsedData; sourceUrl: string; sourceTitle?: string }>
): Promise<void> {
  for (const reviewData of reviews) {
    try {
      // 既存のレビューをチェック（同じURLのソースがあるか）
      const existingSource = await prisma.aISource.findFirst({
        where: {
          sourceUrl: reviewData.sourceUrl,
        },
        include: {
          review: true,
        },
      })

      if (existingSource && existingSource.review.shoeId === shoeId) {
        console.log(`  - スキップ: 既存のレビュー (${reviewData.sourceUrl})`)
        continue
      }

      // レビューを作成
      const reviewId = await createReview(
        shoeId,
        reviewData.parsedData,
        reviewData.sourceUrl,
        reviewData.sourceTitle
      )

      // AISourceを作成
      await createAISource(reviewId, reviewData.sourceUrl, reviewData.sourceTitle || '', {
        url: reviewData.sourceUrl,
        parsedData: reviewData.parsedData,
      })

      console.log(`  ✓ レビューを作成: ${reviewData.sourceUrl}`)
    } catch (error) {
      console.error(`  ✗ エラー: ${reviewData.sourceUrl}`, error)
    }
  }
}

/**
 * 統合レビューを処理（1つのレビューに複数のソースを追加）
 */
async function processConsolidatedReview(
  shoeId: string,
  shoeInfo: ParsedShoeInfo,
  reviews: Array<{ parsedData: ParsedData; sourceUrl: string; sourceTitle?: string }>
): Promise<void> {
  // 既存の統合レビューを検索
  let review = await prisma.review.findFirst({
    where: {
      shoeId,
      type: 'AI_SUMMARY',
    },
    include: {
      aiSources: true,
    },
  })

  // 既存のレビューがない場合は作成
  if (!review) {
    // 最初のレビューのデータを使用してレビューを作成
    const firstReview = reviews[0]
    const reviewContent = firstReview.parsedData.review_content || {}
    const analysis = firstReview.parsedData.analysis || {}

    // すべてのレビューから情報を統合してタイトルを生成
    const allReviewContents = reviews.map((r) => r.parsedData.review_content || {})
    const combinedContent = {
      summary_ja: allReviewContents.map((c) => c.summary_ja).filter(Boolean).join(' '),
      pros: allReviewContents.flatMap((c) => c.pros || []),
      cons: allReviewContents.flatMap((c) => c.cons || []),
    }

    const title = generateAttractiveTitle(
      shoeInfo.brand_name,
      shoeInfo.model_name,
      combinedContent
    )
    const overallRating = sentimentScoreToRating(analysis.sentiment_score)

    review = await prisma.review.create({
      data: {
        shoeId,
        userId: null,
        type: 'AI_SUMMARY',
        overallRating: new Prisma.Decimal(overallRating),
        comfortRating: null,
        designRating: null,
        durabilityRating: null,
        title,
        content: reviewContent.summary_ja || '',
        imageUrls: [],
        usagePeriod: null,
        usageScene: analysis.best_for
          ? analysis.best_for.split(',').map((s) => s.trim())
          : [],
        pros: reviewContent.pros || [],
        cons: reviewContent.cons || [],
        recommendedFor: analysis.recommended_runner_level || null,
        sourceCount: 0,
        // isPublished removed from schema
        // isDraft removed from schema
      },
      include: {
        aiSources: true,
      },
    })

    console.log(`  ✓ 統合レビューを作成`)
  }

  // 各ソースを追加
  let addedCount = 0
  for (const reviewData of reviews) {
    try {
      // 既に同じURLのソースがあるかチェック
      const existingSource = review.aiSources.find(
        (source) => source.sourceUrl === reviewData.sourceUrl
      )

      if (existingSource) {
        console.log(`  - スキップ: 既存のソース (${reviewData.sourceUrl})`)
        continue
      }

      // AISourceを追加
      await createAISource(review.id, reviewData.sourceUrl, reviewData.sourceTitle || '', {
        url: reviewData.sourceUrl,
        parsedData: reviewData.parsedData,
      })

      addedCount++
      console.log(`  ✓ ソースを追加: ${reviewData.sourceUrl}`)
    } catch (error) {
      console.error(`  ✗ エラー: ${reviewData.sourceUrl}`, error)
    }
  }

  // ソース数を更新
  if (addedCount > 0) {
    const updatedSources = await prisma.aISource.findMany({
      where: { reviewId: review.id },
    })

    await prisma.review.update({
      where: { id: review.id },
      data: {
        sourceCount: updatedSources.length,
      },
    })

    console.log(`  ✓ ソース数を更新: ${updatedSources.length}件`)
  }
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  const jsonFilePath = args[0] || 'scrayping/results_all.json'
  const consolidate = args.includes('--consolidate') || args.includes('-c')

  console.log('='.repeat(60))
  console.log('スクレイピングレビューのデータベース統合')
  console.log('='.repeat(60))
  console.log(`\n読み込みファイル: ${jsonFilePath}`)
  console.log(`統合モード: ${consolidate ? 'ON（1つのレビューに複数ソース）' : 'OFF（各レビューを個別に保存）'}`)

  // JSONファイルを読み込む
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`\nエラー: ファイルが見つかりません: ${jsonFilePath}`)
    process.exit(1)
  }

  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8')
  const scrapedReviews: ScrapedReview[] = JSON.parse(fileContent)

  console.log(`\n読み込んだレビュー数: ${scrapedReviews.length}`)

  // 有効なレビューを抽出
  const validReviews: Array<{
    parsedData: ParsedData
    sourceUrl: string
    sourceTitle?: string
  }> = []

  for (const review of scrapedReviews) {
    const parsedData = extractParsedData(review.analysis)
    if (parsedData && parsedData.product_info.brand_name && parsedData.product_info.model_name) {
      validReviews.push({
        parsedData,
        sourceUrl: review.url,
        sourceTitle: review.query,
      })
    }
  }

  console.log(`有効なレビュー数: ${validReviews.length}`)

  if (validReviews.length === 0) {
    console.log('\n処理するレビューがありませんでした。')
    await prisma.$disconnect()
    return
  }

  // 靴ごとにグループ化
  const shoeGroups = new Map<string, Array<{ parsedData: ParsedData; sourceUrl: string; sourceTitle?: string }>>()

  for (const review of validReviews) {
    const shoeInfo = review.parsedData.product_info
    const key = `${shoeInfo.brand_name}_${shoeInfo.model_name}`.toLowerCase().trim()

    if (!shoeGroups.has(key)) {
      shoeGroups.set(key, [])
    }
    shoeGroups.get(key)!.push(review)
  }

  console.log(`\nグループ化された靴の数: ${shoeGroups.size}`)

  // 各靴のグループを処理
  let processedCount = 0
  for (const [key, reviews] of shoeGroups.entries()) {
    const shoeInfo = reviews[0].parsedData.product_info
    await processShoeGroup(shoeInfo, reviews, consolidate)
    processedCount++
  }

  console.log('\n' + '='.repeat(60))
  console.log(`処理完了: ${processedCount}種類の靴、${validReviews.length}件のレビューを処理しました`)
  console.log('='.repeat(60))

  await prisma.$disconnect()
}

// スクリプト実行
main().catch((error) => {
  console.error('エラー:', error)
  process.exit(1)
})

