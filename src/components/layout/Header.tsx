'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export function Header() {
  const { data: session } = useSession()

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

