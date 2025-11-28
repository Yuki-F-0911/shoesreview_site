'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

// 管理者メールアドレスのリスト（環境変数から取得するのが望ましい）
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean)

function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false
  // 環境変数が設定されていない場合は、特定のドメインをチェック
  if (ADMIN_EMAILS.length === 0) {
    return email.endsWith('@admin.local') || email === 'admin@example.com'
  }
  return ADMIN_EMAILS.includes(email)
}

export function Header() {
  const { data: session } = useSession()
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const isAdmin = isAdminUser(session?.user?.email)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-gray-900">シューズレビュー</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Link href="/reviews" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            レビュー一覧
          </Link>
          <Link href="/shoes" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            シューズ一覧
          </Link>
          <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            検索
          </Link>
          <Link href="/faq" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            FAQ
          </Link>

          {/* 管理者メニュー */}
          {session && isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                管理者 ▼
              </button>
              {showAdminMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                  <Link
                    href="/admin/shoes"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    シューズ管理
                  </Link>
                  <Link
                    href="/admin/media"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    画像管理
                  </Link>
                  <Link
                    href="/admin/curation"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    キュレーション
                  </Link>
                  <Link
                    href="/admin/reviews/auto-curate"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAdminMenu(false)}
                  >
                    AI自動キュレート
                  </Link>
                </div>
              )}
            </div>
          )}

          {session ? (
            <div className="flex items-center space-x-4">
              <Link href="/reviews/new">
                <Button size="sm">レビューを投稿</Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <Avatar src={null} fallback={session.user?.name?.[0] || 'U'} />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  ログイン
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">登録</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

