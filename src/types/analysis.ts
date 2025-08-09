/**
 * URL分析・評価エンジンの型定義
 */

export interface UrlValidationResult {
  isValid: boolean
  normalizedUrl: string
  errors: string[]
  warnings: string[]
}

export interface MetaData {
  title?: string
  description?: string
  keywords?: string
  author?: string
  viewport?: string
  charset?: string
  robots?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export interface TechnicalSignals {
  hasRobotsTxt: boolean
  hasSitemap: boolean
  hasStructuredData: boolean
  hasHreflang: boolean
  hasCanonical: boolean
  isHttps: boolean
  hasViewport: boolean
  loadTime: number
  pageSize: number
  responseCode: number
}

export interface ContentAnalysis {
  wordCount: number
  headingStructure: HeadingStructure
  internalLinks: number
  externalLinks: number
  images: ImageAnalysis
  listsCount: number
  tablesCount: number
  hasContactInfo: boolean
  hasAddressInfo: boolean
}

export interface HeadingStructure {
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  h6: number
  structure: string[] // 見出しの階層構造
}

export interface ImageAnalysis {
  total: number
  withAlt: number
  withTitle: number
  optimized: number
}

export interface EvaluationResult {
  criteriaId: string
  score: number
  maxScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  issues: string[]
  suggestions: string[]
}

export interface AnalysisResult {
  url: string
  timestamp: Date
  metadata: MetaData
  technicalSignals: TechnicalSignals
  contentAnalysis: ContentAnalysis
  evaluations: EvaluationResult[]
  overallScore: number
  category: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface CrawlOptions {
  timeout: number
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  userAgent?: string
  viewport?: {
    width: number
    height: number
  }
}