import Link from 'next/link'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 llmo-gradient opacity-5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* バッジ */}
          <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-2 mb-8 border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI検索時代の新しいSEO対策</span>
            <span className="llmo-badge llmo-badge-b text-xs">BETA</span>
          </div>

          {/* メインタイトル */}
          <h1 className="text-responsive-3xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gradient">LLMO無料診断</span>
            <br />
            AI検索での
            <br className="md:hidden" />
            可視性をチェック
          </h1>

          {/* サブタイトル */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            あなたのWebサイトが<strong className="text-foreground">ChatGPT</strong>、
            <strong className="text-foreground">Claude</strong>、
            <strong className="text-foreground">Gemini</strong>で
            <br className="hidden md:block" />
            どの程度表示されるかを<span className="text-gradient font-semibold">無料</span>で診断
          </p>

          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="xl" className="llmo-gradient text-white hover:opacity-90 min-w-[200px]">
              <Link href="/diagnosis" className="group">
                <Zap className="mr-2 h-5 w-5" />
                今すぐ無料診断
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="min-w-[200px]">
              <Link href="/examples">
                診断事例を見る
              </Link>
            </Button>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">3+</div>
              <div className="text-sm text-muted-foreground">対応AI検索エンジン</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">17</div>
              <div className="text-sm text-muted-foreground">評価基準</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">無料・登録不要</div>
            </div>
          </div>
        </div>
      </div>

      {/* スクロール指示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full p-1">
          <div className="w-1 h-3 bg-muted-foreground/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}