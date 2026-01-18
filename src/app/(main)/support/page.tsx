import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'サポート - Stride',
    description: 'Strideへのお問い合わせ、ご意見・ご要望はこちらから。',
}

export default function SupportPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900 border-b pb-4">サポート</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">お問い合わせ</h2>
                    <p className="text-neutral-600 mb-4">
                        Strideに関するご質問、不具合の報告、ご意見・ご要望は、以下のメールアドレスまでご連絡ください。
                    </p>
                    <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                        <p className="text-neutral-900 font-medium">サポート窓口: contact@shoe-review.jp</p>
                        <p className="text-neutral-500 text-sm mt-2">※原則として3営業日以内にご返信いたします。</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">よくあるご質問</h2>
                    <p className="text-neutral-600 mb-4">
                        お問い合わせの前に、よくあるご質問（FAQ）をご確認いただくと解決する場合があります。
                    </p>
                    <a href="/faq" className="inline-block px-6 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors">
                        よくあるご質問を見る
                    </a>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">推奨環境</h2>
                    <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 text-neutral-600 text-sm space-y-2">
                        <p>当サイトを快適にご利用いただくために、以下の環境でのご利用を推奨いたします。</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Google Chrome 最新版</li>
                            <li>Safari 最新版</li>
                            <li>Firefox 最新版</li>
                            <li>Microsoft Edge 最新版</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
