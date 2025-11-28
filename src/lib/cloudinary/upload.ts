/**
 * Cloudinary画像アップロード
 */

import { cloudinary, UPLOAD_PRESETS } from './config'
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'

export interface UploadResult {
  success: boolean
  publicId?: string
  url?: string
  secureUrl?: string
  width?: number
  height?: number
  format?: string
  bytes?: number
  error?: string
}

type PresetType = keyof typeof UPLOAD_PRESETS

/**
 * Base64画像をCloudinaryにアップロード
 */
export async function uploadBase64Image(
  base64Data: string,
  options: {
    folder?: string
    preset?: PresetType
    tags?: string[]
    publicId?: string
  } = {}
): Promise<UploadResult> {
  const { folder = 'shoes-review', preset, tags = [], publicId } = options

  try {
    // base64データのバリデーション
    if (!base64Data.startsWith('data:image/')) {
      return { success: false, error: 'Invalid image data format' }
    }

    const uploadOptions: Record<string, unknown> = {
      folder,
      tags,
      resource_type: 'image' as const,
      overwrite: true,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    }

    if (publicId) {
      uploadOptions.public_id = publicId
    }

    if (preset && UPLOAD_PRESETS[preset]) {
      uploadOptions.upload_preset = UPLOAD_PRESETS[preset]
    }

    const result = await cloudinary.uploader.upload(base64Data, uploadOptions)

    return {
      success: true,
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    const err = error as UploadApiErrorResponse
    return {
      success: false,
      error: err.message || 'Upload failed',
    }
  }
}

/**
 * URLから画像をCloudinaryにアップロード
 */
export async function uploadFromUrl(
  imageUrl: string,
  options: {
    folder?: string
    preset?: PresetType
    tags?: string[]
    publicId?: string
  } = {}
): Promise<UploadResult> {
  const { folder = 'shoes-review', preset, tags = [], publicId } = options

  try {
    const uploadOptions: Record<string, unknown> = {
      folder,
      tags,
      resource_type: 'image' as const,
      overwrite: true,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    }

    if (publicId) {
      uploadOptions.public_id = publicId
    }

    if (preset && UPLOAD_PRESETS[preset]) {
      uploadOptions.upload_preset = UPLOAD_PRESETS[preset]
    }

    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions)

    return {
      success: true,
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('Cloudinary URL upload error:', error)
    const err = error as UploadApiErrorResponse
    return {
      success: false,
      error: err.message || 'Upload failed',
    }
  }
}

/**
 * 複数の画像をアップロード
 */
export async function uploadMultipleImages(
  images: { data: string; filename?: string }[],
  options: {
    folder?: string
    preset?: PresetType
    tags?: string[]
  } = {}
): Promise<UploadResult[]> {
  const results = await Promise.all(
    images.map((image, index) =>
      uploadBase64Image(image.data, {
        ...options,
        publicId: image.filename || `image_${Date.now()}_${index}`,
      })
    )
  )

  return results
}

/**
 * 画像を削除
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

/**
 * 複数の画像を削除
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<boolean> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds)
    return Object.keys(result.deleted).length > 0
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error)
    return false
  }
}

/**
 * シューズ画像をアップロード
 */
export async function uploadShoeImage(
  imageData: string,
  shoeId: string,
  imageIndex: number = 0
): Promise<UploadResult> {
  return uploadBase64Image(imageData, {
    folder: 'shoes-review/shoes',
    preset: 'SHOE_IMAGE',
    tags: ['shoe', shoeId],
    publicId: `shoe_${shoeId}_${imageIndex}`,
  })
}

/**
 * レビュー画像をアップロード
 */
export async function uploadReviewImage(
  imageData: string,
  reviewId: string,
  imageIndex: number = 0
): Promise<UploadResult> {
  return uploadBase64Image(imageData, {
    folder: 'shoes-review/reviews',
    preset: 'REVIEW_IMAGE',
    tags: ['review', reviewId],
    publicId: `review_${reviewId}_${imageIndex}`,
  })
}

/**
 * ユーザーアバターをアップロード
 */
export async function uploadUserAvatar(
  imageData: string,
  userId: string
): Promise<UploadResult> {
  return uploadBase64Image(imageData, {
    folder: 'shoes-review/avatars',
    preset: 'USER_AVATAR',
    tags: ['avatar', userId],
    publicId: `avatar_${userId}`,
  })
}

