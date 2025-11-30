/**
 * Web記事検索機能
 * Google Custom Search APIまたはSerper APIを使用してレビュー記事を検索
 */

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  displayUrl: string
}

export interface WebSearchResponse {
  items: WebSearchResult[]
  totalResults: number
  searchTime?: number
}

/**
 * Google Custom Search APIを使用してWeb記事を検索
 * @param query 検索クエリ
 * @param maxResults 最大結果数（デフォルト: 10）
 * @returns 検索結果
 */
export async function searchWebArticlesWithGoogle(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResponse> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    throw new Error('GOOGLE_SEARCH_API_KEYとGOOGLE_SEARCH_ENGINE_ID環境変数が設定されていません')
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: Math.min(maxResults, 10).toString(), // Google APIは最大10件
    })

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Search API error: ${error}`)
    }

    const data = await response.json()

    const items: WebSearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
    }))

    return {
      items,
      totalResults: parseInt(data.searchInformation?.totalResults || '0', 10),
      searchTime: parseFloat(data.searchInformation?.searchTime || '0'),
    }
  } catch (error) {
    console.error('Google Search error:', error)
    throw new Error(
      `Web検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Serper APIを使用してWeb記事を検索（代替手段）
 * @param query 検索クエリ
 * @param maxResults 最大結果数（デフォルト: 10）
 * @returns 検索結果
 */
export async function searchWebArticlesWithSerper(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    throw new Error('SERPER_API_KEY環境変数が設定されていません')
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Serper API error: ${error}`)
    }

    const data = await response.json()

    const items: WebSearchResult[] = (data.organic || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink || item.link,
    }))

    return {
      items,
      totalResults: data.searchInformation?.totalResults || 0,
      searchTime: data.searchInformation?.searchTime || 0,
    }
  } catch (error) {
    console.error('Serper Search error:', error)
    throw new Error(
      `Web検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Web記事を検索（利用可能なAPIを自動選択）
 * @param query 検索クエリ
 * @param maxResults 最大結果数
 * @returns 検索結果
 */
export async function searchWebArticles(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResponse> {
  // Serper APIを優先（より簡単に設定可能）
  if (process.env.SERPER_API_KEY) {
    return searchWebArticlesWithSerper(query, maxResults)
  }

  // Google Custom Search APIをフォールバック
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
    return searchWebArticlesWithGoogle(query, maxResults)
  }

  throw new Error(
    'Web検索APIが設定されていません。SERPER_API_KEYまたはGOOGLE_SEARCH_API_KEYとGOOGLE_SEARCH_ENGINE_IDを設定してください。'
  )
}

/**
 * シューズのレビュー記事を検索
 * @param brand ブランド名
 * @param modelName モデル名
 * @param maxResults 最大結果数
 * @returns 検索結果
 */
export async function searchShoeReviewArticles(
  brand: string,
  modelName: string,
  maxResults: number = 10
): Promise<WebSearchResponse> {
  const query = `${brand} ${modelName} review レビュー`
  return searchWebArticles(query, maxResults)
}


/**
 * Google Custom Search APIを使用して画像を検索
 * @param query 検索クエリ
 * @param maxResults 最大結果数（デフォルト: 10）
 * @returns 検索結果
 */
export async function searchImages(
  query: string,
  maxResults: number = 10
): Promise<WebSearchResponse> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  // Serper API for images
  if (process.env.SERPER_API_KEY) {
    try {
      const response = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.SERPER_API_KEY,
        },
        body: JSON.stringify({
          q: query,
          num: maxResults,
        }),
      })

      if (!response.ok) {
        throw new Error(`Serper Image API error: ${await response.text()}`)
      }

      const data = await response.json()
      const items: WebSearchResult[] = (data.images || []).map((item: any) => ({
        title: item.title,
        url: item.imageUrl,
        snippet: item.title,
        displayUrl: item.source,
      }))

      return {
        items,
        totalResults: items.length,
        searchTime: 0
      }
    } catch (e) {
      console.error('Serper Image Search failed:', e)
    }
  }

  // Fallback to Google Custom Search
  if (!apiKey || !searchEngineId) {
    throw new Error('GOOGLE_SEARCH_API_KEYとGOOGLE_SEARCH_ENGINE_ID環境変数が設定されていません')
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      searchType: 'image', // Enable image search
      num: Math.min(maxResults, 10).toString(),
    })

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Search API error: ${error}`)
    }

    const data = await response.json()

    const items: WebSearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
    }))

    return {
      items,
      totalResults: parseInt(data.searchInformation?.totalResults || '0', 10),
      searchTime: parseFloat(data.searchInformation?.searchTime || '0'),
    }
  } catch (error) {
    console.error('Google Image Search error:', error)
    throw new Error(
      `画像検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
