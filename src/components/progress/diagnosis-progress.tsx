'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { AlertCircle, Clock, X } from 'lucide-react'
import { useDiagnosisStore } from '../../../lib/stores/diagnosis-store'
import { ProgressBar } from './progress-bar'
import { StageIndicator } from './stage-indicator'
import { cn } from '../../../lib/utils'

interface DiagnosisProgressProps {
  diagnosisId: string
  onCancel?: () => void
  onComplete?: (diagnosisId: string) => void
  onError?: (error: string) => void
  className?: string
  compact?: boolean
}

export function DiagnosisProgress({
  diagnosisId,
  onCancel,
  onComplete,
  onError,
  className,
  compact = false
}: DiagnosisProgressProps) {
  const {
    progress,
    currentDiagnosisId,
    startTime,
    isPolling,
    startDiagnosis,
    stopDiagnosis,
    resetDiagnosis
  } = useDiagnosisStore()

  // 診断開始
  useEffect(() => {
    if (diagnosisId && (!currentDiagnosisId || currentDiagnosisId !== diagnosisId)) {
      startDiagnosis(diagnosisId)
    }
  }, [diagnosisId, currentDiagnosisId, startDiagnosis])

  // 完了・エラー時の処理
  useEffect(() => {
    if (!progress) return

    if (progress.stage === 'completed' && onComplete) {
      onComplete(diagnosisId)
    } else if (progress.stage === 'error' && onError && progress.error) {
      onError(progress.error)
    }
  }, [progress, diagnosisId, onComplete, onError])

  // キャンセル処理
  const handleCancel = () => {
    stopDiagnosis()
    onCancel?.()
  }

  // リセット処理
  const handleReset = () => {
    resetDiagnosis()
  }

  if (!progress) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            診断を準備中...
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCompleted = progress.stage === 'completed'
  const isError = progress.stage === 'error'
  const elapsedTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0
  
  if (compact) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium">診断進行中</div>
              {isPolling && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            {!isCompleted && !isError && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                中止
              </Button>
            )}
          </div>
          
          <StageIndicator
            currentStage={progress.stage}
            progress={progress.progress}
            compact
          />
          
          {!isCompleted && !isError && (
            <ProgressBar
              progress={progress.progress}
              size="sm"
              className="mt-3"
              variant={isError ? 'error' : 'default'}
            />
          )}
          
          {progress.estimatedTimeRemaining && (
            <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              残り約 {Math.ceil(progress.estimatedTimeRemaining / 60)}分
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isCompleted ? '診断完了' : isError ? '診断エラー' : '診断進行中'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isPolling && !isCompleted && !isError && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>リアルタイム更新中</span>
              </div>
            )}
            {!isCompleted && !isError && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                診断を中止
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* エラー表示 */}
        {isError && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-red-900">診断中にエラーが発生しました</div>
              <div className="text-sm text-red-700 mt-1">
                {progress.error || '不明なエラーが発生しました'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="mt-2 text-sm"
              >
                再試行
              </Button>
            </div>
          </div>
        )}

        {/* ステージインジケーター */}
        <StageIndicator
          currentStage={progress.stage}
          progress={progress.progress}
        />

        {/* プログレスバー */}
        {!isCompleted && (
          <ProgressBar
            progress={progress.progress}
            variant={isError ? 'error' : 'default'}
            animated={!isError}
          />
        )}

        {/* ステータス情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.progress.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">完了率</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500">経過時間</div>
          </div>
          
          <div className="text-center">
            {progress.estimatedTimeRemaining ? (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.ceil(progress.estimatedTimeRemaining / 60)}分
                </div>
                <div className="text-xs text-gray-500">残り時間</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">--</div>
                <div className="text-xs text-gray-500">計算中</div>
              </>
            )}
          </div>
        </div>

        {/* メッセージ表示 */}
        {progress.message && (
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {progress.message}
          </div>
        )}

        {/* 完了時のメッセージ */}
        {isCompleted && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 font-medium">
              診断が正常に完了しました！
            </div>
            <div className="text-sm text-green-600 mt-1">
              結果を確認してください。
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}