import Link from 'next/link'
import { Zap, Twitter, Github, ExternalLink } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ブランド情報 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg llmo-gradient">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gradient">LLMO診断</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI検索時代の新しいSEO対策。
              あなたのWebサイトがChatGPTやClaude、
              Geminiでどの程度表示されるかを無料で診断します。
            </p>
            <div className="flex space-x-4">
              <Link 
                href="https://twitter.com/dailyup_co" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded p-1"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link 
                href="https://github.com/dailyup-co/llmochecker" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded p-1"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">サービス</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/diagnosis" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  無料LLMO診断
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  診断事例
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* 学習リソース */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">学習・サポート</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  LLMOとは？
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  改善ガイド
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  よくある質問
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  ブログ
                </Link>
              </li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">会社情報</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  href="https://dailyup.co.jp" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 inline-flex items-center gap-1"
                >
                  株式会社DailyUp
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライトとディスクレーマー */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} 株式会社DailyUp. All rights reserved.
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <p>本サービスはベータ版です。診断結果は参考値として利用してください。</p>
              <p>LLMO（Large Language Model Optimization）は新しい概念であり、継続的に改善を行っています。</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}