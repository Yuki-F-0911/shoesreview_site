/**
 * 画像アップロードAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { uploadBase64Image, uploadMultipleImages } from '@/lib/cloudinary/upload'

// 許可されるファイルタイプ
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// 最大ファイルサイズ (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface UploadRequest {
  images: {
    data: string // base64
    filename?: string
    type?: string
  }[]
  folder?: string
  category?: 'shoe' | 'review' | 'avatar'
  entityId?: string
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: UploadRequest = await request.json()

    // バリデーション
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    // 最大10枚まで
    if (body.images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed per upload' },
        { status: 400 }
      )
    }

    // 各画像のバリデーション
    for (const image of body.images) {
      // base64形式のチェック
      if (!image.data.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image data format. Must be base64 encoded.' },
          { status: 400 }
        )
      }

      // MIMEタイプの抽出とチェック
      const mimeMatch = image.data.match(/^data:(image\/\w+);base64,/)
      if (!mimeMatch) {
        return NextResponse.json(
          { error: 'Invalid image data format' },
          { status: 400 }
        )
      }

      const mimeType = mimeMatch[1]
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { error: `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      // ファイルサイズのチェック（base64は約1.37倍になる）
      const base64Data = image.data.split(',')[1]
      const fileSize = (base64Data.length * 3) / 4
      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
    }

    // フォルダの決定
    let folder = 'shoes-review/general'
    let preset: 'SHOE_IMAGE' | 'REVIEW_IMAGE' | 'USER_AVATAR' | undefined

    switch (body.category) {
      case 'shoe':
        folder = 'shoes-review/shoes'
        preset = 'SHOE_IMAGE'
        break
      case 'review':
        folder = 'shoes-review/reviews'
        preset = 'REVIEW_IMAGE'
        break
      case 'avatar':
        folder = 'shoes-review/avatars'
        preset = 'USER_AVATAR'
        break
    }

    // タグの生成
    const tags = [body.category || 'general']
    if (body.entityId) {
      tags.push(body.entityId)
    }
    tags.push(session.user.id || 'unknown')

    // アップロード実行
    const results = await uploadMultipleImages(
      body.images.map((img, idx) => ({
        data: img.data,
        filename: img.filename || `${body.category || 'image'}_${Date.now()}_${idx}`,
      })),
      {
        folder,
        preset,
        tags,
      }
    )

    // 成功したアップロードのURLを抽出
    const uploadedUrls = results
      .filter(r => r.success)
      .map(r => ({
        url: r.secureUrl || r.url,
        publicId: r.publicId,
        width: r.width,
        height: r.height,
      }))

    // エラーがあった場合の処理
    const errors = results.filter(r => !r.success).map(r => r.error)

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: 'All uploads failed', details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

