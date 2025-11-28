'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

interface ImageUploadFieldProps {
  images: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
  maxImages?: number
}

export function ImageUploadField({
  images,
  onChange,
  disabled = false,
  maxImages = 5,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return
    setIsUploading(true)
    setError(null)

    const currentImages = [...images]

    for (const file of Array.from(files)) {
      if (currentImages.length >= maxImages) {
        setError(`画像は最大${maxImages}枚までです`)
        break
      }

      if (file.type !== 'image/png') {
        setError('PNG形式のファイルのみアップロードできます')
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          setError(payload?.error || 'アップロードに失敗しました')
          continue
        }

        const payload = await response.json()
        currentImages.push(payload.data.url)
      } catch (uploadError) {
        console.error(uploadError)
        setError('アップロード中にエラーが発生しました')
      }
    }

    onChange(currentImages)
    setIsUploading(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const nextImages = images.filter((_, idx) => idx !== index)
    onChange(nextImages)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          multiple
          disabled={disabled || isUploading || images.length >= maxImages}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <span className="text-xs text-gray-500">PNG / 最大{maxImages}枚 / 5MBまで</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isUploading && <p className="text-sm text-gray-600">アップロード中...</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((url, index) => (
            <div key={url} className="relative rounded-md border border-gray-200 p-2">
              <div className="relative mb-2 aspect-video overflow-hidden rounded">
                <Image src={url} alt={`アップロード画像 ${index + 1}`} fill className="object-cover" sizes="200px" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => removeImage(index)}
                disabled={disabled || isUploading}
              >
                削除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


