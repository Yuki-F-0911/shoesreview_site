import {
  searchWebArticles,
  type WebSearchResponse,
} from '@/lib/ai/web-search'

interface ExternalReviewSearchResult {
  title: string
  link: string
  snippet: string
}

type WebSearch = (
  query: string,
  maxResults: number
) => Promise<WebSearchResponse>

export async function searchExternalReviewResults(
  query: string,
  maxResults: number = 10,
  search: WebSearch = searchWebArticles
): Promise<ExternalReviewSearchResult[]> {
  const response = await search(query, maxResults)

  return response.items.map((item) => ({
    title: item.title,
    link: item.url,
    snippet: item.snippet,
  }))
}
