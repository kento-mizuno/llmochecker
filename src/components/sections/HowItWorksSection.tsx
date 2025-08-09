import { ArrowRight, Globe, Cpu, FileBarChart, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const steps = [
  {
    step: 1,
    icon: Globe,
    title: 'URLを入力',
    description: '診断したいWebサイトのURLを入力するだけ。登録は不要です。',
    duration: '10秒'
  },
  {
    step: 2,
    icon: Cpu,
    title: 'AI解析実行',
    description: '17の評価基準に基づいてWebサイトを自動解析。AIが内容を詳細にチェック。',
    duration: '2-3分'
  },
  {
    step: 3,
    icon: FileBarChart,
    title: 'スコア算出',
    description: 'LLMOスコア（100点満点）とA-Fグレードを算出。弱点を特定します。',
    duration: '即座'
  },
  {
    step: 4,
    icon: Download,
    title: 'レポート取得',
    description: '具体的な改善提案とともに、詳細レポートをHTML・JSON形式で取得。',
    duration: '即座'
  }
]

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">簡単3ステップ</span>で診断完了
          </h2>
          <p className="text-lg text-muted-foreground">
            面倒な設定は一切なし。URLを入力するだけで、
            <br className="hidden md:block" />
            あなたのサイトのAI検索対応状況がすぐに分かります。
          </p>
        </div>

        {/* ステップカード */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((stepData, index) => (
            <div key={stepData.step} className="relative">
              <Card className="llmo-card group hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader className="text-center pb-4">
                  {/* ステップ番号 */}
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full llmo-gradient text-white text-sm font-bold mb-4 mx-auto">
                    {stepData.step}
                  </div>
                  
                  {/* アイコン */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors mx-auto mb-4">
                    <stepData.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {stepData.title}
                  </CardTitle>
                  
                  {/* 所要時間 */}
                  <div className="llmo-badge llmo-badge-b text-xs">
                    {stepData.duration}
                  </div>
                </CardHeader>
                
                <CardContent className="text-center">
                  <CardDescription className="text-sm leading-relaxed">
                    {stepData.description}
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* 矢印（最後のカード以外） */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-muted">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center space-y-4 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border">
            <h3 className="text-2xl font-bold">今すぐ診断を始めませんか？</h3>
            <p className="text-muted-foreground max-w-md">
              数分でAI検索での可視性が分かります。完全無料・登録不要で始められます。
            </p>
            <Button asChild size="lg" className="llmo-gradient text-white hover:opacity-90">
              <Link href="/diagnosis" className="group">
                無料診断を開始
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              ※診断データは保存されません。安心してお試しください。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}