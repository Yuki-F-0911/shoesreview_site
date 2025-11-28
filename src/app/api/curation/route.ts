/**
 * キュレーションAPI
 * 複数のソースからシューズレビューを収集・統合
 */

import { NextRequest, NextResponse } from 'next/server'
import { aggregateReviews } from '@/lib/curation/aggregator'
import { CurationSearchParams, SourceType } from '@/lib/curation/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // バリデーション
    if (!body.brand || !body.modelName) {
      return NextResponse.json(
        { error: 'brand and modelName are required' },
        { status: 400 }
      )
    }

    const params: CurationSearchParams = {
      brand: body.brand,
      modelName: body.modelName,
      maxResults: body.maxResults || 50,
      sources: body.sources as SourceType[] | undefined,
      locale: body.locale || 'ja',
      includeImages: body.includeImages !== false,
    }

    console.log(`[Curation API] Starting curation for: ${params.brand} ${params.modelName}`)

    const result = await aggregateReviews(params)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to collect reviews', details: result.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Curation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const modelName = searchParams.get('modelName')

  if (!brand || !modelName) {
    return NextResponse.json(
      { error: 'brand and modelName query parameters are required' },
      { status: 400 }
    )
  }

  const params: CurationSearchParams = {
    brand,
    modelName,
    maxResults: parseInt(searchParams.get('maxResults') || '30', 10),
    locale: searchParams.get('locale') || 'ja',
    includeImages: searchParams.get('includeImages') !== 'false',
  }

  const sourcesParam = searchParams.get('sources')
  if (sourcesParam) {
    params.sources = sourcesParam.split(',') as SourceType[]
  }

  console.log(`[Curation API GET] Starting curation for: ${params.brand} ${params.modelName}`)

  try {
    const result = await aggregateReviews(params)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to collect reviews', details: result.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Curation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

