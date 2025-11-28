/**
 * ⚠️ 警告: このスクリプトは廃止されました
 * 
 * 著作権および利用規約の遵守について:
 * 
 * このスクリプトは元々スクレイピングで取得したバックアップレビューを
 * インポートするために作成されましたが、以下の理由から使用できません：
 * 
 * 1. **著作権侵害のリスク**
 *    - 他サイトのレビューを転載することは著作権侵害になります
 * 
 * 2. **バックアップデータの削除**
 *    - scrayping/backup/ フォルダは著作権保護のため削除されました
 * 
 * 3. **推奨される代替方法**
 *    - サイト独自のユーザーレビュー機能を使用
 *    - 公式APIを通じて取得した情報のみを使用
 * 
 * このスクリプトは実行しても動作しません。
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
      isPublished: true,
      isDraft: false,
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
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60))
  console.log('バックアップフォルダからレビューをインポート')
  console.log('='.repeat(60))

  const backupDir = path.join(process.cwd(), 'scrayping', 'backup')
  
  if (!fs.existsSync(backupDir)) {
    console.error(`\nエラー: バックアップフォルダが見つかりません: ${backupDir}`)
    process.exit(1)
  }

  // バックアップフォルダ内のすべてのJSONファイルを読み込む
  const jsonFiles = fs.readdirSync(backupDir).filter((file) => file.endsWith('.json'))
  
  console.log(`\n見つかったJSONファイル: ${jsonFiles.length}件`)

  const allReviews: ScrapedReview[] = []

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(backupDir, jsonFile)
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data: ScrapedReview[] = JSON.parse(fileContent)
      allReviews.push(...data)
      console.log(`  ✓ ${jsonFile}: ${data.length}件のレビューを読み込み`)
    } catch (error) {
      console.error(`  ✗ ${jsonFile}の読み込みエラー:`, error)
    }
  }

  console.log(`\n合計 ${allReviews.length}件のレビューを読み込みました`)

  // 有効なレビューを抽出
  const validReviews: Array<{
    parsedData: ParsedData
    sourceUrl: string
    sourceTitle?: string
  }> = []

  for (const review of allReviews) {
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

  // 各レビューを処理
  let processedCount = 0
  let createdCount = 0
  let skippedCount = 0

  for (const [key, reviews] of shoeGroups.entries()) {
    const shoeInfo = reviews[0].parsedData.product_info
    console.log(`\n処理中: ${shoeInfo.brand_name} ${shoeInfo.model_name} (${reviews.length}件のレビュー)`)

    // 靴を検索または作成
    const shoeId = await findOrCreateShoe(shoeInfo)

    // 各レビューを処理
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
          skippedCount++
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
        createdCount++
      } catch (error) {
        console.error(`  ✗ エラー: ${reviewData.sourceUrl}`, error)
      }
    }

    processedCount++
  }

  console.log('\n' + '='.repeat(60))
  console.log(`処理完了:`)
  console.log(`  処理した靴の種類: ${processedCount}種類`)
  console.log(`  作成したレビュー: ${createdCount}件`)
  console.log(`  スキップしたレビュー: ${skippedCount}件`)
  console.log('='.repeat(60))

  await prisma.$disconnect()
}

// スクリプト実行
main().catch((error) => {
  console.error('エラー:', error)
  process.exit(1)
})

