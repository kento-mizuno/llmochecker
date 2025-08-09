import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DiagnosisService } from '../../lib/diagnosis/diagnosis-service'
import { ReportGenerator } from '../../lib/diagnosis/report-generator'
import { AnalysisResult } from '../types/analysis'

// Supabase クライアントのモック
vi.mock('../../lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-diagnosis-id', url: 'https://example.com' },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-diagnosis-id',
              url: 'https://example.com',
              overall_score: 85,
              category: 'B',
              diagnosis_date: new Date().toISOString(),
              metadata: {},
              technical_signals: {},
              content_analysis: {},
              gemini_analysis: null,
              status: 'completed'
            },
            error: null
          })),
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('DiagnosisService', () => {
  let service: DiagnosisService
  let mockAnalysisResult: AnalysisResult

  beforeEach(() => {
    service = new DiagnosisService()
    mockAnalysisResult = {
      url: 'https://example.com',
      timestamp: new Date(),
      metadata: {
        title: 'テストページ',
        description: 'テスト用のページです'
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
        pageSize: 25600,
        responseCode: 200
      },
      contentAnalysis: {
        wordCount: 500,
        headingStructure: { h1: 1, h2: 3, h3: 2, h4: 0, h5: 0, h6: 0, structure: [] },
        internalLinks: 5,
        externalLinks: 2,
        images: { total: 3, withAlt: 2, withTitle: 1, optimized: 1 },
        listsCount: 2,
        tablesCount: 1,
        hasContactInfo: true,
        hasAddressInfo: true
      },
      evaluations: [
        {
          criteriaId: 'experience',
          score: 80,
          maxScore: 100,
          status: 'good',
          issues: [],
          suggestions: ['実体験を追加してください']
        }
      ],
      overallScore: 85,
      category: 'B'
    }
  })

  describe('saveDiagnosis', () => {
    it('診断結果を正常に保存する', async () => {
      const diagnosisId = await service.saveDiagnosis(mockAnalysisResult)
      
      expect(diagnosisId).toBe('test-diagnosis-id')
    })
  })

  describe('getDiagnosis', () => {
    it('診断結果を正常に取得する', async () => {
      const result = await service.getDiagnosis('test-diagnosis-id')
      
      expect(result).not.toBeNull()
      expect(result?.url).toBe('https://example.com')
      expect(result?.overallScore).toBe(85)
      expect(result?.category).toBe('B')
    })
  })
})

describe('ReportGenerator', () => {
  let mockAnalysisResult: AnalysisResult

  beforeEach(() => {
    mockAnalysisResult = {
      url: 'https://example.com',
      timestamp: new Date('2025-01-01T00:00:00Z'),
      metadata: {
        title: 'テストページ',
        description: 'テスト用のページです'
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
        pageSize: 25600,
        responseCode: 200
      },
      contentAnalysis: {
        wordCount: 500,
        headingStructure: { h1: 1, h2: 3, h3: 2, h4: 0, h5: 0, h6: 0, structure: [] },
        internalLinks: 5,
        externalLinks: 2,
        images: { total: 3, withAlt: 2, withTitle: 1, optimized: 1 },
        listsCount: 2,
        tablesCount: 1,
        hasContactInfo: true,
        hasAddressInfo: true
      },
      evaluations: [
        {
          criteriaId: 'experience',
          score: 80,
          maxScore: 100,
          status: 'good',
          issues: [],
          suggestions: ['実体験を追加してください']
        }
      ],
      overallScore: 85,
      category: 'B'
    }
  })

  describe('generateHtmlReport', () => {
    it('HTMLレポートを正常に生成する', () => {
      const htmlReport = ReportGenerator.generateHtmlReport(mockAnalysisResult)
      
      expect(htmlReport).toContain('<!DOCTYPE html>')
      expect(htmlReport).toContain('LLMO診断レポート')
      expect(htmlReport).toContain('https://example.com')
      expect(htmlReport).toContain('85')
      expect(htmlReport).toContain('グレード B')
    })

    it('技術的情報を含む', () => {
      const htmlReport = ReportGenerator.generateHtmlReport(mockAnalysisResult)
      
      expect(htmlReport).toContain('HTTPS')
      expect(htmlReport).toContain('1500ms')
      expect(htmlReport).toContain('25KB')
    })
  })

  describe('generateJsonReport', () => {
    it('JSONレポートを正常に生成する', () => {
      const jsonReport = ReportGenerator.generateJsonReport(mockAnalysisResult)
      const parsed = JSON.parse(jsonReport)
      
      expect(parsed.summary.url).toBe('https://example.com')
      expect(parsed.summary.overallScore).toBe(85)
      expect(parsed.summary.category).toBe('B')
      expect(parsed.technicalSignals.https).toBe(true)
      expect(parsed.technicalSignals.loadTime).toBe(1500)
    })

    it('評価結果を含む', () => {
      const jsonReport = ReportGenerator.generateJsonReport(mockAnalysisResult)
      const parsed = JSON.parse(jsonReport)
      
      expect(parsed.evaluations).toHaveLength(1)
      expect(parsed.evaluations[0].criteriaId).toBe('experience')
      expect(parsed.evaluations[0].score).toBe(80)
      expect(parsed.evaluations[0].status).toBe('good')
    })
  })
})