'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Menu, X, Search, ChevronDown, Home } from 'lucide-react'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean)

function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false
  if (ADMIN_EMAILS.length === 0) {
    return email.endsWith('@admin.local') || email === 'admin@example.com'
  }
  return ADMIN_EMAILS.includes(email)
}

export function Header() {
  const { data: session } = useSession()
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const isAdmin = isAdminUser(session?.user?.email)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* PC版ヘッダー */}
      <header className={`
        hidden lg:block sticky top-0 z-50 w-full bg-white border-b border-neutral-100
        transition-shadow duration-150
        ${isScrolled ? 'shadow-sm' : ''}
      `}>
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-neutral-900">Stride</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              ホーム
            </Link>
            <Link href="/shoes" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              シューズ
            </Link>
            <Link href="/reviews" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              レビュー
            </Link>
            <Link href="/search" className="text-neutral-500 hover:text-neutral-900 transition-colors">
              <Search className="h-4 w-4" />
            </Link>

            {session && isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  管理者
                  <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {showAdminMenu && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowAdminMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 py-1 shadow-dropdown animate-scale-in">
                      <div className="px-3 py-1 text-xs text-neutral-400">管理</div>
                      <Link href="/admin/shoes" className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setShowAdminMenu(false)}>
                        シューズ管理
                      </Link>
                      <Link href="/admin/media" className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setShowAdminMenu(false)}>
                        画像管理
                      </Link>
                      <div className="border-t border-neutral-100 my-1" />
                      <Link href="/admin/reviews/collect" className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setShowAdminMenu(false)}>
                        レビュー収集
                      </Link>
                      <Link href="/admin/reviews/summarize" className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setShowAdminMenu(false)}>
                        レビュー要約
                      </Link>
                      <Link href="/admin/curation" className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setShowAdminMenu(false)}>
                        キュレーション
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link href="/reviews/new">
                  <Button size="sm">投稿</Button>
                </Link>
                <Link href="/profile" className="hover:opacity-80 transition-opacity">
                  <Avatar src={null} fallback={session.user?.name?.[0] || 'U'} className="h-8 w-8" />
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-neutral-500 hover:text-neutral-700">
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900">
                  ログイン
                </Link>
                <Link href="/register">
                  <Button size="sm">登録</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* モバイル版ヘッダー */}
      <header className={`
        lg:hidden sticky top-0 z-50 w-full bg-white border-b border-neutral-100
        ${isScrolled ? 'shadow-sm' : ''}
      `}>
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-neutral-900">Stride</Link>
          <div className="flex items-center space-x-2">
            <Link href="/search" className="p-2 text-neutral-500">
              <Search className="h-5 w-5" />
            </Link>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-neutral-500">
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="border-t border-neutral-100 bg-white animate-fade-in">
            <nav className="px-4 py-2 space-y-1">
              <Link href="/shoes" className="block px-3 py-2 text-neutral-700 hover:bg-neutral-50" onClick={() => setShowMobileMenu(false)}>
                シューズ
              </Link>
              <Link href="/reviews" className="block px-3 py-2 text-neutral-700 hover:bg-neutral-50" onClick={() => setShowMobileMenu(false)}>
                レビュー
              </Link>
              {session && isAdmin && (
                <>
                  <div className="border-t border-neutral-100 my-2" />
                  <div className="px-3 py-1 text-xs text-neutral-400">管理者</div>
                  <Link href="/admin/shoes" className="block px-3 py-2 text-neutral-700 hover:bg-neutral-50" onClick={() => setShowMobileMenu(false)}>
                    シューズ管理
                  </Link>
                  <Link href="/admin/reviews/collect" className="block px-3 py-2 text-neutral-700 hover:bg-neutral-50" onClick={() => setShowMobileMenu(false)}>
                    レビュー収集
                  </Link>
                </>
              )}
              <div className="border-t border-neutral-100 my-2" />
              {session ? (
                <>
                  <Link href="/reviews/new" className="block px-3 py-2 font-medium text-neutral-900 hover:bg-neutral-50" onClick={() => setShowMobileMenu(false)}>
                    レビューを投稿
                  </Link>
                  <button onClick={() => { signOut({ callbackUrl: '/' }); setShowMobileMenu(false); }} className="w-full text-left px-3 py-2 text-neutral-500 hover:bg-neutral-50">
                    ログアウト
                  </button>
                </>
              ) : (
                <div className="flex space-x-2 px-3 py-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full" onClick={() => setShowMobileMenu(false)}>ログイン</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full" onClick={() => setShowMobileMenu(false)}>登録</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ボトムナビ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          <Link href="/" className="flex flex-col items-center py-2 text-neutral-500 hover:text-neutral-900">
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">ホーム</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center py-2 text-neutral-500 hover:text-neutral-900">
            <Search className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">検索</span>
          </Link>
          <Link href="/reviews/new" className="flex items-center justify-center -mt-3">
            <div className="flex h-10 w-10 items-center justify-center bg-neutral-900 text-white text-lg font-medium">
              +
            </div>
          </Link>
          <Link href="/reviews" className="flex flex-col items-center py-2 text-neutral-500 hover:text-neutral-900">
            <span className="text-sm font-medium">R</span>
            <span className="text-[10px] mt-0.5">レビュー</span>
          </Link>
          <Link href={session ? "/profile" : "/login"} className="flex flex-col items-center py-2 text-neutral-500 hover:text-neutral-900">
            <span className="text-sm">MY</span>
            <span className="text-[10px] mt-0.5">マイページ</span>
          </Link>
        </div>
      </nav>

      <div className="lg:hidden h-14" />
    </>
  )
}
