import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-lg">
                S
              </div>
              <span className="text-lg font-bold text-gray-900">
                Stride
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              ランニングシューズの専門レビューサイト。AIが厳選した情報源から統合レビューをお届けします。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">コンテンツ</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/shoes" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  シューズ一覧
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  レビュー一覧
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  シューズを探す
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">サポート</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  よくある質問
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  このサイトについて
                </Link>
              </li>
              <li>
                <Link href="/developer" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  開発者向け情報
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">法的情報</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-center text-sm text-gray-400">
            &copy; 2025 Stride. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
