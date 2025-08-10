'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { UrlInputForm } from '@/components/diagnosis/UrlInputForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorDisplay, NetworkError } from '@/components/ui/ErrorDisplay'
import Link from 'next/link'

const diagnosticFeatures = [
  {
    icon: CheckCircle,
    title: '17項目の詳細評価',
    description: 'E-E-A-T、エンティティ、AI親和性、品質、技術的要因を総合評価'
  },
  {
    icon: Clock,
    title: '2-3分で完了',
    description: 'Webサイトの自動解析からレポート生成まで短時間で完了'
  },
  {
    icon: Zap,
    title: 'AI改善提案',
    description: 'ChatGPT、Claude、Geminiでの表示向上のための具体的なアドバイス'
  }
]

export default function DiagnosisPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // API呼び出し: 診断開始
      const response = await fetch('/api/diagnosis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('リクエストが多すぎます。しばらく時間をおいてから再試行してください。')
        }
        
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || '診断の開始に失敗しました。')
      }

      const data = await response.json()
      
      // 進捗ページにリダイレクト
      router.push(`/diagnosis/${data.progressId}/progress`)

    } catch (error) {
      console.error('診断開始エラー:', error)
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('ネットワーク接続に問題があります。インターネット接続を確認してください。')
      } else {
        setError(error instanceof Error ? error.message : '診断の開始に失敗しました。')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* パンくずナビ */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>ホームに戻る</span>
              </Link>
            </Button>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* メインコンテンツ */}
              <div className="lg:col-span-2">
                {/* エラー表示 */}
                {error && (
                  <div className="mb-8">
                    {error.includes('ネットワーク') ? (
                      <NetworkError onRetry={handleRetry} />
                    ) : (
                      <ErrorDisplay
                        title="診断開始エラー"
                        message={error}
                        onRetry={handleRetry}
                        type="warning"
                      />
                    )}
                  </div>
                )}

                {/* URL入力フォーム */}
                <Card className="llmo-card">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full llmo-gradient flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">
                      LLMO無料診断
                    </CardTitle>
                    <CardDescription className="text-lg">
                      あなたのWebサイトがAI検索でどの程度表示されるかを診断します
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <UrlInputForm 
                      onSubmit={handleUrlSubmit}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* サイドバー */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* 診断内容 */}
                  <Card className="llmo-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>診断内容</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {diagnosticFeatures.map((feature, index) => (
                        <div key={index} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                              <feature.icon className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{feature.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* 注意事項 */}
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="text-blue-900 text-lg">
                        ご利用について
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-700 space-y-3">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span>完全無料・登録不要</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span>入力データは保存されません</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span>診断結果はHTML・JSON形式で出力</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span>診断時間：約2-3分</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* サポート情報 */}
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">お困りの際は</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        診断に関するご質問やエラーが発生した場合
                      </p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href="/contact">
                          お問い合わせ
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}