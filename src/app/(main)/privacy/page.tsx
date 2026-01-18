import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'プライバシーポリシー - Stride',
    description: 'Strideのプライバシーポリシー。個人情報の取り扱いについてご説明します。',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900 border-b pb-4">プライバシーポリシー</h1>

            <div className="space-y-8 text-neutral-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">1. 個人情報の収集・利用について</h2>
                    <p>
                        当サイト（Stride）は、ユーザーがより良い体験を得られるよう、必要な範囲で個人情報を収集・利用します。収集した情報は、サービスの提供、品質向上、重要なお知らせの送信のために利用されます。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">2. 情報の第三者への提供</h2>
                    <p>
                        当サイトは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、サービス運営に必要な業務委託先に対しては、適切な監督のもと情報を提供することがあります。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">3. クッキー（Cookie）の利用</h2>
                    <p>
                        当サイトでは、ユーザーの利便性向上やアクセス解析のためにCookieを使用しています。ブラウザの設定によりCookieを無効にすることも可能ですが、その場合一部機能が利用できなくなることがあります。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">4. 外部サービスとの連携</h2>
                    <p>
                        当サイトは、Google AnalyticsやStravaなどの外部サービスと連携しています。これらのサービスにおける情報の取り扱いについては、各サービスのプライバシーポリシーをご確認ください。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">5. お問い合わせ</h2>
                    <p>
                        個人情報の取り扱いに関するご質問は、<a href="/support" className="underline hover:text-neutral-500">サポートページ</a>よりお問い合わせください。
                    </p>
                </section>
            </div>
        </div>
    )
}
