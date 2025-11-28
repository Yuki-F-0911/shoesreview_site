/**
 * Cloudinary設定
 */

import { v2 as cloudinary } from 'cloudinary'

// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

// アップロードプリセット（Cloudinaryダッシュボードで設定）
export const UPLOAD_PRESETS = {
  SHOE_IMAGE: 'shoe_images',
  REVIEW_IMAGE: 'review_images',
  USER_AVATAR: 'user_avatars',
} as const

// 画像変換オプション
export const TRANSFORM_OPTIONS = {
  // シューズサムネイル
  shoeThumb: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  },
  // シューズ詳細画像
  shoeDetail: {
    width: 800,
    height: 600,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
  },
  // レビュー画像
  reviewImage: {
    width: 600,
    height: 400,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
  },
  // ユーザーアバター
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  },
  // Open Graph画像
  ogImage: {
    width: 1200,
    height: 630,
    crop: 'fill',
    quality: 'auto',
    format: 'jpg',
  },
} as const

/**
 * Cloudinary URLを生成
 */
export function getCloudinaryUrl(
  publicId: string,
  options: Partial<typeof TRANSFORM_OPTIONS.shoeThumb> = {}
): string {
  return cloudinary.url(publicId, {
    ...options,
    secure: true,
  })
}

/**
 * 最適化されたURLを生成
 */
export function getOptimizedImageUrl(
  publicId: string,
  preset: keyof typeof TRANSFORM_OPTIONS
): string {
  const options = TRANSFORM_OPTIONS[preset]
  return cloudinary.url(publicId, {
    ...options,
    secure: true,
  })
}

