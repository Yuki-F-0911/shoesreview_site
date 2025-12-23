'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { MessageCircle } from 'lucide-react'

interface Comment {
    id: string
    content: string
    createdAt: string
    user: {
        id: string
        displayName: string
        avatarUrl: string | null
    }
}

interface CommentSectionProps {
    reviewId: string
}

export function CommentSection({ reviewId }: CommentSectionProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)

    // コメントを取得
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/reviews/${reviewId}/comments`)
                if (response.ok) {
                    const data = await response.json()
                    setComments(data.comments)
                }
            } catch (error) {
                console.error('Failed to fetch comments:', error)
            } finally {
                setIsFetching(false)
            }
        }

        fetchComments()
    }, [reviewId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session || !newComment.trim()) return

        setIsLoading(true)

        try {
            const response = await fetch(`/api/reviews/${reviewId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            if (response.ok) {
                const data = await response.json()
                setComments(prev => [...prev, data.comment])
                setNewComment('')
            }
        } catch (error) {
            console.error('Failed to post comment:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="mt-6 border-t border-neutral-100 pt-6">
            {/* コメントヘッダー */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-2 text-neutral-700 hover:text-neutral-900 transition-colors"
            >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">コメント</span>
                <span className="text-sm text-neutral-500">({comments.length})</span>
            </button>

            {isExpanded && (
                <div className="mt-4 space-y-4">
                    {/* コメント一覧 */}
                    {isFetching ? (
                        <p className="text-sm text-neutral-500">読み込み中...</p>
                    ) : comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex space-x-3">
                                    <Avatar
                                        src={comment.user.avatarUrl}
                                        fallback={comment.user.displayName?.[0] || 'U'}
                                        className="h-8 w-8 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-neutral-900">
                                                {comment.user.displayName}
                                            </span>
                                            <span className="text-xs text-neutral-500">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500">まだコメントはありません</p>
                    )}

                    {/* コメント投稿フォーム */}
                    {session ? (
                        <form onSubmit={handleSubmit} className="mt-4">
                            <Textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="コメントを入力..."
                                rows={2}
                                className="mb-2"
                                disabled={isLoading}
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isLoading || !newComment.trim()}
                                >
                                    {isLoading ? '投稿中...' : 'コメントする'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-neutral-500">
                            コメントするには
                            <a href="/login" className="text-blue-600 hover:underline">ログイン</a>
                            してください
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
