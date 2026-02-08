'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Lock, UserPlus, LogIn } from 'lucide-react'

interface ReviewContentGateProps {
    content: string
    type: string // 'USER' or 'AI_SUMMARY'
    previewLength?: number
    children?: React.ReactNode
}

export function ReviewContentGate({
    content,
    type,
    previewLength = 200,
    children,
}: ReviewContentGateProps) {
    const { data: session, status } = useSession()

    // AI生成レビューは全文表示
    if (type === 'AI_SUMMARY') {
        return <>{children || content}</>
    }

    // ログイン済みの場合は全文表示
    if (session) {
        return <>{children || content}</>
    }

    // 認証状態確認中
    if (status === 'loading') {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
        )
    }

    // コンテンツが短い場合は全文表示
    if (!content || content.length <= previewLength) {
        return <>{children || content}</>
    }

    // 未ログインの場合は途中まで表示+ゲート
    const previewContent = content.substring(0, previewLength)

    return (
        <div className="relative">
            {/* プレビューコンテンツ */}
            <div className="relative">
                <p className="text-gray-700 whitespace-pre-wrap">
                    {previewContent}
                </p>
                {/* グラデーションオーバーレイ */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* ゲートUI */}
            <div className="relative mt-[-4rem] pt-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 text-gray-600 mb-4">
                        <Lock size={24} className="text-gray-400" />
                        <span className="font-medium">続きを読むには会員登録が必要です</span>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        会員登録すると、すべてのレビューを読むことができます。<br />
                        また、あなたに合ったシューズのレコメンドも受けられます。
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <UserPlus size={18} />
                            無料で会員登録する
                        </Link>
                        <Link
                            href={`/login?callbackUrl=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            <LogIn size={18} />
                            ログインする
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
