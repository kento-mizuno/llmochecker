'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { DiagnosisProgress } from '../../../../components/progress'
import { ArrowLeft } from 'lucide-react'

export default function DiagnosisProgressPage() {
  const params = useParams()
  const router = useRouter()
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null)

  useEffect(() => {
    // パラメータからIDを取得
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    if (id) {
      setDiagnosisId(id)
    }
  }, [params.id])

  const handleCancel = () => {
    router.push('/')
  }

  const handleComplete = (completedId: string) => {
    // 結果ページに遷移
    router.push(`/diagnosis/${completedId}/result`)
  }

  const handleError = (error: string) => {
    console.error('診断エラー:', error)
    // エラー処理 - 5秒後にホームに戻る
    setTimeout(() => {
      router.push('/')
    }, 5000)
  }

  if (!diagnosisId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">診断IDが見つかりません</div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="mt-4"
            >
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                LLMO診断進行状況
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              診断ID: <span className="font-mono">{diagnosisId.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 進捗表示 */}
          <DiagnosisProgress
            diagnosisId={diagnosisId}
            onCancel={handleCancel}
            onComplete={handleComplete}
            onError={handleError}
          />

          {/* 診断について */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">診断について</h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>
                  LLMO（Large Language Model Optimization）診断では、
                  AI検索エンジンでの見つけやすさを向上させるため、
                  Webサイトの以下の要素を総合的に分析します：
                </p>
                <ul className="mt-3 space-y-1">
                  <li>• HTML構造とメタデータの最適化状況</li>
                  <li>• コンテンツの品質とE-E-A-T（専門性・権威性・信頼性）</li>
                  <li>• 技術的な実装状況（構造化データ、サイトマップ等）</li>
                  <li>• AI検索エンジンでの可視性向上のための改善提案</li>
                </ul>
                <p className="mt-3">
                  診断は通常3-5分程度で完了し、詳細な分析結果と
                  具体的な改善提案をご提供します。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* よくある質問 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">よくある質問</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">診断にはどのくらい時間がかかりますか？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    通常3-5分程度で完了します。サイトの規模や複雑さによって多少前後する場合があります。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">診断中にページを閉じても大丈夫ですか？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    診断はサーバー上で実行されるため、ページを閉じても診断は継続されます。
                    診断IDを保存しておけば、後から結果を確認できます。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">診断結果はどのくらい保存されますか？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    診断結果は24時間保存されます。それ以降は自動的に削除されます。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">診断に失敗した場合はどうなりますか？</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    サイトにアクセスできない場合や技術的な問題が発生した場合は、
                    エラーメッセージが表示されます。ホームページから再度診断を実行してください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}