'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Menu, X, Search, PenSquare, ChevronDown, Zap } from 'lucide-react'

// 管理者メールアドレスのリスト
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
  const isAdmin = isAdminUser(session?.user?.email)

  return (
    <header className="sticky top-0 z-50 w-full glass-dark border-b border-primary/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - サイバー風 */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary group-hover:animate-pulse-glow">
            <Zap className="h-5 w-5 text-cyber-black" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-bold text-white group-hover:text-primary transition-colors">
            <span className="text-glow">シューズ</span>
            <span className="text-accent">レビュー</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href="/shoes"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all hover:shadow-glow-sm"
          >
            シューズ
          </Link>
          <Link
            href="/reviews"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all hover:shadow-glow-sm"
          >
            レビュー
          </Link>
          <Link
            href="/search"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all hover:shadow-glow-sm"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Admin Menu */}
          {session && isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-all"
              >
                管理者
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {showAdminMenu && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowAdminMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl glass border border-primary/20 py-2 shadow-lg">
                    <div className="px-4 py-1.5 text-xs font-medium text-primary uppercase tracking-wider">シューズ・画像</div>
                    <Link
                      href="/admin/shoes"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      📦 シューズ管理
                    </Link>
                    <Link
                      href="/admin/media"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      🖼️ 画像管理
                    </Link>
                    <div className="my-2 border-t border-primary/10" />
                    <div className="px-4 py-1.5 text-xs font-medium text-primary uppercase tracking-wider">レビュー収集</div>
                    <Link
                      href="/admin/reviews/collect"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      📥 レビュー収集
                    </Link>
                    <Link
                      href="/admin/reviews/summarize"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      ✨ レビュー要約
                    </Link>
                    <Link
                      href="/admin/curation"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      📋 キュレーション
                    </Link>
                    <div className="my-2 border-t border-primary/10" />
                    <div className="px-4 py-1.5 text-xs font-medium text-primary uppercase tracking-wider">システム</div>
                    <Link
                      href="/admin/system"
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/10"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      ⚙️ システム設定
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {session ? (
            <>
              <Link href="/reviews/new">
                <Button size="sm" className="hidden sm:inline-flex bg-gradient-to-r from-primary to-accent text-cyber-black font-bold hover:shadow-glow-primary">
                  <PenSquare className="mr-2 h-4 w-4" />
                  レビュー投稿
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <Avatar src={null} fallback={session.user?.name?.[0] || 'U'} />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="hidden sm:inline-flex text-text-secondary hover:text-primary">
                  ログアウト
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-text-secondary hover:text-primary hover:bg-primary/10">
                  ログイン
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-cyber-black font-bold hover:shadow-glow-primary">
                  登録
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-primary/20 glass-dark">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            <Link
              href="/shoes"
              className="block px-4 py-3 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              onClick={() => setShowMobileMenu(false)}
            >
              シューズ
            </Link>
            <Link
              href="/reviews"
              className="block px-4 py-3 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              onClick={() => setShowMobileMenu(false)}
            >
              レビュー
            </Link>
            <Link
              href="/search"
              className="block px-4 py-3 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              onClick={() => setShowMobileMenu(false)}
            >
              検索
            </Link>
            <Link
              href="/faq"
              className="block px-4 py-3 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              onClick={() => setShowMobileMenu(false)}
            >
              FAQ
            </Link>
            {session && (
              <Link
                href="/reviews/new"
                className="block px-4 py-3 text-primary font-medium hover:bg-primary/10 rounded-lg transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                レビューを投稿
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
