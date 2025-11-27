/**
 * Web記事スクレイピング機能
 * レビュー記事から情報を抽出
 */

import * as cheerio from 'cheerio'

export interface WebArticleInfo {
  title: string
  author?: string
  content: string
  publishedAt?: Date
  url: string
  rawHtml?: string // 元のHTML（オプション）
  metadata?: {
    description?: string
    keywords?: string
    ogImage?: string
  }
}

/**
 * Web記事をスクレイピングして情報を抽出
 * @param url 記事のURL
 * @returns 記事情報
 */
export async function scrapeWebArticle(url: string): Promise<WebArticleInfo> {
  try {
    // Fetch APIを使用してHTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // タイトルを抽出（og:title > title > h1の順で試行）
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      'タイトル不明'

    // 著者を抽出（authorメタタグ、rel="author"など）
    const author =
      $('meta[name="author"]').attr('content') ||
      $('[rel="author"]').first().text() ||
      $('.author').first().text() ||
      undefined

    // 本文を抽出（articleタグ、mainタグ、または特定のクラス）
    let content = ''
    const contentSelectors = [
      'article',
      'main',
      '.article-content',
      '.post-content',
      '.entry-content',
      '#content',
    ]

    for (const selector of contentSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        // スクリプトやスタイルを除去
        element.find('script, style, nav, footer, aside, .ad, .advertisement').remove()
        content = element.text().trim()
        if (content.length > 100) {
          break
        }
      }
    }

    // フォールバック: body全体から不要な要素を除去
    if (!content || content.length < 100) {
      const body = $('body').clone()
      body.find('script, style, nav, footer, aside, .ad, .advertisement, header').remove()
      content = body.text().trim()
    }

    // 公開日を抽出
    const publishedAtStr =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      $('.published').attr('datetime') ||
      undefined

    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : undefined

    // メタデータを抽出
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')
    const keywords = $('meta[name="keywords"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')

    return {
      title: title.trim(),
      author: author?.trim(),
      content: content.trim(),
      publishedAt,
      url,
      rawHtml: html, // 元のHTMLを保存（オプション、必要に応じてコメントアウト）
      metadata: {
        description: description?.trim(),
        keywords: keywords?.trim(),
        ogImage: ogImage?.trim(),
      },
    }
  } catch (error) {
    console.error('Web scraping error:', error)
    throw new Error(`Web記事のスクレイピングに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
  }
}

