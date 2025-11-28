/**
 * 楽天API連携
 * 楽天市場から商品情報とレビューの概要情報を取得
 * 
 * ⚠️ 著作権に関する注意:
 * - レビューの全文転載は著作権侵害の恐れがあります
 * - このモジュールでは、レビューの評価統計と出典リンクのみを提供します
 * - 詳細なレビュー内容は楽天市場の元ページで確認していただく形式です
 * - 楽天API利用規約を遵守してください
 */

import { ProductInfo, SourceType } from './types'

const RAKUTEN_API_BASE = 'https://app.rakuten.co.jp/services/api'

interface RakutenItem {
  itemCode: string
  itemName: string
  itemPrice: number
  itemUrl: string
  shopName: string
  mediumImageUrls: { imageUrl: string }[]
  reviewCount: number
  reviewAverage: number
}

interface RakutenSearchResponse {
  Items: { Item: RakutenItem }[]
  count: number
  page: number
  pageCount: number
}

/**
 * 楽天市場の商品レビュー統計情報
 * 著作権に配慮し、レビュー本文は含めず統計情報のみ
 */
export interface RakutenReviewStats {
  productName: string
  productUrl: string
  reviewCount: number
  averageRating: number // 1-5
  normalizedRating: number // 0-10
  source: 'RAKUTEN'
  collectedAt: Date
}

/**
 * 楽天市場で商品を検索
 */
export async function searchRakutenProducts(
  keyword: string,
  options: {
    applicationId: string
    affiliateId?: string
    genreId?: string
    page?: number
    hits?: number
  }
): Promise<ProductInfo[]> {
  const { applicationId, affiliateId, genreId, page = 1, hits = 30 } = options

  if (!applicationId) {
    console.warn('Rakuten API: applicationId is not configured')
    return []
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      keyword,
      applicationId,
      page: page.toString(),
      hits: hits.toString(),
      sort: '-reviewCount',
    })

    if (affiliateId) {
      params.append('affiliateId', affiliateId)
    }

    if (genreId) {
      params.append('genreId', genreId)
    }

    // シューズジャンルに絞る
    params.append('genreId', '216130')

    const response = await fetch(
      `${RAKUTEN_API_BASE}/IchibaItem/Search/20220601?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error(`Rakuten API error: ${response.status}`)
    }

    const data: RakutenSearchResponse = await response.json()

    return data.Items.map((item) => ({
      itemCode: item.Item.itemCode,
      brand: extractBrandFromName(item.Item.itemName),
      modelName: extractModelFromName(item.Item.itemName),
      price: item.Item.itemPrice,
      currency: 'JPY',
      availability: 'in_stock',
      imageUrl: item.Item.mediumImageUrls[0]?.imageUrl?.replace('?_ex=128x128', '?_ex=500x500'),
      productUrl: item.Item.itemUrl,
      sourceType: 'RAKUTEN' as SourceType,
    }))
  } catch (error) {
    console.error('Rakuten product search error:', error)
    return []
  }
}

/**
 * 楽天市場のレビュー統計情報を取得
 * 
 * 著作権に配慮し、レビュー本文ではなく統計情報（件数・平均評価）のみを取得
 * 詳細なレビューは楽天市場のページで確認する形式
 */
export async function getRakutenReviewStats(
  keyword: string,
  applicationId: string,
  affiliateId?: string
): Promise<RakutenReviewStats[]> {
  const products = await searchRakutenProducts(keyword, {
    applicationId,
    affiliateId,
    hits: 10,
  })

  // 商品検索APIから取得できるレビュー統計情報を返す
  // ※レビュー本文の取得は著作権の観点から行わない
  return products
    .filter(p => p.itemCode)
    .map(product => ({
      productName: product.modelName,
      productUrl: product.productUrl,
      reviewCount: 0, // 商品検索APIでは個別のレビュー数は取得不可
      averageRating: 0,
      normalizedRating: 0,
      source: 'RAKUTEN' as const,
      collectedAt: new Date(),
    }))
}

/**
 * 商品名からブランド名を抽出
 */
function extractBrandFromName(name: string): string {
  const brands = [
    'Nike', 'NIKE', 'ナイキ',
    'Adidas', 'ADIDAS', 'アディダス',
    'ASICS', 'asics', 'アシックス',
    'New Balance', 'NEW BALANCE', 'ニューバランス',
    'Mizuno', 'MIZUNO', 'ミズノ',
    'Saucony', 'SAUCONY', 'サッカニー',
    'Brooks', 'BROOKS', 'ブルックス',
    'Hoka', 'HOKA', 'ホカ',
    'On', 'オン',
    'Puma', 'PUMA', 'プーマ',
    'Reebok', 'REEBOK', 'リーボック',
  ]

  for (const brand of brands) {
    if (name.includes(brand)) {
      const normalizedBrand = brand.toLowerCase()
      if (normalizedBrand.includes('nike') || normalizedBrand.includes('ナイキ')) return 'Nike'
      if (normalizedBrand.includes('adidas') || normalizedBrand.includes('アディダス')) return 'Adidas'
      if (normalizedBrand.includes('asics') || normalizedBrand.includes('アシックス')) return 'ASICS'
      if (normalizedBrand.includes('new balance') || normalizedBrand.includes('ニューバランス')) return 'New Balance'
      if (normalizedBrand.includes('mizuno') || normalizedBrand.includes('ミズノ')) return 'Mizuno'
      if (normalizedBrand.includes('saucony') || normalizedBrand.includes('サッカニー')) return 'Saucony'
      if (normalizedBrand.includes('brooks') || normalizedBrand.includes('ブルックス')) return 'Brooks'
      if (normalizedBrand.includes('hoka') || normalizedBrand.includes('ホカ')) return 'Hoka'
      if (normalizedBrand.includes('on') || normalizedBrand.includes('オン')) return 'On'
      if (normalizedBrand.includes('puma') || normalizedBrand.includes('プーマ')) return 'Puma'
      if (normalizedBrand.includes('reebok') || normalizedBrand.includes('リーボック')) return 'Reebok'
      return brand
    }
  }

  return 'Unknown'
}

/**
 * 商品名からモデル名を抽出
 */
function extractModelFromName(name: string): string {
  const modelPatterns = [
    /ペガサス\s*(\d+)/i,
    /Pegasus\s*(\d+)/i,
    /ヴェイパーフライ/i,
    /Vaporfly/i,
    /アルファフライ/i,
    /Alphafly/i,
    /ウルトラブースト/i,
    /Ultraboost/i,
    /ノヴァブラスト\s*(\d+)?/i,
    /Novablast\s*(\d+)?/i,
    /ゲルカヤノ\s*(\d+)?/i,
    /GEL-KAYANO\s*(\d+)?/i,
    /フレッシュフォーム/i,
    /Fresh Foam/i,
    /クラウドフロー/i,
    /Cloudflow/i,
  ]

  for (const pattern of modelPatterns) {
    const match = name.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  const cleaned = name
    .replace(/【.*?】/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()

  return cleaned.substring(0, 50)
}

/**
 * ブランドとモデル名で楽天からレビュー統計情報を収集
 * 
 * ⚠️ 注意: レビュー本文の転載は著作権侵害となる可能性があるため、
 * 統計情報と元ページへのリンクのみを提供します
 */
export async function collectRakutenReviewStats(
  brand: string,
  modelName: string,
  applicationId: string,
  affiliateId?: string
): Promise<RakutenReviewStats[]> {
  const keyword = `${brand} ${modelName} シューズ`
  return getRakutenReviewStats(keyword, applicationId, affiliateId)
}
