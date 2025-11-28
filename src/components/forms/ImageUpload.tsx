'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface UploadedImage {
  url: string
  publicId?: string
  width?: number
  height?: number
}

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  category?: 'shoe' | 'review' | 'avatar'
  entityId?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  category = 'review',
  entityId,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (disabled) return

    setError(null)
    setIsUploading(true)

    try {
      const remainingSlots = maxImages - value.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)

      if (filesToUpload.length === 0) {
        setError(`Maximum ${maxImages} images allowed`)
        return
      }

      // ファイルをbase64に変換
      const imageDataPromises = filesToUpload.map(file => {
        return new Promise<{ data: string; filename: string; type: string }>((resolve, reject) => {
          // ファイルタイプのチェック
          if (!file.type.startsWith('image/')) {
            reject(new Error(`${file.name} is not an image`))
            return
          }

          // ファイルサイズのチェック (5MB)
          if (file.size > 5 * 1024 * 1024) {
            reject(new Error(`${file.name} is too large (max 5MB)`))
            return
          }

          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              data: reader.result as string,
              filename: file.name.replace(/\.[^/.]+$/, ''),
              type: file.type,
            })
          }
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
          reader.readAsDataURL(file)
        })
      })

      const imageData = await Promise.all(imageDataPromises)

      // APIにアップロード
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageData,
          category,
          entityId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      if (result.uploaded && result.uploaded.length > 0) {
        const newUrls = result.uploaded.map((img: UploadedImage) => img.url)
        onChange([...value, ...newUrls])
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some uploads failed: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [value, onChange, maxImages, category, entityId, disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeImage = useCallback((index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }, [value, onChange])

  const canUploadMore = value.length < maxImages

  return (
    <div className={cn('space-y-4', className)}>
      {/* プレビューエリア */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <Image
                src={url}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* アップロードエリア */}
      {canUploadMore && !disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isUploading || disabled}
          />

          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">アップロード中...</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center rounded-full bg-gray-100 p-3">
                {dragOver ? (
                  <Upload className="h-6 w-6 text-blue-500" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">
                ドラッグ＆ドロップまたはクリックして画像を選択
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG, WebP, GIF (最大5MB、{maxImages - value.length}枚まで)
              </p>
            </>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 残りのスロット数 */}
      {value.length > 0 && canUploadMore && !disabled && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxImages} 枚アップロード済み
        </p>
      )}
    </div>
  )
}

