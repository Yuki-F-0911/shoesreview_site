'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
    reviewId: string
    initialIsBookmarked?: boolean
}

export function BookmarkButton({ reviewId, initialIsBookmarked = false }: BookmarkButtonProps) {
    const { data: session } = useSession()
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch(`/api/reviews/${reviewId}/bookmark`)
                if (response.ok) {
                    const data = await response.json()
                    setIsBookmarked(data.isBookmarked)
                }
            } catch (error) {
                console.error('Failed to fetch bookmark status:', error)
            }
        }

        fetchStatus()
    }, [reviewId])

    const handleToggle = async () => {
        if (!session) {
            window.location.href = '/login'
            return
        }

        if (isLoading) return

        setIsLoading(true)

        try {
            const method = isBookmarked ? 'DELETE' : 'POST'
            const response = await fetch(`/api/reviews/${reviewId}/bookmark`, { method })

            if (response.ok) {
                const data = await response.json()
                setIsBookmarked(data.isBookmarked)
            }
        } catch (error) {
            console.error('Failed to toggle bookmark:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleToggle()
            }}
            disabled={isLoading}
            className={`
                inline-flex items-center px-2 py-1.5 rounded-full text-sm
                transition-colors duration-200
                ${isBookmarked
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={isBookmarked ? 'ブックマークを解除' : 'ブックマークする'}
        >
            <Bookmark
                className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}
            />
        </button>
    )
}
