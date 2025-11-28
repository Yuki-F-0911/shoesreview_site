/**
 * ローカルSEO・地域最適化
 * 日本向けのSEO設定
 */

// 日本の主要都市情報
export const JAPAN_CITIES = [
  { name: '東京', region: '関東', lat: 35.6762, lng: 139.6503 },
  { name: '大阪', region: '関西', lat: 34.6937, lng: 135.5023 },
  { name: '名古屋', region: '中部', lat: 35.1815, lng: 136.9066 },
  { name: '福岡', region: '九州', lat: 33.5904, lng: 130.4017 },
  { name: '札幌', region: '北海道', lat: 43.0618, lng: 141.3545 },
  { name: '神戸', region: '関西', lat: 34.6901, lng: 135.1955 },
  { name: '京都', region: '関西', lat: 35.0116, lng: 135.7681 },
  { name: '横浜', region: '関東', lat: 35.4437, lng: 139.6380 },
] as const

// ランニング関連の検索キーワード（日本語）
export const RUNNING_KEYWORDS_JA = {
  general: [
    'ランニングシューズ',
    'ジョギングシューズ',
    'マラソンシューズ',
    'ウォーキングシューズ',
    'スポーツシューズ',
  ],
  brands: [
    'ナイキ',
    'アディダス',
    'アシックス',
    'ニューバランス',
    'ミズノ',
    'ホカオネオネ',
    'オン',
    'サッカニー',
    'ブルックス',
  ],
  features: [
    'クッション性',
    '軽量',
    '安定性',
    '反発力',
    '通気性',
    '耐久性',
    'フィット感',
  ],
  purposes: [
    '初心者向け',
    'サブ4',
    'サブ3',
    'フルマラソン',
    'ハーフマラソン',
    '10km',
    '5km',
    'トレイルランニング',
    'ウルトラマラソン',
  ],
}

/**
 * 地域別のコンテンツ生成
 */
export function generateLocalContent(city: string): {
  title: string
  description: string
  keywords: string[]
} {
  const cityData = JAPAN_CITIES.find(c => c.name === city)
  
  return {
    title: `${city}で人気のランニングシューズ | シューズレビューサイト`,
    description: `${city}${cityData ? `（${cityData.region}）` : ''}のランナーに人気のランニングシューズをご紹介。地域のランニングショップ情報やおすすめのシューズを比較・レビュー。`,
    keywords: [
      `${city} ランニングシューズ`,
      `${city} マラソン`,
      `${city} ランニングショップ`,
      ...RUNNING_KEYWORDS_JA.general.map(k => `${city} ${k}`),
    ],
  }
}

/**
 * 日本語の形態素を考慮したキーワード生成
 */
export function generateJapaneseKeywords(brand: string, model: string): string[] {
  const keywords = new Set<string>()

  // 基本キーワード
  keywords.add(`${brand} ${model}`)
  keywords.add(`${brand} ${model} レビュー`)
  keywords.add(`${brand} ${model} 評価`)
  keywords.add(`${brand} ${model} 口コミ`)
  keywords.add(`${brand} ${model} 感想`)
  keywords.add(`${brand} ${model} おすすめ`)
  keywords.add(`${brand} ${model} 比較`)
  keywords.add(`${brand} ${model} 価格`)
  keywords.add(`${brand} ${model} サイズ感`)
  keywords.add(`${brand} ${model} 履き心地`)

  // 用途別
  const purposes = ['初心者', 'マラソン', 'ジョギング', 'デイリートレーナー']
  for (const purpose of purposes) {
    keywords.add(`${brand} ${model} ${purpose}`)
  }

  // 比較キーワード
  keywords.add(`${brand} ${model} vs`)
  keywords.add(`${brand} ${model} 違い`)
  keywords.add(`${brand} ${model} どっち`)

  return Array.from(keywords)
}

/**
 * FAQ用のよくある質問生成
 */
export function generateShoeFAQ(shoe: {
  brand: string
  modelName: string
  category: string
  officialPrice?: number | null
}): { question: string; answer: string }[] {
  const { brand, modelName, category, officialPrice } = shoe

  const faqs = [
    {
      question: `${brand} ${modelName}はどんなランナーにおすすめですか？`,
      answer: `${brand} ${modelName}は${category}カテゴリーのシューズです。詳しいレビューと評価を確認して、あなたのランニングスタイルに合うかどうかチェックしてみてください。`,
    },
    {
      question: `${brand} ${modelName}のサイズ感は？`,
      answer: `${brand} ${modelName}のサイズ感については、ユーザーレビューで実際に購入した方の感想を確認できます。一般的にランニングシューズは普段履きより0.5〜1.0cm大きめを選ぶことをおすすめします。`,
    },
    {
      question: `${brand} ${modelName}の重さは？`,
      answer: `${brand} ${modelName}の正確な重量はサイズによって異なります。詳細なスペックについてはユーザーレビューや公式サイトでご確認ください。`,
    },
  ]

  if (officialPrice) {
    faqs.push({
      question: `${brand} ${modelName}の価格は？`,
      answer: `${brand} ${modelName}の定価は¥${officialPrice.toLocaleString()}です。ただし、販売店によって価格が異なる場合があります。`,
    })
  }

  faqs.push({
    question: `${brand} ${modelName}と他のシューズの違いは？`,
    answer: `${brand} ${modelName}と他のシューズの比較については、当サイトのレビューを参考にしてください。複数のユーザーレビューとAI統合レビューで詳しい情報を提供しています。`,
  })

  return faqs
}

/**
 * hreflangタグ生成
 */
export function generateHreflangTags(path: string): {
  hrefLang: string
  href: string
}[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shoe-review.jp'
  
  return [
    { hrefLang: 'ja', href: `${baseUrl}${path}` },
    { hrefLang: 'x-default', href: `${baseUrl}${path}` },
    // 将来的に英語版を追加する場合
    // { hrefLang: 'en', href: `${baseUrl}/en${path}` },
  ]
}

/**
 * 日本のマラソン大会情報（SEOコンテンツ用）
 */
export const JAPAN_MARATHONS = [
  { name: '東京マラソン', month: 3, city: '東京' },
  { name: '大阪マラソン', month: 2, city: '大阪' },
  { name: '名古屋ウィメンズマラソン', month: 3, city: '名古屋' },
  { name: '福岡マラソン', month: 11, city: '福岡' },
  { name: '神戸マラソン', month: 11, city: '神戸' },
  { name: '京都マラソン', month: 2, city: '京都' },
  { name: 'NAHAマラソン', month: 12, city: '那覇' },
  { name: '横浜マラソン', month: 10, city: '横浜' },
]

/**
 * シーズン別おすすめコンテンツ
 */
export function getSeasonalContent(month: number): {
  title: string
  description: string
  keywords: string[]
} {
  // 春（3-5月）: マラソンシーズン終盤、新作発売時期
  if (month >= 3 && month <= 5) {
    return {
      title: '春のランニングシューズ特集',
      description: 'マラソンシーズン終盤から新シーズンに向けて、新作ランニングシューズをチェック。春のランニングに最適なシューズを厳選紹介。',
      keywords: ['春 ランニングシューズ', '新作 ランニングシューズ', '2024 新作'],
    }
  }
  
  // 夏（6-8月）: 軽量・通気性重視
  if (month >= 6 && month <= 8) {
    return {
      title: '夏のランニングに最適なシューズ',
      description: '暑い夏のランニングには通気性と軽量性が重要。夏におすすめのランニングシューズを紹介。',
      keywords: ['夏 ランニングシューズ', '通気性 ランニングシューズ', '軽量 ランニングシューズ'],
    }
  }
  
  // 秋（9-11月）: マラソンシーズン本番
  if (month >= 9 && month <= 11) {
    return {
      title: 'マラソンシーズン到来！レースシューズ特集',
      description: 'マラソンシーズン本番。本番用レースシューズとトレーニングシューズを徹底比較。',
      keywords: ['マラソン シューズ', 'レースシューズ', 'マラソン おすすめ シューズ'],
    }
  }
  
  // 冬（12-2月）: 保温性、室内ランニング
  return {
    title: '冬のランニングシューズ選び',
    description: '寒い冬でも快適にランニング。冬におすすめのランニングシューズと防寒対策を紹介。',
    keywords: ['冬 ランニングシューズ', '冬 ランニング', '防寒 ランニング'],
  }
}

