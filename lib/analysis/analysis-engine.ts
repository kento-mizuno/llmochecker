import { UrlValidator } from '@/lib/utils/url-validator'
import { WebCrawler } from './web-crawler'
import { HtmlParser } from './html-parser'
import { EvaluationEngine } from './evaluation-engine'
import { GeminiAnalyzer } from './gemini-analyzer'
import { 
  AnalysisResult, 
  CrawlOptions, 
  GeminiAnalysisRequest, 
  GeminiAnalysisResponse,
  EvaluationResult
} from '@/types/analysis'

/**
 * URL分析・評価エンジンのメインクラス
 * 全ての分析機能を統合
 */
export class AnalysisEngine {
  private crawler: WebCrawler
  private geminiAnalyzer?: GeminiAnalyzer
  
  constructor(geminiApiKey?: string) {
    this.crawler = new WebCrawler()
    
    // Gemini APIキーが提供された場合のみGeminiAnalyzerを初期化
    if (geminiApiKey) {
      this.geminiAnalyzer = new GeminiAnalyzer({
        apiKey: geminiApiKey,
        model: 'gemini-2.0-flash-exp'
      })
    }
  }

  /**
   * URLを分析して総合評価を実行
   */
  async analyzeUrl(
    inputUrl: string, 
    options: Partial<CrawlOptions> = {}
  ): Promise<AnalysisResult> {
    
    // 1. URL検証
    const urlValidation = UrlValidator.validate(inputUrl)
    if (!urlValidation.isValid) {
      throw new Error(`URL検証エラー: ${urlValidation.errors.join(', ')}`)
    }

    const normalizedUrl = urlValidation.normalizedUrl

    try {
      // 2. Webクローリング
      console.log('🕷️  Webクローリングを開始...')
      const crawlResult = await this.crawler.crawlPage(normalizedUrl, options)
      
      // 3. HTML解析
      console.log('📝 HTML解析を開始...')
      const parser = new HtmlParser(crawlResult.html)
      const metadata = parser.extractMetadata()
      const contentAnalysis = parser.analyzeContent()
      
      // 4. 基本18項目評価の実行
      console.log('⚖️  基本評価エンジンを実行...')
      const evaluations = EvaluationEngine.evaluateAll(
        metadata,
        contentAnalysis,
        crawlResult.technicalSignals,
        crawlResult.html
      )

      // 5. Gemini AI分析（利用可能な場合）
      let geminiAnalysis: GeminiAnalysisResponse | undefined
      if (this.geminiAnalyzer) {
        console.log('🤖 Gemini AI分析を実行...')
        try {
          const geminiRequest: GeminiAnalysisRequest = {
            url: normalizedUrl,
            title: metadata.title,
            description: metadata.description,
            content: crawlResult.html,
            metadata,
            contentAnalysis,
            technicalSignals: crawlResult.technicalSignals
          }
          
          geminiAnalysis = await this.geminiAnalyzer.analyzeContent(geminiRequest)
          console.log(`✨ AI分析完了 (${geminiAnalysis.processingTime}ms, 信頼度: ${geminiAnalysis.confidence}%)`)
        } catch (error) {
          console.warn('⚠️  Gemini分析をスキップ:', error)
        }
      } else {
        console.log('ℹ️  Gemini分析はスキップ（APIキー未設定）')
      }

      // 6. 総合スコア計算（Gemini結果も考慮）
      const overallScore = this.calculateOverallScore(evaluations, geminiAnalysis)
      const category = this.determineCategory(overallScore)

      // 7. 結果をまとめる
      const result: AnalysisResult = {
        url: normalizedUrl,
        timestamp: new Date(),
        metadata,
        technicalSignals: crawlResult.technicalSignals,
        contentAnalysis,
        evaluations,
        overallScore,
        category,
        geminiAnalysis // AI分析結果を追加
      }

      console.log('✅ 分析完了:', {
        url: normalizedUrl,
        score: overallScore,
        category,
        evaluationsCount: evaluations.length
      })

      return result

    } catch (error) {
      console.error('分析エラー:', error)
      throw new Error(`分析処理中にエラーが発生しました: ${error}`)
    }
  }

  /**
   * 総合スコアを計算（重み付き平均、Gemini結果も考慮）
   */
  private calculateOverallScore(evaluations: EvaluationResult[], geminiAnalysis?: GeminiAnalysisResponse): number {
    if (evaluations.length === 0) return 0

    // 重要度による重み付け
    const weights: Record<string, number> = {
      // E-E-A-T（最重要）
      'experience': 1.5,
      'expertise': 1.5,
      'authoritativeness': 1.5,
      'trustworthiness': 1.5,
      
      // エンティティ（最重要）
      'knowledge-graph': 1.5,
      'nap-consistency': 1.5,
      
      // AI親和性（重要）
      'list-usage': 1.2,
      'definition-summary': 1.2,
      'qa-format': 1.2,
      'semantic-html': 1.2,
      
      // 品質（重要）
      'info-accuracy': 1.2,
      'heading-structure': 1.2,
      
      // 構造（重要）
      'logical-structure': 1.2,
      'content-clarity': 1.2,
      
      // 技術（中程度）
      'page-experience': 1.0,
      'crawlability': 1.0,
      'structured-data': 1.0,
      
      // その他（低重要度）
      'llms-txt': 0.8
    }

    let weightedSum = 0
    let totalWeight = 0

    evaluations.forEach(evaluation => {
      const weight = weights[evaluation.criteriaId] || 1.0
      weightedSum += evaluation.score * weight
      totalWeight += weight
    })

    let baseScore = weightedSum / totalWeight

    // Gemini分析結果がある場合は補正を適用
    if (geminiAnalysis) {
      const eeAtAvg = (
        geminiAnalysis.eeAtAnalysis.experience.score +
        geminiAnalysis.eeAtAnalysis.expertise.score +
        geminiAnalysis.eeAtAnalysis.authoritativeness.score +
        geminiAnalysis.eeAtAnalysis.trustworthiness.score
      ) / 4

      const qualityAvg = (
        geminiAnalysis.contentQualityAnalysis.clarity.score +
        geminiAnalysis.contentQualityAnalysis.completeness.score +
        geminiAnalysis.contentQualityAnalysis.accuracy.score +
        geminiAnalysis.contentQualityAnalysis.uniqueness.score +
        geminiAnalysis.contentQualityAnalysis.userIntent.score
      ) / 5

      // AI分析結果を20%の重みで補正
      const aiScore = (eeAtAvg + qualityAvg) / 2
      const confidenceWeight = geminiAnalysis.confidence / 100
      
      baseScore = (baseScore * 0.8) + (aiScore * 0.2 * confidenceWeight)
    }

    return Math.round(baseScore * 100) / 100
  }

  /**
   * スコアからカテゴリを判定
   */
  private determineCategory(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 複数URLの一括分析
   */
  async analyzeUrls(
    urls: string[],
    options: Partial<CrawlOptions> = {}
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = []
    
    for (const url of urls) {
      try {
        const result = await this.analyzeUrl(url, options)
        results.push(result)
      } catch (error) {
        console.error(`URL分析失敗: ${url}`, error)
        // エラーの場合はスキップして次のURLへ
      }
    }
    
    return results
  }

  /**
   * 分析結果をJSON形式で出力
   */
  exportResults(results: AnalysisResult | AnalysisResult[]): string {
    const data = Array.isArray(results) ? results : [results]
    return JSON.stringify(data, null, 2)
  }

  /**
   * リソースクリーンアップ
   */
  async dispose(): Promise<void> {
    await this.crawler.close()
  }
}

/**
 * 分析結果の詳細レポートを生成
 */
export class AnalysisReporter {
  
  /**
   * 分析結果から改善提案を生成
   */
  static generateImprovements(result: AnalysisResult): string[] {
    const improvements: string[] = []
    
    result.evaluations.forEach(evaluation => {
      if (evaluation.status === 'poor' || evaluation.status === 'fair') {
        improvements.push(...evaluation.suggestions)
      }
    })
    
    return [...new Set(improvements)] // 重複除去
  }

  /**
   * カテゴリ別スコアを集計
   */
  static getCategoryScores(result: AnalysisResult): Record<string, number> {
    const categoryScores: Record<string, number[]> = {}
    
    // 評価をカテゴリ別に分類（簡易版）
    result.evaluations.forEach(evaluation => {
      let category = 'その他'
      
      if (['experience', 'expertise', 'authoritativeness', 'trustworthiness'].includes(evaluation.criteriaId)) {
        category = 'E-E-A-T'
      } else if (['knowledge-graph', 'nap-consistency'].includes(evaluation.criteriaId)) {
        category = 'エンティティ'
      } else if (['list-usage', 'definition-summary', 'qa-format', 'semantic-html'].includes(evaluation.criteriaId)) {
        category = 'AI親和性'
      } else if (['page-experience', 'crawlability', 'structured-data'].includes(evaluation.criteriaId)) {
        category = '技術的要因'
      }
      
      if (!categoryScores[category]) {
        categoryScores[category] = []
      }
      categoryScores[category].push(evaluation.score)
    })
    
    // 各カテゴリの平均スコアを計算
    const averageScores: Record<string, number> = {}
    Object.keys(categoryScores).forEach(category => {
      const scores = categoryScores[category]
      averageScores[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length
    })
    
    return averageScores
  }

  /**
   * テキスト形式のレポートを生成
   */
  static generateTextReport(result: AnalysisResult): string {
    const improvements = this.generateImprovements(result)
    const categoryScores = this.getCategoryScores(result)
    
    const report = `
# LLMO分析レポート

## 基本情報
- URL: ${result.url}
- 分析日時: ${result.timestamp.toLocaleString('ja-JP')}
- 総合スコア: ${result.overallScore} / 100
- カテゴリ: ${result.category}

## カテゴリ別スコア
${Object.entries(categoryScores).map(([category, score]) => 
  `- ${category}: ${score.toFixed(1)}点`
).join('\n')}

## 主な改善提案
${improvements.slice(0, 5).map(improvement => `- ${improvement}`).join('\n')}

## 技術的情報
- ページサイズ: ${Math.round(result.technicalSignals.pageSize / 1024)}KB
- 読み込み時間: ${result.technicalSignals.loadTime}ms
- HTTPS: ${result.technicalSignals.isHttps ? 'はい' : 'いいえ'}
- robots.txt: ${result.technicalSignals.hasRobotsTxt ? 'あり' : 'なし'}
- サイトマップ: ${result.technicalSignals.hasSitemap ? 'あり' : 'なし'}
`
    
    return report.trim()
  }
}