import { 
  Brain, 
  BarChart3, 
  Lightbulb, 
  Shield, 
  Clock, 
  FileText 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'AI検索エンジン対応',
    description: 'ChatGPT、Claude、Gemini等の主要AI検索エンジンでの表示可能性を分析',
    highlight: '3つのAI検索'
  },
  {
    icon: BarChart3,
    title: '詳細スコアリング',
    description: '17の評価基準に基づいた総合的なLLMOスコア（100点満点）を算出',
    highlight: '17項目評価'
  },
  {
    icon: Lightbulb,
    title: '具体的な改善提案',
    description: 'AIによる詳細な改善アドバイスとすぐに実行できる具体的な施策を提供',
    highlight: 'AI改善提案'
  },
  {
    icon: Shield,
    title: '完全無料・登録不要',
    description: '面倒な登録は一切不要。URLを入力するだけですぐに診断開始',
    highlight: '100%無料'
  },
  {
    icon: Clock,
    title: '2分で完了',
    description: 'Webサイトの自動解析からレポート生成まで、わずか数分で完了',
    highlight: '高速診断'
  },
  {
    icon: FileText,
    title: '詳細レポート',
    description: 'HTML・JSON形式でのレポート出力。社内共有やプレゼンに最適',
    highlight: '出力対応'
  }
]

export function FeatureSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            なぜLLMO診断が
            <span className="text-gradient">必要</span>なのか？
          </h2>
          <p className="text-lg text-muted-foreground">
            従来のSEO対策だけでは、AI検索時代に取り残されてしまいます。
            <br className="hidden md:block" />
            LLMO（Large Language Model Optimization）で、未来の検索に備えましょう。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-0 llmo-card relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 llmo-gradient opacity-10 w-20 h-20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg llmo-gradient text-white mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <span className="llmo-badge llmo-badge-b text-xs">
                    {feature.highlight}
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 補足説明 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
            <Brain className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-blue-900">LLMOとは？</div>
              <div className="text-sm text-blue-700">
                Large Language Model Optimizationの略で、AI検索エンジンに最適化する新しいSEO手法です
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}