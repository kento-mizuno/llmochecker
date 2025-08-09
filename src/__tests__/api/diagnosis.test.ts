import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as diagnosisStart } from '../../app/api/diagnosis/start/route'
import { GET as progressGet } from '../../app/api/diagnosis/[id]/progress/route'
import { GET as resultGet } from '../../app/api/diagnosis/[id]/result/route'

// IntegratedDiagnosisのモック
vi.mock('../../../lib/diagnosis/integrated-diagnosis', () => ({
  IntegratedDiagnosis: vi.fn().mockImplementation(() => ({
    executeDiagnosis: vi.fn().mockResolvedValue({
      diagnosisId: 'test-diagnosis-id',
      result: {
        url: 'https://example.com',
        timestamp: new Date('2025-01-01'),
        overallScore: 85,
        category: 'B'
      },
      fromCache: false,
      reports: {
        html: '<html>テストレポート</html>',
        json: JSON.stringify({ test: 'data' })
      }
    }),
    getProgress: vi.fn().mockResolvedValue({
      id: 'progress-123',
      status: 'completed',
      currentStep: '診断完了',
      percentage: 100,
      estimatedCompletion: new Date()
    }),
    getDiagnosis: vi.fn().mockResolvedValue({
      diagnosisId: 'test-diagnosis-id',
      result: {
        url: 'https://example.com',
        timestamp: new Date('2025-01-01'),
        overallScore: 85,
        category: 'B',
        technicalSignals: {
          isHttps: true,
          loadTime: 1500,
          pageSize: 25000
        },
        contentAnalysis: {
          wordCount: 500
        },
        evaluations: [
          {
            criteriaId: 'experience',
            score: 80,
            maxScore: 100,
            status: 'good',
            issues: [],
            suggestions: []
          }
        ]
      },
      fromCache: false,
      reports: {
        html: '<html>診断レポート</html>',
        json: JSON.stringify({
          summary: {
            url: 'https://example.com',
            overallScore: 85
          }
        })
      }
    })
  }))
}))

// URLValidatorのモック
vi.mock('../../../../lib/utils/url-validator', () => ({
  URLValidator: {
    validateUrl: vi.fn().mockReturnValue({
      isValid: true,
      errors: []
    })
  }
}))

describe('Diagnosis API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をテスト用に設定
    process.env.NODE_ENV = 'development'
    process.env.GEMINI_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('/api/diagnosis/start', () => {
    it('正常なリクエストで診断を開始する', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/start', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          options: { timeout: 30000 }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await diagnosisStart(request)
      const data = await response.json()

      expect(response.status).toBe(202)
      expect(data.success).toBe(true)
      expect(data.progressId).toBeDefined()
      expect(data.status).toBe('started')
      expect(data.estimatedTime).toBeDefined()
    })

    it('URLが空の場合400エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await diagnosisStart(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('URLが必要です')
      expect(data.code).toBe('INVALID_URL')
    })

    it('無効なURL形式で400エラーを返す', async () => {
      // URLValidatorのモックを無効なURLの場合に変更
      const { URLValidator } = await import('../../../../lib/utils/url-validator')
      vi.mocked(URLValidator.validateUrl).mockReturnValue({
        isValid: false,
        errors: ['無効なURL形式']
      })

      const request = new NextRequest('http://localhost:3000/api/diagnosis/start', {
        method: 'POST',
        body: JSON.stringify({
          url: 'invalid-url'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await diagnosisStart(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('URLが無効です')
      expect(data.code).toBe('INVALID_URL_FORMAT')
    })
  })

  describe('/api/diagnosis/[id]/progress', () => {
    it('進捗情報を正常に取得する', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/progress-123/progress')
      const params = { id: 'progress-123' }

      const response = await progressGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('progress-123')
      expect(data.status).toBe('completed')
      expect(data.percentage).toBe(100)
      expect(data.resultUrl).toBe('/api/diagnosis/progress-123/result')
    })

    it('存在しないIDで404エラーを返す', async () => {
      const { IntegratedDiagnosis } = await import('../../../lib/diagnosis/integrated-diagnosis')
      const mockInstance = new IntegratedDiagnosis()
      vi.mocked(mockInstance.getProgress).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/diagnosis/nonexistent/progress')
      const params = { id: 'nonexistent' }

      const response = await progressGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('指定された診断が見つかりません')
      expect(data.code).toBe('NOT_FOUND')
    })

    it('無効なIDで400エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis//progress')
      const params = { id: '' }

      const response = await progressGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('診断IDが無効です')
      expect(data.code).toBe('INVALID_ID')
    })
  })

  describe('/api/diagnosis/[id]/result', () => {
    it('診断結果をJSON形式で取得する', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/test-id/result')
      const params = { id: 'test-id' }

      const response = await resultGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('test-diagnosis-id')
      expect(data.summary.url).toBe('https://example.com')
      expect(data.summary.overallScore).toBe(85)
      expect(data.reports.htmlUrl).toBe('/api/diagnosis/test-id/result?format=html')
    })

    it('診断結果をHTML形式で取得する', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/test-id/result?format=html')
      const params = { id: 'test-id' }

      const response = await resultGet(request, { params })
      const html = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
      expect(html).toBe('<html>診断レポート</html>')
    })

    it('存在しない診断IDで404エラーを返す', async () => {
      const { IntegratedDiagnosis } = await import('../../../lib/diagnosis/integrated-diagnosis')
      const mockInstance = new IntegratedDiagnosis()
      vi.mocked(mockInstance.getDiagnosis).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/diagnosis/nonexistent/result')
      const params = { id: 'nonexistent' }

      const response = await resultGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('指定された診断結果が見つかりません')
      expect(data.code).toBe('NOT_FOUND')
    })

    it('PDF形式は未実装で501エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/diagnosis/test-id/result?format=pdf')
      const params = { id: 'test-id' }

      const response = await resultGet(request, { params })
      const data = await response.json()

      expect(response.status).toBe(501)
      expect(data.error).toBe('PDF形式は現在準備中です')
      expect(data.code).toBe('NOT_IMPLEMENTED')
    })
  })

  describe('統合テスト', () => {
    it('診断開始→進捗確認→結果取得の完全フロー', async () => {
      // 1. 診断開始
      const startRequest = new NextRequest('http://localhost:3000/api/diagnosis/start', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const startResponse = await diagnosisStart(startRequest)
      const startData = await startResponse.json()

      expect(startResponse.status).toBe(202)
      expect(startData.progressId).toBeDefined()

      // 2. 進捗確認（完了と仮定）
      const progressRequest = new NextRequest('http://localhost:3000/api/diagnosis/progress-123/progress')
      const progressResponse = await progressGet(progressRequest, { params: { id: 'progress-123' } })
      const progressData = await progressResponse.json()

      expect(progressResponse.status).toBe(200)
      expect(progressData.status).toBe('completed')

      // 3. 結果取得
      const resultRequest = new NextRequest('http://localhost:3000/api/diagnosis/test-id/result')
      const resultResponse = await resultGet(resultRequest, { params: { id: 'test-id' } })
      const resultData = await resultResponse.json()

      expect(resultResponse.status).toBe(200)
      expect(resultData.summary.overallScore).toBe(85)
    })
  })
})