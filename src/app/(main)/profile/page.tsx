import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { BookmarkButton } from '@/components/reviews/BookmarkButton'

export const metadata = {
    title: 'マイページ | Stride',
    description: 'プロフィールの編集と投稿したレビューの管理',
}

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    // ユーザー情報と統計を取得
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            _count: {
                select: {
                    reviews: true,
                    likes: true,
                },
            },
        },
    })

    if (!user) {
        redirect('/login')
    }

    // ユーザーのレビューを取得
    const reviews = await prisma.review.findMany({
        where: {
            userId: session.user.id,
            type: 'USER',
        },
        include: {
            shoe: true,
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
        orderBy: { postedAt: 'desc' },
        take: 10,
    })

    // ブックマークしたレビューを取得
    const bookmarks = await prisma.bookmark.findMany({
        where: { userId: session.user.id },
        include: {
            review: {
                include: {
                    shoe: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    })

    // 獲得いいね数を計算
    const receivedLikes = await prisma.like.count({
        where: {
            review: {
                userId: session.user.id,
            },
        },
    })

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* プロフィールヘッダー */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-start space-x-4">
                        <Avatar
                            src={user.avatarUrl}
                            fallback={user.displayName?.[0] || 'U'}
                            className="h-16 w-16"
                        />
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-neutral-900">{user.displayName}</h1>
                            <p className="text-neutral-500">@{user.username}</p>
                            {user.bio && (
                                <p className="mt-2 text-neutral-700">{user.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* 統計情報 */}
                    <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-neutral-900">{user._count.reviews}</div>
                            <div className="text-xs text-neutral-500">レビュー</div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-neutral-900">{receivedLikes}</div>
                            <div className="text-xs text-neutral-500">獲得いいね</div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-neutral-900">{user._count.likes}</div>
                            <div className="text-xs text-neutral-500">いいね済み</div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-neutral-900">{bookmarks.length}</div>
                            <div className="text-xs text-neutral-500">ブックマーク</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* クイックリンク */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/profile/integrations"
                    className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">🔗</span>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-medium text-neutral-900">外部サービス連携</h3>
                        <p className="text-sm text-neutral-500">Stravaなどと連携して活動を同期</p>
                    </div>
                </Link>
                <Link
                    href="/profile/shoes"
                    className="flex items-center p-4 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👟</span>
                    </div>
                    <div className="ml-4">
                        <h3 className="font-medium text-neutral-900">マイシューズ管理</h3>
                        <p className="text-sm text-neutral-500">シューズの使用距離を追跡</p>
                    </div>
                </Link>
            </div>

            {/* プロフィール編集フォーム */}
            <ProfileForm />

            {/* ブックマーク */}
            <Card>
                <CardHeader>
                    <CardTitle>ブックマーク</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {bookmarks.map(bookmark => (
                                <Link
                                    key={bookmark.id}
                                    href={`/reviews/${bookmark.review.id}`}
                                    className="block p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs text-neutral-400 uppercase tracking-wider">
                                                    {bookmark.review.shoe.brand}
                                                </span>
                                                <span className="text-xs text-neutral-300">•</span>
                                                <span className="text-xs text-neutral-400">
                                                    {bookmark.review.postedAt.toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-neutral-900">
                                                {bookmark.review.shoe.modelName}
                                            </h4>
                                            {(bookmark.review.content || bookmark.review.quickComment) && (
                                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                                    {bookmark.review.content || bookmark.review.quickComment}
                                                </p>
                                            )}
                                        </div>
                                        {bookmark.review.overallRating && (
                                            <div className="ml-4 text-right">
                                                <span className="text-xl font-bold text-neutral-900">
                                                    {Number(bookmark.review.overallRating).toFixed(1)}
                                                </span>
                                                <span className="text-xs text-neutral-400 ml-0.5">/10</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-3 text-xs text-neutral-500">
                                        <span>♥ {bookmark.review._count.likes}</span>
                                        <span>💬 {bookmark.review._count.comments}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-neutral-500">
                            まだブックマークしたレビューはありません
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* 投稿したレビュー */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>投稿したレビュー</CardTitle>
                        <Link
                            href="/reviews/new"
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            新しいレビューを投稿
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <Link
                                    key={review.id}
                                    href={`/reviews/${review.id}`}
                                    className="block p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs text-neutral-400 uppercase tracking-wider">
                                                    {review.shoe.brand}
                                                </span>
                                                <span className="text-xs text-neutral-300">•</span>
                                                <span className="text-xs text-neutral-400">
                                                    {review.postedAt.toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-neutral-900">
                                                {review.shoe.modelName}
                                            </h4>
                                            {(review.content || (review as any).quickComment) && (
                                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                                    {review.content || (review as any).quickComment}
                                                </p>
                                            )}
                                        </div>
                                        <div className="ml-4 text-right">
                                            <span className="text-xl font-bold text-neutral-900">
                                                {Number(review.overallRating).toFixed(1)}
                                            </span>
                                            <span className="text-xs text-neutral-400 ml-0.5">/10</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mt-3 text-xs text-neutral-500">
                                        <span>♥ {review._count.likes}</span>
                                        <span>💬 {review._count.comments}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-neutral-500 mb-4">まだレビューを投稿していません</p>
                            <Link
                                href="/reviews/new"
                                className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800"
                            >
                                最初のレビューを投稿する
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
