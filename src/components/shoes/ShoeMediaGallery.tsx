'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ShoeMedia } from '@/types/media'

interface ShoeMediaGalleryProps {
  media: ShoeMedia[]
  fallbackImages?: string[]
}

export function ShoeMediaGallery({ media, fallbackImages = [] }: ShoeMediaGalleryProps) {
  const galleryItems =
    media.length > 0
      ? media.map((item) => ({
          id: item.id,
          url: item.publicUrl,
          altText: item.altText || 'シューズ画像',
          source: item.sourceType,
        }))
      : fallbackImages.map((url, index) => ({
          id: `fallback-${index}`,
          url,
          altText: 'シューズ画像',
          source: 'BRAND',
        }))

  const [activeIndex, setActiveIndex] = useState(0)

  if (!galleryItems.length) {
    return null
  }

  const activeItem = galleryItems[Math.min(activeIndex, galleryItems.length - 1)]

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-100">
        <Image
          src={activeItem.url}
          alt={activeItem.altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-2 text-xs text-white">
          画像提供: {activeItem.source === 'ADMIN' ? '管理チーム' : 'ブランド / コミュニティ提供'}
        </div>
      </div>
      {galleryItems.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded border ${
                index === activeIndex ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'
              }`}
            >
              <Image src={item.url} alt={item.altText} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


