import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: 'よくある質問（FAQ） - ランニングシューズ選びのQ&A',
  description: 'ランニングシューズ選びでよくある質問にお答えします。初心者からマラソンランナーまで、シューズ選びのコツ、サイズの選び方、おすすめブランドなど幅広い疑問を解決。',
  keywords: [
    'ランニングシューズ FAQ',
    'ランニングシューズ 選び方',
    'マラソンシューズ おすすめ',
    'ジョギングシューズ 初心者',
    'ランニングシューズ サイズ',
    'ランニングシューズ 寿命',
    'スパイク 選び方',
    'トレイルランニング シューズ',
  ],
  openGraph: {
    title: 'よくある質問（FAQ） - ランニングシューズ選びのQ&A',
    description: 'ランニングシューズ選びでよくある質問にお答えします。',
  },
}

const faqs = [
  {
    category: 'ランニングシューズの選び方',
    questions: [
      {
        question: 'ランニングシューズとジョギングシューズの違いは何ですか？',
        answer: 'ランニングシューズとジョギングシューズは基本的に同じカテゴリーですが、一般的にランニングシューズはより高速な走行向け、ジョギングシューズはゆっくりとした走行向けに設計されています。初心者の方は、クッション性の高いジョギングシューズから始めることをおすすめします。Nike、ASICS、New Balanceなど各ブランドが幅広いラインナップを提供しています。',
      },
      {
        question: 'マラソン用シューズはどう選べばいいですか？',
        answer: 'マラソン用シューズは、走行距離と目標タイムに応じて選びます。フルマラソン完走が目標なら、クッション性と耐久性を重視したトレーニングシューズ（Nike Pegasus、ASICS Gel-Nimbusなど）がおすすめ。サブ4以上を目指すなら、軽量でレスポンスの良いレーシングシューズ（Nike Vaporfly、Adidas Adizeroなど）を検討してください。',
      },
      {
        question: '初心者向けのランニングシューズのおすすめは？',
        answer: '初心者の方には、クッション性と安定性のバランスが良いシューズがおすすめです。具体的には、ASICS Gel-Kayano、Nike Air Zoom Structure、New Balance 880などが人気です。価格帯は1万円〜1万5千円程度で、週2-3回のランニングに適しています。',
      },
      {
        question: 'ランニングシューズのサイズ選びのコツは？',
        answer: 'ランニングシューズは通常、普段履く靴より0.5cm〜1cm大きいサイズを選びます。これは走行中に足がむくむことと、つま先にゆとりが必要なためです。試着の際は、実際に走るときと同じ厚さのソックスを履き、店内で軽くジョギングしてフィット感を確認することをおすすめします。',
      },
    ],
  },
  {
    category: 'シューズの特徴・機能',
    questions: [
      {
        question: 'カーボンプレートシューズとは何ですか？',
        answer: 'カーボンプレートシューズは、ミッドソールにカーボンファイバー製のプレートを内蔵したランニングシューズです。Nike Vaporfly、Adidas Adizero Pro、ASICS Metaspeedなどが代表的です。プレートの反発力により走行効率が向上し、記録更新に貢献しますが、脚への負担も大きいため、ある程度の走力がある方向けです。',
      },
      {
        question: 'ドロップ（ヒールトゥドロップ）とは何ですか？',
        answer: 'ドロップとは、かかとの厚みとつま先の厚みの差のことで、mm単位で表されます。ドロップが大きい（8-12mm）シューズはかかと着地に適し、ドロップが小さい（0-6mm）シューズは前足部着地やナチュラルな走りに適しています。初心者は中程度のドロップ（6-10mm）から始めるのがおすすめです。',
      },
      {
        question: 'トレイルランニングシューズの選び方は？',
        answer: 'トレイルランニングシューズは、グリップ力、プロテクション、排水性が重要です。Salomon、Hoka、La Sportivaなどが人気ブランドです。走るコースの難易度に応じて、岩場が多いならプロテクション重視、ぬかるみが多いならグリップ重視のモデルを選びましょう。',
      },
    ],
  },
  {
    category: 'メンテナンス・寿命',
    questions: [
      {
        question: 'ランニングシューズの寿命はどれくらいですか？',
        answer: 'ランニングシューズの寿命は一般的に500-800km程度です。ただし、体重、走り方、路面の状態によって異なります。ミッドソールのクッション性が低下したり、アウトソールのすり減りが目立つようになったら交換時期です。トレーニング用とレース用を使い分けることで、レースシューズの寿命を延ばすことができます。',
      },
      {
        question: 'ランニングシューズの洗い方は？',
        answer: 'ランニングシューズは、中性洗剤とぬるま湯で手洗いするのがベストです。洗濯機は型崩れの原因になるため避けましょう。洗った後は、新聞紙を詰めて風通しの良い日陰で乾燥させます。直射日光や乾燥機は、ミッドソールの劣化を早めるため避けてください。',
      },
    ],
  },
  {
    category: 'スパイク・陸上競技シューズ',
    questions: [
      {
        question: '陸上スパイクの選び方は？',
        answer: '陸上スパイクは種目によって選び方が異なります。短距離（100m-400m）は軽量でプレートが硬いもの、中距離（800m-1500m）はクッション性とスパイクピンのバランスが良いもの、長距離（3000m以上）はクッション性重視のモデルを選びます。Nike、ASICS、Mizunoが人気ブランドです。',
      },
      {
        question: 'スパイクピンの種類と使い分けは？',
        answer: 'スパイクピンは主にピラミッド型（オールウェザー用）、ニードル型（土トラック用）、クリスマスツリー型（グリップ重視）があります。オールウェザートラックでは7mm-9mmのピラミッドピン、土トラックでは9mm-12mmのニードルピンが一般的です。大会によって使用可能なピンの長さが規定されているので確認しましょう。',
      },
    ],
  },
]

export default function FAQPage() {
  const allQuestions = faqs.flatMap((cat) => cat.questions)
  const faqSchema = generateFAQSchema(allQuestions)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'ホーム', url: '/' },
    { name: 'よくある質問', url: '/faq' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combineSchemas(faqSchema, breadcrumbSchema)),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          {/* ヘッダー */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              よくある質問（FAQ）
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              ランニングシューズ選びでよくある質問にお答えします。
              初心者からマラソンランナーまで、シューズ選びのコツを解説。
            </p>
          </header>

          {/* カテゴリ別FAQ */}
          <div className="space-y-12">
            {faqs.map((category, categoryIndex) => (
              <section key={categoryIndex} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <h2 className="text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  {category.category}
                </h2>
                <div className="divide-y divide-slate-100">
                  {category.questions.map((faq, index) => (
                    <details
                      key={index}
                      className="group"
                    >
                      <summary className="flex items-center justify-between cursor-pointer px-6 py-4 hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-medium text-slate-800 pr-4">
                          {faq.question}
                        </h3>
                        <span className="text-indigo-600 group-open:rotate-180 transition-transform">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-4">
                        <p className="text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* 関連リンク */}
          <section className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              シューズレビューを探す
            </h2>
            <p className="mb-6 opacity-90">
              実際のユーザーレビューやAI統合レビューで、最適なシューズを見つけましょう
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="/shoes"
                className="bg-white text-indigo-600 font-medium px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                シューズ一覧を見る
              </a>
              <a
                href="/search"
                className="border-2 border-white text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                シューズを検索
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

