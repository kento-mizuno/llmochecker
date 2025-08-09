import { describe, it, expect } from 'vitest'
import { EvaluationEngine } from '../../lib/analysis/evaluation-engine'
import { MetaData, ContentAnalysis, TechnicalSignals } from '@/types/analysis'

describe('EvaluationEngine', () => {
  const mockMetadata: MetaData = {
    title: 'テストページ',
    description: 'テスト用のページです',
    canonical: 'https://example.com/test'
  }

  const mockContentAnalysis: ContentAnalysis = {
    wordCount: 500,
    headingStructure: {
      h1: 1,
      h2: 3,
      h3: 2,
      h4: 0,
      h5: 0,
      h6: 0,
      structure: ['H1: メインタイトル', 'H2: サブタイトル']
    },
    internalLinks: 5,
    externalLinks: 2,
    images: {
      total: 3,
      withAlt: 2,
      withTitle: 1,
      optimized: 1
    },
    listsCount: 2,
    tablesCount: 1,
    hasContactInfo: true,
    hasAddressInfo: true
  }

  const mockTechnicalSignals: TechnicalSignals = {
    hasRobotsTxt: true,
    hasSitemap: true,
    hasStructuredData: true,
    hasHreflang: false,
    hasCanonical: true,
    isHttps: true,
    hasViewport: true,
    loadTime: 2000,
    pageSize: 50000,
    responseCode: 200
  }

  describe('evaluateAll', () => {
    it('全18項目の評価を実行する', () => {
      const html = '<html><body>実際にテストしてみました。著者は専門家です。</body></html>'
      
      const evaluations = EvaluationEngine.evaluateAll(
        mockMetadata,
        mockContentAnalysis,
        mockTechnicalSignals,
        html
      )

      expect(evaluations).toHaveLength(18)
      
      // 各評価にcriteriaIdが設定されている
      evaluations.forEach(evaluation => {
        expect(evaluation.criteriaId).toBeTruthy()
        expect(evaluation.score).toBeGreaterThanOrEqual(0)
        expect(evaluation.score).toBeLessThanOrEqual(100)
        expect(evaluation.maxScore).toBe(100)
        expect(['excellent', 'good', 'fair', 'poor']).toContain(evaluation.status)
      })
    })

    it('HTTPS使用時にTrustworthinessスコアが高くなる', () => {
      const html = '<html><body>テストコンテンツ</body></html>'
      
      const httpsSignals = { ...mockTechnicalSignals, isHttps: true }
      const httpSignals = { ...mockTechnicalSignals, isHttps: false }

      const httpsEvaluations = EvaluationEngine.evaluateAll(mockMetadata, mockContentAnalysis, httpsSignals, html)
      const httpEvaluations = EvaluationEngine.evaluateAll(mockMetadata, mockContentAnalysis, httpSignals, html)

      const httpsScore = httpsEvaluations.find(e => e.criteriaId === 'trustworthiness')?.score || 0
      const httpScore = httpEvaluations.find(e => e.criteriaId === 'trustworthiness')?.score || 0

      expect(httpsScore).toBeGreaterThan(httpScore)
    })
  })
})