'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
    reviewId: string
    initialLikeCount?: number
    initialIsLiked?: boolean
}

export function LikeButton({ reviewId, initialLikeCount = 0, initialIsLiked = false }: LikeButtonProps) {
    const { data: session } = useSession()
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [isLoading, setIsLoading] = useState(false)

    // 初期データを取得
    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const response = await fetch(`/api/reviews/${reviewId}/like`)
                if (response.ok) {
                    const data = await response.json()
                    setLikeCount(data.likeCount)
                    setIsLiked(data.isLiked)
                }
            } catch (error) {
                console.error('Failed to fetch like status:', error)
            }
        }

        fetchLikeStatus()
    }, [reviewId])

    const handleToggleLike = async () => {
        if (!session) {
            // ログインページへリダイレクト
            window.location.href = '/login'
            return
        }

        if (isLoading) return

        setIsLoading(true)

        try {
            const method = isLiked ? 'DELETE' : 'POST'
            const response = await fetch(`/api/reviews/${reviewId}/like`, { method })

            if (response.ok) {
                const data = await response.json()
                setLikeCount(data.likeCount)
                setIsLiked(data.isLiked)
            }
        } catch (error) {
            console.error('Failed to toggle like:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggleLike}
            disabled={isLoading}
            className={`
                inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm
                transition-colors duration-200
                ${isLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={isLiked ? 'いいねを取り消す' : 'いいねする'}
        >
            <Heart
                className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
            />
            <span>{likeCount}</span>
        </button>
    )
}
