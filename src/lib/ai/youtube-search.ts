/**
 * YouTube検索機能
 * YouTube Data API v3を使用してレビュー動画を検索
 */

export interface YouTubeSearchResult {
  videoId: string
  title: string
  channelTitle: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  url: string
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchResult[]
  totalResults: number
  nextPageToken?: string
}

/**
 * YouTubeでレビュー動画を検索
 * @param query 検索クエリ（例: "Nike Air Max 270 review"）
 * @param maxResults 最大結果数（デフォルト: 10）
 * @param pageToken ページネーショントークン（オプション）
 * @returns 検索結果
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  // 大文字と小文字の両方をチェック
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YouTube_API_Key

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY環境変数が設定されていません')
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      videoCategoryId: '10', // Music category (レビュー動画が多い)
      key: apiKey,
    })

    if (pageToken) {
      params.append('pageToken', pageToken)
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`YouTube API error: ${error}`)
    }

    const data = await response.json()

    const items: YouTubeSearchResult[] = (data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || '',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))

    return {
      items,
      totalResults: data.pageInfo?.totalResults || 0,
      nextPageToken: data.nextPageToken,
    }
  } catch (error) {
    console.error('YouTube search error:', error)
    throw new Error(
      `YouTube検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * シューズのレビュー動画を検索
 * @param brand ブランド名
 * @param modelName モデル名
 * @param maxResults 最大結果数
 * @returns 検索結果
 */
export async function searchShoeReviewVideos(
  brand: string,
  modelName: string,
  maxResults: number = 10
): Promise<YouTubeSearchResponse> {
  const query = `${brand} ${modelName} review`
  return searchYouTubeVideos(query, maxResults)
}

