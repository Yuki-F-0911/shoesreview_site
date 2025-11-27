export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">シューズレビュー</h3>
            <p className="mt-2 text-sm text-gray-600">
              シューズのレビューを投稿・閲覧できるプラットフォーム
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">リンク</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <a href="/reviews" className="text-sm text-gray-600 hover:text-gray-900">
                  レビュー一覧
                </a>
              </li>
              <li>
                <a href="/shoes" className="text-sm text-gray-600 hover:text-gray-900">
                  シューズ一覧
                </a>
              </li>
              <li>
                <a href="/search" className="text-sm text-gray-600 hover:text-gray-900">
                  検索
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">その他</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <a href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  このサイトについて
                </a>
              </li>
              <li>
                <a href="/developer" className="text-sm text-gray-600 hover:text-gray-900">
                  開発者向け情報
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  利用規約
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  プライバシーポリシー
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2025 シューズレビューサイト. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

