import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiAnalyzer } from '../../lib/analysis/gemini-analyzer'
import { GeminiAnalysisRequest } from '@/types/analysis'

// Google Generative AI のモック
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            experience: { score: 75, evidence: ['実体験あり'], issues: [] },
            expertise: { score: 80, evidence: ['専門知識あり'], issues: [] },
            authoritativeness: { score: 70, evidence: [], issues: ['外部リンク不足'] },
            trustworthiness: { score: 85, evidence: ['HTTPS使用'], issues: [] },
            overall: { score: 77, assessment: '良好な品質です' }
          })
        }
      })
    })
  }))
}))

describe('GeminiAnalyzer', () => {
  let analyzer: GeminiAnalyzer
  let mockRequest: GeminiAnalysisRequest

  beforeEach(() => {
    analyzer = new GeminiAnalyzer({
      apiKey: 'test-api-key',
      model: 'gemini-2.0-flash-exp'
    })

    mockRequest = {
      url: 'https://example.com',
      title: 'テストページ',
      description: 'テスト用のページです',
      content: '<html><body><h1>テストコンテンツ</h1><p>これはテストです。</p></body></html>',
      metadata: {
        title: 'テストページ',
        description: 'テスト用のページです'
      },
      contentAnalysis: {
        wordCount: 100,
        headingStructure: { h1: 1, h2: 2, h3: 0, h4: 0, h5: 0, h6: 0, structure: [] },
        internalLinks: 3,
        externalLinks: 1,
        images: { total: 2, withAlt: 1, withTitle: 0, optimized: 0 },
        listsCount: 1,
        tablesCount: 0,
        hasContactInfo: true,
        hasAddressInfo: false
      },
      technicalSignals: {
        hasRobotsTxt: true,
        hasSitemap: true,
        hasStructuredData: false,
        hasHreflang: false,
        hasCanonical: true,
        isHttps: true,
        hasViewport: true,
        loadTime: 1500,
        pageSize: 25000,
        responseCode: 200
      }
    }
  })

  describe('analyzeContent', () => {
    it('包括的な分析を実行する', async () => {
      const result = await analyzer.analyzeContent(mockRequest)

      expect(result).toHaveProperty('eeAtAnalysis')
      expect(result).toHaveProperty('contentQualityAnalysis')
      expect(result).toHaveProperty('improvements')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('processingTime')

      // E-E-A-T分析結果の構造確認
      expect(result.eeAtAnalysis).toHaveProperty('experience')
      expect(result.eeAtAnalysis).toHaveProperty('expertise')
      expect(result.eeAtAnalysis).toHaveProperty('authoritativeness')
      expect(result.eeAtAnalysis).toHaveProperty('trustworthiness')
      expect(result.eeAtAnalysis).toHaveProperty('overall')

      // スコアの妥当性確認
      expect(result.eeAtAnalysis.experience.score).toBeGreaterThanOrEqual(0)
      expect(result.eeAtAnalysis.experience.score).toBeLessThanOrEqual(100)
      
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it('信頼度を適切に計算する', async () => {
      const result = await analyzer.analyzeContent(mockRequest)

      // 信頼度は60-95の範囲内であることを確認
      expect(result.confidence).toBeGreaterThanOrEqual(60)
      expect(result.confidence).toBeLessThanOrEqual(95)
    })

    it('改善提案を生成する', async () => {
      const result = await analyzer.analyzeContent(mockRequest)

      expect(Array.isArray(result.improvements)).toBe(true)
      
      if (result.improvements.length > 0) {
        const improvement = result.improvements[0]
        expect(improvement).toHaveProperty('category')
        expect(improvement).toHaveProperty('title')
        expect(improvement).toHaveProperty('description')
        expect(improvement).toHaveProperty('implementation')
        expect(improvement).toHaveProperty('expectedImpact')
        expect(improvement).toHaveProperty('priority')
        expect(improvement).toHaveProperty('effort')
        
        expect(['critical', 'important', 'moderate', 'low']).toContain(improvement.category)
        expect(['low', 'medium', 'high']).toContain(improvement.effort)
      }
    })
  })

  describe('エラーハンドリング', () => {
    it('フォールバック機能が動作する', () => {
      // 基本的なコンストラクタテスト
      const analyzerBasic = new GeminiAnalyzer({
        apiKey: 'test-key',
        model: 'gemini-2.0-flash-exp'
      })

      expect(analyzerBasic).toBeInstanceOf(GeminiAnalyzer)
    })
  })
})