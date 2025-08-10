import Link from 'next/link'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="hero-main">
      {/* 動的背景グラデーション */}
      <div className="absolute inset-0">
        <div className="hero-bg-overlay" />
        <div className="hero-floating-orb-1" />
        <div className="hero-floating-orb-2" />
        <div className="hero-floating-orb-3" />
      </div>
      
      {/* グリッドパターン */}
      <div className="hero-grid-pattern" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* バッジ */}
          <div className="hero-badge">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-white">AI検索時代の新しいSEO対策</span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">BETA</span>
          </div>

          {/* メインタイトル */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="hero-title-gradient">
              LLMO無料診断
            </span>
            <br />
            <span className="text-white text-4xl md:text-5xl lg:text-6xl">
              AI検索での可視性をチェック
            </span>
          </h1>

          {/* サブタイトル */}
          <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
            AI検索時代に向けた最適化診断ツール
          </p>

          {/* CTAボタン */}
          <div className="flex justify-center">
            <Link href="/diagnosis" className="hero-cta-button flex items-center justify-center group">
              <Zap className="mr-3 h-6 w-6" />
              今すぐ診断開始
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>

      {/* スクロール指示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse"></div>
          </div>
          <span className="text-white/70 text-xs">スクロール</span>
        </div>
      </div>
    </section>
  )
}