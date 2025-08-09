import { NextRequest, NextResponse } from 'next/server'

/**
 * APIエラーレスポンス型
 */
export interface ApiError {
  error: string
  code: string
  details?: any
  timestamp: string
}

/**
 * レート制限設定
 */
interface RateLimitConfig {
  windowMs: number  // 時間窓（ミリ秒）
  maxRequests: number  // 最大リクエスト数
}

/**
 * 簡易レート制限クラス
 * 本番環境ではRedisやMemcachedを使用することを推奨
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map()

  async isLimited(identifier: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // 既存のリクエスト履歴を取得
    const requestTimes = this.requests.get(identifier) || []
    
    // 時間窓外の古いリクエストを削除
    const validRequests = requestTimes.filter(time => time > windowStart)
    
    // 制限チェック
    if (validRequests.length >= config.maxRequests) {
      return true
    }

    // 新しいリクエストを記録
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    // 定期的にメモリをクリーンアップ（簡易実装）
    if (Math.random() < 0.01) { // 1%の確率でクリーンアップ
      this.cleanup()
    }

    return false
  }

  private cleanup() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > now - oneHour)
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

const rateLimiter = new SimpleRateLimiter()

/**
 * レート制限ミドルウェア
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 5 * 60 * 1000, maxRequests: 10 } // 5分間に10リクエスト
): Promise<NextResponse | null> {
  // 開発環境では制限を無効化
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  const identifier = getClientIdentifier(request)
  const isLimited = await rateLimiter.isLimited(identifier, config)

  if (isLimited) {
    return NextResponse.json(
      createErrorResponse(
        'レート制限に達しました。しばらく時間をおいてから再試行してください。',
        'RATE_LIMITED'
      ),
      { status: 429 }
    )
  }

  return null // 制限なし
}

/**
 * エラーハンドリングミドルウェア
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API処理エラー:', error)

      // 既知のエラータイプの処理
      if (error instanceof ValidationError) {
        return NextResponse.json(
          createErrorResponse(error.message, 'VALIDATION_ERROR', error.details),
          { status: 400 }
        )
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          createErrorResponse(error.message, 'NOT_FOUND'),
          { status: 404 }
        )
      }

      if (error instanceof TimeoutError) {
        return NextResponse.json(
          createErrorResponse('処理がタイムアウトしました', 'TIMEOUT'),
          { status: 408 }
        )
      }

      // その他のエラー
      return NextResponse.json(
        createErrorResponse(
          'サーバー内部エラーが発生しました',
          'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development' ? error.message : undefined
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * CORS設定ミドルウェア
 */
export function withCORS(response: NextResponse): NextResponse {
  // 本番環境では適切なオリジンを設定
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://llmochecker.dailyup.co.jp'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0])
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * クライアント識別子を取得
 */
function getClientIdentifier(request: NextRequest): string {
  // IPアドレスベースの識別（簡易実装）
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  
  return `ip:${ip}`
}

/**
 * 標準化されたエラーレスポンスを作成
 */
export function createErrorResponse(
  message: string, 
  code: string, 
  details?: any
): ApiError {
  return {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString()
  }
}

/**
 * カスタムエラークラス
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'リソースが見つかりません') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'タイムアウトが発生しました') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * リクエストバリデーション
 */
export function validateRequest(body: any, schema: any): void {
  // 簡易バリデーション実装
  // 本格的な実装ではZodやYupを使用
  
  if (schema.url && (!body.url || typeof body.url !== 'string')) {
    throw new ValidationError('URLが必要です', { field: 'url' })
  }

  if (schema.url && body.url && !isValidUrl(body.url)) {
    throw new ValidationError('URLの形式が正しくありません', { field: 'url' })
  }
}

/**
 * URL形式の簡易チェック
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}