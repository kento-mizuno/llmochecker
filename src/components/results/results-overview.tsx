'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface DiagnosisResult {
  url: string
  totalScore: number
  maxScore: number
  grade: string
  categories: Array<{
    name: string
    score: number
    maxScore: number
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
  }>
  strengths: string[]
  weaknesses: string[]
  completedAt: string
  analysisTime: number
}

interface ResultsOverviewProps {
  result: DiagnosisResult
  className?: string
}

// ステータスの色とアイコン
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'excellent':
      return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '優秀' }
    case 'good':
      return { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, text: '良好' }
    case 'needs_improvement':
      return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: '改善要' }
    case 'critical':
      return { color: 'bg-red-100 text-red-800', icon: TrendingDown, text: '要注意' }
    default:
      return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, text: '不明' }
  }
}

// 分析時間のフォーマット
const formatAnalysisTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}

export function ResultsOverview({ result, className }: ResultsOverviewProps) {
  const percentage = Math.round((result.totalScore / result.maxScore) * 100)
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">診断結果サマリー</CardTitle>
          <CardDescription>
            {new Date(result.completedAt).toLocaleString('ja-JP')} に完了
            （分析時間: {formatAnalysisTime(result.analysisTime)}）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {percentage}
              </div>
              <div className="text-sm text-gray-600">総合スコア</div>
              <div className="text-xs text-gray-500">
                {result.totalScore} / {result.maxScore} ポイント
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {result.grade}
              </div>
              <div className="text-sm text-gray-600">グレード</div>
              <div className="text-xs text-gray-500">
                LLMO最適化レベル
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {result.categories.length}
              </div>
              <div className="text-sm text-gray-600">評価項目</div>
              <div className="text-xs text-gray-500">
                詳細分析済み
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別ステータス */}
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別ステータス</CardTitle>
          <CardDescription>各評価カテゴリの現在の状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.categories.map((category, index) => {
              const config = getStatusConfig(category.status)
              const IconComponent = config.icon
              const categoryPercentage = Math.round((category.score / category.maxScore) * 100)
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">
                        {category.score}/{category.maxScore} ポイント
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={config.color}>
                      {config.text}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {categoryPercentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 強み・弱み */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 強み */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              強み
            </CardTitle>
            <CardDescription>
              現在優秀な評価を受けている項目
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.strengths.length > 0 ? (
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                現時点で特筆すべき強みが見つかりませんでした。
                改善提案を確認して、スコアを向上させましょう。
              </p>
            )}
          </CardContent>
        </Card>

        {/* 弱み */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              改善が必要な項目
            </CardTitle>
            <CardDescription>
              優先的に対応すべき項目
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {result.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                大きな問題は見つかりませんでした。
                さらなる最適化のために改善提案をご確認ください。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}