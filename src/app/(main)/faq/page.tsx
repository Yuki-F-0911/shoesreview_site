import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/seo/structured-data'
import { Plus, Minus } from 'lucide-react'

// SSG: ビルド時に静的HTMLを生成（最速配信）
export const dynamic = 'force-static'

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

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* ヘッダー */}
          <header className="mb-12">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4 border-b pb-4">
              よくある質問
            </h1>
            <p className="text-neutral-600">
              ランニングシューズ選びに関する疑問にお答えします。
            </p>
          </header>

          {/* カテゴリ別FAQ */}
          <div className="space-y-10">
            {faqs.map((category, categoryIndex) => (
              <section key={categoryIndex}>
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                  <span className="w-1 h-6 bg-neutral-900 mr-3"></span>
                  {category.category}
                </h2>
                <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
                  {category.questions.map((faq, index) => (
                    <details
                      key={index}
                      className="group bg-white"
                    >
                      <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-neutral-50 transition-colors list-none">
                        <h3 className="text-base font-medium text-neutral-800 pr-4">
                          Q. {faq.question}
                        </h3>
                        <div className="text-neutral-400 group-open:rotate-180 transition-transform duration-200">
                          <Plus className="h-5 w-5 group-open:hidden" />
                          <Minus className="h-5 w-5 hidden group-open:block" />
                        </div>
                      </summary>
                      <div className="px-6 pb-6 pt-0 animate-accordion-down">
                        <div className="text-neutral-600 leading-relaxed pl-4 border-l-2 border-neutral-100">
                          <span className="font-bold text-neutral-400 mr-2">A.</span>
                          {faq.answer}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* 関連リンク */}
          <section className="mt-16 bg-neutral-900 rounded-lg p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-3">
              解決しない場合
            </h2>
            <p className="mb-6 text-neutral-300 text-sm">
              サポートページからお問い合わせください
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/support"
                className="bg-white text-neutral-900 font-medium px-6 py-2.5 rounded hover:bg-neutral-100 transition-colors text-sm"
              >
                問い合わせる
              </a>
              <a
                href="/shoes"
                className="border border-white/30 text-white font-medium px-6 py-2.5 rounded hover:bg-white/10 transition-colors text-sm"
              >
                シューズを探す
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

