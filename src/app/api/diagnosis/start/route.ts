import { NextRequest, NextResponse } from 'next/server'
import { IntegratedDiagnosis } from '../../../../../lib/diagnosis/integrated-diagnosis'
import { UrlValidator } from '../../../../../lib/utils/url-validator'

/**
 * POST /api/diagnosis/start
 * 診断を開始するエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, options = {} } = body

    // 入力検証
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが必要です', code: 'INVALID_URL' },
        { status: 400 }
      )
    }

    // URL形式検証
    const urlValidation = UrlValidator.validate(url)
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'URLが無効です', 
          code: 'INVALID_URL_FORMAT',
          details: urlValidation.errors 
        },
        { status: 400 }
      )
    }

    // レート制限チェック (簡易実装)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (await isRateLimited(clientIP)) {
      return NextResponse.json(
        { 
          error: 'レート制限に達しました。しばらく時間をおいてから再試行してください。',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      )
    }

    // 診断実行
    const diagnosis = new IntegratedDiagnosis(process.env.GEMINI_API_KEY)
    
    // 非同期で診断を実行（バックグラウンド処理）
    const diagnosisPromise = diagnosis.executeDiagnosis(url, options, true)
    
    // プログレスIDを即座に返す
    const progressId = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // バックグラウンドで実行を継続
    diagnosisPromise
      .then(result => {
        console.log(`診断完了: ${progressId}`, result.diagnosisId)
        // 実際の実装ではRedisやデータベースに結果を保存
      })
      .catch(error => {
        console.error(`診断エラー: ${progressId}`, error)
        // エラー情報を保存
      })

    return NextResponse.json({
      success: true,
      progressId,
      message: '診断を開始しました',
      estimatedTime: '2-3分',
      status: 'started'
    }, { status: 202 }) // 202 Accepted

  } catch (error) {
    console.error('診断開始エラー:', error)
    
    return NextResponse.json(
      { 
        error: '診断の開始に失敗しました',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * 簡易レート制限チェック
 * 実際の実装ではRedisやMemcachedを使用
 */
async function isRateLimited(clientIP: string): Promise<boolean> {
  // 開発環境では制限なし
  if (process.env.NODE_ENV === 'development') {
    return false
  }
  
  // 実装例：1IPあたり5分間に10リクエストまで
  // 実際はRedisで実装
  return false
}

/**
 * GET /api/diagnosis/start
 * エンドポイント情報を返す（開発用）
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/diagnosis/start',
    method: 'POST',
    description: 'LLMO診断を開始します',
    parameters: {
      url: 'string (required) - 診断対象のURL',
      options: 'object (optional) - クローリングオプション'
    },
    example: {
      url: 'https://example.com',
      options: {
        timeout: 30000,
        userAgent: 'LLMO-Checker/1.0'
      }
    }
  })
}