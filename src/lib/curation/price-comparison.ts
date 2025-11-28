/**
 * 価格比較機能
 * 
 * ⚠️ 法的注意事項:
 * - 価格.com等の価格比較サイトへの直接スクレイピングは利用規約違反です
 * - 代わりに、各ECサイトの公式APIを使用するか、アフィリエイトリンクを提供してください
 * 
 * このモジュールは、公式APIを通じた価格情報の取得のみをサポートします。
 */

export interface PriceInfo {
  source: string
  price: number
  currency: string
  url: string
  lastUpdated: Date
  isAffiliate: boolean
}

/**
 * 価格比較リンクを生成（スクレイピングではなくリンク提供のみ）
 * 
 * ユーザーを各サイトに誘導し、そこで価格を確認してもらう形式
 */
export function generatePriceComparisonLinks(
  brand: string,
  modelName: string
): { siteName: string; searchUrl: string; note: string }[] {
  const query = encodeURIComponent(`${brand} ${modelName}`)
  
  return [
    {
      siteName: '楽天市場',
      searchUrl: `https://search.rakuten.co.jp/search/mall/${query}/`,
      note: '楽天市場で価格を確認',
    },
    {
      siteName: 'Amazon',
      searchUrl: `https://www.amazon.co.jp/s?k=${query}`,
      note: 'Amazonで価格を確認',
    },
    {
      siteName: 'Yahoo!ショッピング',
      searchUrl: `https://shopping.yahoo.co.jp/search?p=${query}`,
      note: 'Yahoo!ショッピングで価格を確認',
    },
    {
      siteName: '価格.com',
      searchUrl: `https://kakaku.com/search_results/${query}/`,
      note: '価格.comで価格を比較（外部サイト）',
    },
  ]
}

/**
 * 公式サイトへのリンクを生成
 */
export function generateOfficialSiteLink(brand: string): string | null {
  const officialSites: { [key: string]: string } = {
    'Nike': 'https://www.nike.com/jp/',
    'Adidas': 'https://www.adidas.jp/',
    'ASICS': 'https://www.asics.com/jp/ja-jp/',
    'New Balance': 'https://shop.newbalance.jp/',
    'Mizuno': 'https://www.mizuno.jp/',
    'Saucony': 'https://www.saucony-japan.com/',
    'Brooks': 'https://www.brooksrunning.co.jp/',
    'Hoka': 'https://www.hoka.com/jp/',
    'On': 'https://www.on-running.com/ja-jp/',
  }
  
  return officialSites[brand] || null
}

