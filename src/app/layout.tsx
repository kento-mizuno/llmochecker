import type { Metadata } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-jp'
})

export const metadata: Metadata = {
  title: 'LLMO無料診断 | AI検索での可視性をチェック',
  description: 'あなたのWebサイトがAI検索（ChatGPT、Claude、Gemini）でどの程度表示されるかを無料で診断。LLMOスコアと具体的な改善提案を提供します。',
  keywords: ['LLMO', 'AI検索最適化', 'ChatGPT', 'Claude', 'Gemini', '検索可視性', '無料診断'],
  authors: [{ name: 'DailyUp', url: 'https://dailyup.co.jp' }],
  creator: 'DailyUp',
  publisher: 'DailyUp',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://llmochecker.dailyup.co.jp',
    siteName: 'LLMO無料診断',
    title: 'LLMO無料診断 | AI検索での可視性をチェック',
    description: 'あなたのWebサイトがAI検索でどの程度表示されるかを無料で診断',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LLMO無料診断'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLMO無料診断 | AI検索での可視性をチェック',
    description: 'あなたのWebサイトがAI検索でどの程度表示されるかを無料で診断',
    images: ['/og-image.png']
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="min-h-screen bg-background font-noto antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}