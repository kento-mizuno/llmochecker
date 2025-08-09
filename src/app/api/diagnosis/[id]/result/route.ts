import { NextRequest, NextResponse } from 'next/server'
import { IntegratedDiagnosis } from '../../../../../../lib/diagnosis/integrated-diagnosis'

/**
 * GET /api/diagnosis/[id]/result
 * 診断結果を取得するエンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // 'json' | 'html'

    // IDの検証
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '診断IDが無効です', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 結果の取得
    const diagnosis = new IntegratedDiagnosis()
    const result = await diagnosis.getDiagnosis(id)

    if (!result) {
      return NextResponse.json(
        { 
          error: '指定された診断結果が見つかりません',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // フォーマットに応じてレスポンスを返す
    switch (format.toLowerCase()) {
      case 'html':
        return new NextResponse(result.reports.html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="llmo-report-${id}.html"`
          }
        })

      case 'pdf':
        // PDF生成は将来実装
        return NextResponse.json(
          { error: 'PDF形式は現在準備中です', code: 'NOT_IMPLEMENTED' },
          { status: 501 }
        )

      case 'json':
      default:
        const jsonResult = {
          id: result.diagnosisId,
          fromCache: result.fromCache,
          summary: {
            url: result.result.url,
            timestamp: result.result.timestamp,
            overallScore: result.result.overallScore,
            category: result.result.category
          },
          technicalSignals: result.result.technicalSignals,
          contentAnalysis: result.result.contentAnalysis,
          evaluations: result.result.evaluations,
          geminiAnalysis: result.result.geminiAnalysis,
          reports: {
            json: JSON.parse(result.reports.json),
            htmlUrl: `/api/diagnosis/${id}/result?format=html`
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0.0'
          }
        }

        return NextResponse.json(jsonResult)
    }

  } catch (error) {
    console.error('結果取得エラー:', error)
    
    return NextResponse.json(
      { 
        error: '診断結果の取得に失敗しました',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/diagnosis/[id]/result
 * 診断結果を削除するエンドポイント（将来実装用）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'この機能は現在実装されていません', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  )
}

/**
 * POST /api/diagnosis/[id]/result/share
 * 結果の共有URLを生成（将来実装用）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'この機能は現在実装されていません', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  )
}