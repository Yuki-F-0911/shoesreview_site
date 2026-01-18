import { Metadata } from 'next'
import { generateAboutPageSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/seo/structured-data'

// SSG: ビルド時に静的HTMLを生成（最速配信）
export const dynamic = 'force-static'

export const metadata: Metadata = {
    title: '私たちについて | Stride',
    description: 'Stride（ストライド）は、ランナーのための公正なシューズレビュープラットフォームです。実際のランナーの声とデータに基づいた信頼できる情報を提供します。',
    openGraph: {
        title: '私たちについて | Stride',
        description: '公平で信頼できるランニングシューズ情報を提供することを目指しています。',
    },
}

export default function AboutPage() {
    const aboutSchema = generateAboutPageSchema()
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'ホーム', url: '/' },
        { name: '私たちについて', url: '/about' },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(combineSchemas(aboutSchema, breadcrumbSchema)),
                }}
            />

            <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-16 max-w-4xl">
                    {/* ヘッダーエリア */}
                    <div className="text-center mb-16 space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
                            私たちについて
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-neutral-500">
                            ランナーによる、ランナーのための公平な情報源
                        </p>
                    </div>

                    <div className="space-y-16">
                        {/* ビジョン */}
                        <section className="bg-neutral-50 rounded-2xl p-8 md:p-12 border border-neutral-100">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-6">ビジョン</h2>
                            <p className="text-neutral-700 leading-relaxed text-lg">
                                Stride（ストライド）の目的はシンプルです。
                                <br className="hidden md:block" />
                                すべてのランナーが、広告や先入観に惑わされず、本当に自分に合った一足と出会える世界を作ること。
                                膨大な選択肢の中から最適なパートナーを見つけるプロセスを、もっと透明で、もっと確実なものにします。
                            </p>
                        </section>

                        {/* 特徴・価値 */}
                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-8 border-b border-neutral-200 pb-4">
                                私たちが大切にしていること
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-neutral-900 flex items-center">
                                        <span className="bg-neutral-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">1</span>
                                        ユーザーレビューの透明性
                                    </h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        実際にそのシューズを履いて走ったランナーの「生の声」を最優先します。
                                        良い点も悪い点も包み隠さず公開し、レビュアーの走力や体格も併せて表示することで、
                                        あなたに近いランナーの意見を参考にできます。
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-neutral-900 flex items-center">
                                        <span className="bg-neutral-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">2</span>
                                        客観的なデータ分析
                                    </h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        個人の感想に加え、Web上の膨大な情報源をAI技術で分析・要約。
                                        主観的な意見と客観的な傾向を併せて提示することで、
                                        より多角的な視点からシューズの特徴を理解できるようサポートします。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 運営情報 */}
                        <section className="border-t border-neutral-200 pt-16">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 mb-4">運営について</h2>
                                    <p className="text-neutral-600 leading-relaxed mb-6">
                                        当サイトは、シリアスランナーからファンランナーまで、
                                        走ることを愛するエンジニアチームによって開発・運営されています。
                                        常に中立的な立場を保ち、ランナーの利益を第一に考えた機能開発を行っています。
                                    </p>
                                </div>
                                <div>
                                    <dl className="space-y-4 text-sm bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                                        <div className="flex justify-between border-b border-neutral-200 pb-2">
                                            <dt className="text-neutral-500">サイト名</dt>
                                            <dd className="font-semibold text-neutral-900">Stride</dd>
                                        </div>
                                        <div className="flex justify-between border-b border-neutral-200 pb-2">
                                            <dt className="text-neutral-500">設立</dt>
                                            <dd className="font-semibold text-neutral-900">2024年</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-neutral-500">お問い合わせ</dt>
                                            <dd className="font-semibold text-neutral-900">
                                                <a href="/support" className="hover:underline">サポートページへ</a>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}

