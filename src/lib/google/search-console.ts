/**
 * Google Search Console API client
 * Uses the same service account as Google Sheets
 */

import { google } from 'googleapis'

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''

function getSearchConsoleClient() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google service account credentials are not configured')
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  return google.searchconsole({ version: 'v1', auth })
}

function getSiteUrl(): string {
  if (!SITE_URL) {
    throw new Error('SITE_URL or NEXT_PUBLIC_SITE_URL is not configured')
  }
  return SITE_URL.replace(/\/$/, '')
}

export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchAnalyticsResult {
  rows: SearchAnalyticsRow[]
  responseAggregationType?: string
}

/**
 * Fetch search analytics data (keywords, pages, etc.)
 */
export async function fetchSearchAnalytics(options: {
  startDate: string
  endDate: string
  dimensions: ('query' | 'page' | 'device' | 'country' | 'date')[]
  rowLimit?: number
  startRow?: number
  dimensionFilterGroups?: Array<{
    filters: Array<{
      dimension: string
      operator: string
      expression: string
    }>
  }>
}): Promise<SearchAnalyticsResult> {
  const client = getSearchConsoleClient()
  const siteUrl = getSiteUrl()

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions,
      rowLimit: options.rowLimit || 100,
      startRow: options.startRow || 0,
      dimensionFilterGroups: options.dimensionFilterGroups,
    },
  })

  const rows: SearchAnalyticsRow[] = (response.data.rows || []).map((row) => ({
    keys: row.keys || [],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }))

  return {
    rows,
    responseAggregationType: response.data.responseAggregationType || undefined,
  }
}

/**
 * Fetch index coverage via URL inspection (batch)
 */
export async function inspectUrl(pageUrl: string): Promise<{
  verdict: string
  coverageState: string
  robotsTxtState: string
  indexingState: string
  lastCrawlTime: string | null
  pageFetchState: string
  referringUrls: string[]
}> {
  const client = getSearchConsoleClient()
  const siteUrl = getSiteUrl()

  const response = await client.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: pageUrl,
      siteUrl,
    },
  })

  const result = response.data.inspectionResult
  return {
    verdict: result?.indexStatusResult?.verdict || 'UNKNOWN',
    coverageState: result?.indexStatusResult?.coverageState || 'UNKNOWN',
    robotsTxtState: result?.indexStatusResult?.robotsTxtState || 'UNKNOWN',
    indexingState: result?.indexStatusResult?.indexingState || 'UNKNOWN',
    lastCrawlTime: result?.indexStatusResult?.lastCrawlTime || null,
    pageFetchState: result?.indexStatusResult?.pageFetchState || 'UNKNOWN',
    referringUrls: result?.indexStatusResult?.referringUrls || [],
  }
}

/**
 * Fetch sitemaps list
 */
export async function fetchSitemaps(): Promise<Array<{
  path: string
  lastSubmitted: string | null
  isPending: boolean
  isSitemapsIndex: boolean
  lastDownloaded: string | null
  warnings: number
  errors: number
}>> {
  const client = getSearchConsoleClient()
  const siteUrl = getSiteUrl()

  const response = await client.sitemaps.list({ siteUrl })

  return (response.data.sitemap || []).map((s) => ({
    path: s.path || '',
    lastSubmitted: s.lastSubmitted || null,
    isPending: s.isPending || false,
    isSitemapsIndex: s.isSitemapsIndex || false,
    lastDownloaded: s.lastDownloaded || null,
    warnings: Number(s.warnings) || 0,
    errors: Number(s.errors) || 0,
  }))
}
