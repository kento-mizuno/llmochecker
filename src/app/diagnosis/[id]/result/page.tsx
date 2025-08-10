'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScoreRadarChart } from "@/components/charts/score-radar-chart"
import { ScoreBarChart } from "@/components/charts/score-bar-chart"
import { ScoreGauge } from "@/components/charts/score-gauge"
// import { ResultsOverview } from "@/components/results/results-overview"
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react'

interface DiagnosisResult {
  id: string
  fromCache: boolean
  summary: {
    url: string
    timestamp: string
    overallScore: number
    category: string
  }
  technicalSignals: any
  contentAnalysis: any
  evaluations: Array<{
    criteriaId: string
    score: number
    maxScore: number
    feedback: string
    suggestions: string[]
  }>
  geminiAnalysis?: {
    eeatScore: number
    qualityScore: number
    suggestions: string[]
    strengths: string[]
    weaknesses: string[]
  }
  reports: {
    json: any
    htmlUrl: string
  }
  metadata: {
    generatedAt: string
    version: string
  }
}

interface ResultPageProps {
  params: Promise<{ id: string }>
}

// 評価基準IDから名前を取得するマッピング（実際の評価エンジンに合わせて修正）
const CRITERIA_NAMES: Record<string, string> = {
  // E-E-A-T評価
  'experience': '経験の明示',
  'expertise': '専門性の証明',
  'authoritativeness': '権威性の構築',
  'trustworthiness': '信頼性の確保',
  
  // エンティティ評価
  'knowledge-graph': 'ナレッジグラフ存在感',
  'nap-consistency': 'NAP情報一貫性',
  
  // AI親和性評価
  'list-usage': 'リスト・表形式活用',
  'definition-summary': '要約・定義文提示',
  'qa-format': 'Q&A形式',
  'semantic-html': 'セマンティックHTML',
  
  // 品質評価
  'info-accuracy': '情報の正確性',
  'heading-structure': '見出し構造',
  
  // 文書構造評価
  'logical-structure': '論理的構造',
  'content-clarity': '言語の明快性',
  
  // 技術的評価
  'page-experience': 'ページエクスペリエンス',
  'crawlability': 'クローラビリティ',
  'structured-data': '構造化データ',
  
  // その他
  'llms-txt': 'llms.txtファイル'
}

// スコアからステータスを判定
const getScoreStatus = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'needs_improvement'
  return 'critical'
}

// スコアからグレードを計算
const calculateGrade = (score: number): string => {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C+'
  if (score >= 50) return 'C'
  if (score >= 40) return 'D+'
  if (score >= 30) return 'D'
  return 'F'
}

export default function ResultPage({ params }: ResultPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/diagnosis/${id}/result`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '結果の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [id])

  const handleNewDiagnosis = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleDownloadReport = () => {
    if (result?.reports?.htmlUrl) {
      window.open(result.reports.htmlUrl, '_blank')
    }
  }

  const handleShareResult = () => {
    if (!result) return
    
    const overallScore = result.summary.overallScore
    const grade = calculateGrade(overallScore)
    
    if (navigator.share) {
      navigator.share({
        title: 'LLMO診断結果',
        text: `私のWebサイトのLLMO診断結果: ${grade}グレード (${Math.round(overallScore)}%)`,
        url: window.location.href
      })
    } else {
      // フォールバック: クリップボードにコピー
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg">診断結果を読み込み中...</p>
            <p className="text-sm text-gray-600">しばらくお待ちください</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error || '診断結果が見つかりません'}</p>
          <div className="space-x-4">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button onClick={handleNewDiagnosis}>
              新しい診断を開始
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // APIデータから表示用データを準備
  const overallScore = result.summary.overallScore
  const grade = calculateGrade(overallScore)
  
  // 評価データをカテゴリ別に整理
  const categoryData = result.evaluations.reduce((acc: any, evaluation) => {
    const categoryName = CRITERIA_NAMES[evaluation.criteriaId] || evaluation.criteriaId
    const status = getScoreStatus(evaluation.score, evaluation.maxScore)
    
    acc.push({
      name: categoryName,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      status,
      feedback: evaluation.feedback,
      suggestions: evaluation.suggestions
    })
    
    return acc
  }, [])

  // カテゴリ別スコア集計（レーダーチャート用）
  const categoryScores = result.evaluations.reduce((acc: any, evaluation) => {
    let category = 'その他'
    
    // 実際の評価IDに基づいたカテゴリ分類
    if (['experience', 'expertise', 'authoritativeness', 'trustworthiness'].includes(evaluation.criteriaId)) {
      category = 'E-E-A-T'
    } else if (['knowledge-graph', 'nap-consistency'].includes(evaluation.criteriaId)) {
      category = 'エンティティ'
    } else if (['list-usage', 'definition-summary', 'qa-format', 'semantic-html'].includes(evaluation.criteriaId)) {
      category = 'AI親和性'
    } else if (['info-accuracy', 'heading-structure', 'logical-structure', 'content-clarity'].includes(evaluation.criteriaId)) {
      category = '品質・構造'
    } else if (['page-experience', 'crawlability', 'structured-data'].includes(evaluation.criteriaId)) {
      category = '技術的要因'
    }
    
    if (!acc[category]) {
      acc[category] = { scores: [], total: 0, count: 0 }
    }
    
    acc[category].scores.push(evaluation.score)
    acc[category].total += evaluation.score
    acc[category].count += 1
    
    return acc
  }, {})

  // チャート用データの準備
  const radarData = Object.keys(categoryScores).map(category => ({
    category,
    current: Math.round(categoryScores[category].total / categoryScores[category].count),
    average: 70, // 平均値（実際はAPIから取得）
    fullMark: 100
  }))

  const barData = categoryData.map((cat: any) => ({
    name: cat.name,
    score: cat.score,
    maxScore: cat.maxScore,
    color: cat.status
  }))

  // 強みと弱みをGemini分析から取得
  const strengths = result.geminiAnalysis?.strengths || []
  const weaknesses = result.geminiAnalysis?.weaknesses || []
  const improvements = result.geminiAnalysis?.suggestions || []

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">診断結果</h1>
          <p className="text-gray-600 break-all">{result.summary.url}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(result.summary.timestamp).toLocaleString('ja-JP')}
            {result.fromCache && ' (キャッシュから取得)'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          <Button onClick={handleDownloadReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            レポート
          </Button>
          <Button onClick={handleShareResult} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            共有
          </Button>
          <Button onClick={handleNewDiagnosis} size="sm">
            新しい診断
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="detailed">詳細分析</TabsTrigger>
          <TabsTrigger value="improvements">改善提案</TabsTrigger>
          <TabsTrigger value="comparison">比較</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-6">
          {/* 総合スコア */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* 基本情報カード */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">診断結果サマリー</CardTitle>
                  <CardDescription>
                    {new Date(result.summary.timestamp).toLocaleString('ja-JP')} に完了
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {Math.round(overallScore)}
                      </div>
                      <div className="text-sm text-gray-600">総合スコア</div>
                      <div className="text-xs text-gray-500">
                        / 100 ポイント
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {grade}
                      </div>
                      <div className="text-sm text-gray-600">グレード</div>
                      <div className="text-xs text-gray-500">
                        LLMO最適化レベル
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {categoryData.length}
                      </div>
                      <div className="text-sm text-gray-600">評価項目</div>
                      <div className="text-xs text-gray-500">
                        詳細分析済み
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 強み・弱み */}
              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* 強み */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        強み
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {strengths.length > 0 ? (
                        <ul className="space-y-2">
                          {strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          現時点で特筆すべき強みが見つかりませんでした。
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 弱み */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        改善が必要な項目
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {weaknesses.length > 0 ? (
                        <ul className="space-y-2">
                          {weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          大きな問題は見つかりませんでした。
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            <div>
              <ScoreGauge
                score={Math.round(overallScore)}
                maxScore={100}
                title="総合スコア"
                description="LLMO最適化の総合評価"
                size="lg"
                showGrade={true}
              />
            </div>
          </div>
        </TabsContent>

        {/* 詳細分析タブ */}
        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ScoreRadarChart 
              data={radarData}
              title="カテゴリ別パフォーマンス"
              description="各カテゴリのスコアと平均値の比較"
            />
            <ScoreBarChart 
              data={barData}
              title="詳細スコア分析"
              description="カテゴリ別の詳細なスコア内訳"
            />
          </div>
          
          {/* カテゴリ詳細 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別詳細</CardTitle>
              <CardDescription>各評価カテゴリの具体的な分析結果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryData.map((category: any, index: number) => (
                  <ScoreGauge
                    key={index}
                    score={category.score}
                    maxScore={category.maxScore}
                    title={category.name}
                    size="sm"
                    showGrade={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 改善提案タブ */}
        <TabsContent value="improvements" className="space-y-6">
          <div className="grid gap-4">
            {improvements.length > 0 ? (
              improvements.map((improvement, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">改善提案 {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{improvement}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">現在、追加の改善提案はありません。</p>
                  <p className="text-sm text-gray-400 mt-2">
                    詳細分析タブで各項目の具体的な改善点をご確認ください。
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* 詳細な改善提案（評価項目別） */}
          <Card>
            <CardHeader>
              <CardTitle>項目別改善提案</CardTitle>
              <CardDescription>各評価項目の具体的な改善案</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData
                  .filter((category: any) => category.suggestions && category.suggestions.length > 0)
                  .map((category: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold mb-2">{category.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{category.feedback}</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {category.suggestions.map((suggestion: string, sugIndex: number) => (
                          <li key={sugIndex} className="text-gray-700">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 比較タブ */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>業界平均との比較</CardTitle>
              <CardDescription>同業界の平均的なスコアとの比較分析</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                比較機能は今後のアップデートで提供予定です
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}