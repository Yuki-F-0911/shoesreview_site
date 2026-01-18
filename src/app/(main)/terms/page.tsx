import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '利用規約 - Stride',
    description: 'Strideの利用規約。サービスの利用条件についてご説明します。',
}

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900 border-b pb-4">利用規約</h1>

            <div className="space-y-8 text-neutral-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">1. はじめに</h2>
                    <p>
                        本利用規約（以下「本規約」）は、Stride（以下「当サイト」）の利用条件を定めるものです。当サイトを利用する全てのユーザーは、本規約に同意したものとみなされます。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">2. ユーザーの責任</h2>
                    <p>
                        ユーザーは、当サイトを利用して投稿するレビューやコメントの内容について全責任を負うものとします。虚偽の情報や誹謗中傷を含む投稿は禁止されています。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">3. 禁止事項</h2>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>他のユーザーや第三者を誹謗中傷する行為</li>
                        <li>不正アクセスやサーバーへの過度な負荷をかける行為</li>
                        <li>その他、運営が不適切と判断する行為</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">4. 免責事項</h2>
                    <p>
                        当サイトは、掲載情報の正確性について万全を期していますが、その完全性を保証するものではありません。当サイトの利用により生じた損害について、運営はいかなる責任も負いません。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4 text-neutral-800">5. 規約の変更</h2>
                    <p>
                        運営は、必要と判断した場合、ユーザーへの事前通知なく本規約を変更できるものとします。変更後の規約は、当サイトに掲載された時点で効力を生じるものとします。
                    </p>
                </section>
            </div>
        </div>
    )
}
