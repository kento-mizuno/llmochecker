import { NextRequest, NextResponse } from 'next/server'
import { IntegratedDiagnosis } from '../../../../../../lib/diagnosis/integrated-diagnosis'

/**
 * GET /api/diagnosis/[id]/progress
 * 診断の進捗状況を取得するエンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // IDの検証
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '診断IDが無効です', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 進捗情報の取得
    const diagnosis = new IntegratedDiagnosis()
    const progress = await diagnosis.getProgress(id)

    if (!progress) {
      return NextResponse.json(
        { 
          error: '指定された診断が見つかりません',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // 進捗情報を整形して返す
    const response = {
      id: progress.id,
      status: progress.status, // 'initializing' | 'analyzing' | 'processing' | 'completed' | 'error'
      currentStep: progress.currentStep,
      percentage: progress.percentage,
      estimatedCompletion: progress.estimatedCompletion,
      message: getProgressMessage(progress.status, progress.currentStep)
    }

    // 完了時は結果取得URLも含める
    if (progress.status === 'completed') {
      response.resultUrl = `/api/diagnosis/${id}/result`
    }

    // エラー時はエラー情報も含める
    if (progress.status === 'error') {
      response.error = {
        message: '診断中にエラーが発生しました',
        code: 'DIAGNOSIS_ERROR'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('進捗取得エラー:', error)
    
    return NextResponse.json(
      { 
        error: '進捗情報の取得に失敗しました',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * 進捗状況に応じたメッセージを生成
 */
function getProgressMessage(status: string, currentStep: string): string {
  const messages = {
    initializing: '診断を初期化しています...',
    analyzing: `${currentStep}を実行中...`,
    processing: '結果を処理しています...',
    completed: '診断が完了しました',
    error: 'エラーが発生しました'
  }

  return messages[status] || '処理中...'
}

/**
 * WebSocket接続用のエンドポイント情報（将来の実装用）
 */
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    methods: ['GET'],
    description: '診断進捗をリアルタイムで取得',
    websocket: {
      available: false, // 将来実装予定
      url: `/ws/diagnosis/${params.id}/progress`
    },
    polling: {
      recommended_interval: 2000, // 2秒間隔
      max_polling_time: 300000    // 5分でタイムアウト
    }
  })
}