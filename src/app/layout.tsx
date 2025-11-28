import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateOrganizationSchema, generateWebSiteSchema, combineSchemas } from '@/lib/seo/structured-data'
import { baseMetadata, baseViewport } from '@/lib/seo/metadata'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = baseMetadata

export const viewport: Viewport = baseViewport

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // グローバルな構造化データ
  const structuredData = combineSchemas(
    generateOrganizationSchema(),
    generateWebSiteSchema()
  )

  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <JsonLd data={structuredData} />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}

