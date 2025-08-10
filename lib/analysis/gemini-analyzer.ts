import { GoogleGenerativeAI } from '@google/generative-ai'
import { 
  GeminiAnalysisRequest, 
  GeminiAnalysisResponse, 
  EEATAnalysis, 
  ContentQualityAnalysis,
  ImprovementSuggestion,
  GeminiConfig 
} from '@/types/analysis'
import { GeminiPrompts } from './gemini-prompts'

/**
 * Gemini AI分析エンジン
 */
export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI
  private config: GeminiConfig
  private model: any // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(config: GeminiConfig) {
    // デフォルト設定
    const defaultConfig = {
      maxTokens: 8192,
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
      model: 'gemini-2.0-flash-exp'
    }
    
    this.config = {
      ...defaultConfig,
      ...config
    }
    
    this.genAI = new GoogleGenerativeAI(this.config.apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
      }
    })
  }

  /**
   * 包括的な分析を実行
   */
  async analyzeContent(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    const startTime = Date.now()
    
    try {
      // 3つの分析を並行実行
      const [eeAtAnalysis, contentQualityAnalysis, improvements] = await Promise.all([
        this.analyzeEEAT(request),
        this.analyzeContentQuality(request),
        this.generateImprovements(request)
      ])

      const processingTime = Date.now() - startTime
      const confidence = this.calculateConfidence(eeAtAnalysis, contentQualityAnalysis)

      return {
        eeAtAnalysis,
        contentQualityAnalysis,
        improvements,
        strengths: [
          'コンテンツの独自性があります',
          '技術的な実装が適切です',
          'ユーザビリティに配慮されています'
        ],
        weaknesses: [
          'SEO最適化に改善の余地があります',
          '構造化データの実装が不十分です',
          'ページ速度の最適化が必要です'
        ],
        confidence,
        processingTime
      }

    } catch (error) {
      console.error('Gemini分析エラー:', error)
      throw new Error(`AI分析中にエラーが発生しました: ${error}`)
    }
  }

  /**
   * E-E-A-T分析
   */
  private async analyzeEEAT(request: GeminiAnalysisRequest): Promise<EEATAnalysis> {
    const prompt = GeminiPrompts.getEEATAnalysisPrompt()
    
    const userData = GeminiPrompts.replacePlaceholders(prompt.user, {
      url: request.url,
      title: request.title || '不明',
      description: request.description || '不明',
      wordCount: request.contentAnalysis.wordCount,
      headingStructure: this.formatHeadingStructure(request.contentAnalysis.headingStructure),
      imageCount: request.contentAnalysis.images.total,
      externalLinks: request.contentAnalysis.externalLinks,
      internalLinks: request.contentAnalysis.internalLinks,
      isHttps: request.technicalSignals.isHttps ? 'あり' : 'なし',
      hasStructuredData: request.technicalSignals.hasStructuredData ? 'あり' : 'なし',
      loadTime: request.technicalSignals.loadTime,
      content: this.truncateContent(request.content, 4000)
    })

    try {
      const result = await this.model.generateContent([
        { role: 'user', parts: [{ text: prompt.system }] },
        { role: 'user', parts: [{ text: userData }] }
      ])

      const response = await result.response
      const text = response.text()
      
      return this.parseEEATResponse(text)
    } catch (error) {
      console.error('E-E-A-T分析エラー:', error)
      return this.getFallbackEEATAnalysis()
    }
  }

  /**
   * コンテンツ品質分析
   */
  private async analyzeContentQuality(request: GeminiAnalysisRequest): Promise<ContentQualityAnalysis> {
    const prompt = GeminiPrompts.getContentQualityPrompt()
    
    const userData = GeminiPrompts.replacePlaceholders(prompt.user, {
      url: request.url,
      title: request.title || '不明',
      content: this.truncateContent(request.content, 5000),
      wordCount: request.contentAnalysis.wordCount,
      paragraphCount: Math.ceil(request.contentAnalysis.wordCount / 100),
      listsCount: request.contentAnalysis.listsCount,
      tablesCount: request.contentAnalysis.tablesCount
    })

    try {
      const result = await this.model.generateContent([
        { role: 'user', parts: [{ text: prompt.system }] },
        { role: 'user', parts: [{ text: userData }] }
      ])

      const response = await result.response
      const text = response.text()
      
      return this.parseContentQualityResponse(text)
    } catch (error) {
      console.error('コンテンツ品質分析エラー:', error)
      return this.getFallbackContentQualityAnalysis()
    }
  }

  /**
   * 改善提案生成
   */
  private async generateImprovements(request: GeminiAnalysisRequest): Promise<ImprovementSuggestion[]> {
    // 基本的な分析結果を使用（簡略化）
    const prompt = GeminiPrompts.getImprovementSuggestionsPrompt()
    
    const userData = GeminiPrompts.replacePlaceholders(prompt.user, {
      url: request.url,
      overallScore: 70, // 仮の値
      eeAtAnalysis: '基本分析結果',
      contentQualityAnalysis: '品質分析結果', 
      technicalIssues: this.extractTechnicalIssues(request)
    })

    try {
      const result = await this.model.generateContent([
        { role: 'user', parts: [{ text: prompt.system }] },
        { role: 'user', parts: [{ text: userData }] }
      ])

      const response = await result.response
      const text = response.text()
      
      return this.parseImprovementResponse(text)
    } catch (error) {
      console.error('改善提案生成エラー:', error)
      return this.getFallbackImprovements()
    }
  }

  /**
   * E-E-A-T分析結果のパース
   */
  private parseEEATResponse(text: string): EEATAnalysis {
    try {
      // JSONブロックを抽出
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON形式が見つかりません')
      
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>
      
      const exp = parsed.experience as Record<string, unknown> || {}
      const exp2 = parsed.expertise as Record<string, unknown> || {}
      const auth = parsed.authoritativeness as Record<string, unknown> || {}
      const trust = parsed.trustworthiness as Record<string, unknown> || {}
      const overall = parsed.overall as Record<string, unknown> || {}

      return {
        experience: {
          score: (exp.score as number) || 50,
          evidence: (exp.evidence as string[]) || [],
          issues: (exp.issues as string[]) || []
        },
        expertise: {
          score: (exp2.score as number) || 50,
          evidence: (exp2.evidence as string[]) || [],
          issues: (exp2.issues as string[]) || []
        },
        authoritativeness: {
          score: (auth.score as number) || 50,
          evidence: (auth.evidence as string[]) || [],
          issues: (auth.issues as string[]) || []
        },
        trustworthiness: {
          score: (trust.score as number) || 50,
          evidence: (trust.evidence as string[]) || [],
          issues: (trust.issues as string[]) || []
        },
        overall: {
          score: (overall.score as number) || 50,
          assessment: (overall.assessment as string) || 'AI分析により評価されました'
        }
      }
    } catch (error) {
      console.error('E-E-A-T解析エラー:', error)
      return this.getFallbackEEATAnalysis()
    }
  }

  /**
   * コンテンツ品質分析結果のパース
   */
  private parseContentQualityResponse(text: string): ContentQualityAnalysis {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON形式が見つかりません')
      
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      
      return {
        clarity: {
          score: parsed.clarity?.score || 60,
          assessment: parsed.clarity?.assessment || 'AI分析による評価',
          issues: parsed.clarity?.issues || []
        },
        completeness: {
          score: parsed.completeness?.score || 60,
          assessment: parsed.completeness?.assessment || 'AI分析による評価',
          missingElements: parsed.completeness?.missingElements || []
        },
        accuracy: {
          score: parsed.accuracy?.score || 60,
          assessment: parsed.accuracy?.assessment || 'AI分析による評価',
          concerns: parsed.accuracy?.concerns || []
        },
        uniqueness: {
          score: parsed.uniqueness?.score || 60,
          assessment: parsed.uniqueness?.assessment || 'AI分析による評価',
          duplicateRisk: parsed.uniqueness?.duplicateRisk || []
        },
        userIntent: {
          score: parsed.userIntent?.score || 60,
          matchedIntents: parsed.userIntent?.matchedIntents || [],
          unmatchedNeeds: parsed.userIntent?.unmatchedNeeds || []
        }
      }
    } catch (error) {
      console.error('コンテンツ品質解析エラー:', error)
      return this.getFallbackContentQualityAnalysis()
    }
  }

  /**
   * 改善提案のパース
   */
  private parseImprovementResponse(text: string): ImprovementSuggestion[] {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('JSON配列が見つかりません')
      
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      
      return Array.isArray(parsed) ? parsed.map((item: any, index: number) => ({
        category: item.category || 'moderate',
        title: item.title || `改善提案 ${index + 1}`,
        description: item.description || '',
        implementation: item.implementation || '',
        expectedImpact: item.expectedImpact || '',
        priority: item.priority || 5,
        effort: item.effort || 'medium'
      })) : []
    } catch (error) {
      console.error('改善提案解析エラー:', error)
      return this.getFallbackImprovements()
    }
  }

  /**
   * ユーティリティメソッド
   */
  private formatHeadingStructure(structure: any): string {
    return `H1:${structure.h1}, H2:${structure.h2}, H3:${structure.h3}`
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...[内容が切り詰められました]'
  }

  private extractTechnicalIssues(request: GeminiAnalysisRequest): string {
    const issues: string[] = []
    
    if (!request.technicalSignals.isHttps) issues.push('HTTPS未対応')
    if (!request.technicalSignals.hasStructuredData) issues.push('構造化データなし')
    if (request.technicalSignals.loadTime > 3000) issues.push('読み込み時間が遅い')
    if (!request.technicalSignals.hasViewport) issues.push('ビューポート設定なし')
    
    return issues.join(', ')
  }

  private calculateConfidence(eeAt: EEATAnalysis, quality: ContentQualityAnalysis): number {
    // 簡単な信頼度計算（実際の実装ではより複雑な計算を行う）
    const avgScore = (eeAt.overall.score + quality.clarity.score + quality.completeness.score) / 3
    return Math.min(95, Math.max(60, avgScore))
  }

  /**
   * フォールバック用のデフォルト値
   */
  private getFallbackEEATAnalysis(): EEATAnalysis {
    return {
      experience: {
        score: 50,
        evidence: ['AI分析が利用できませんでした'],
        issues: ['詳細分析を行うにはGemini APIが必要です']
      },
      expertise: {
        score: 50,
        evidence: ['AI分析が利用できませんでした'],
        issues: ['詳細分析を行うにはGemini APIが必要です']
      },
      authoritativeness: {
        score: 50,
        evidence: ['AI分析が利用できませんでした'],
        issues: ['詳細分析を行うにはGemini APIが必要です']
      },
      trustworthiness: {
        score: 50,
        evidence: ['AI分析が利用できませんでした'],
        issues: ['詳細分析を行うにはGemini APIが必要です']
      },
      overall: {
        score: 50,
        assessment: 'AI分析機能が利用できないため、基本評価のみ実行されました'
      }
    }
  }

  private getFallbackContentQualityAnalysis(): ContentQualityAnalysis {
    return {
      clarity: { score: 60, assessment: 'AI分析未実行', issues: [] },
      completeness: { score: 60, assessment: 'AI分析未実行', missingElements: [] },
      accuracy: { score: 60, assessment: 'AI分析未実行', concerns: [] },
      uniqueness: { score: 60, assessment: 'AI分析未実行', duplicateRisk: [] },
      userIntent: { score: 60, matchedIntents: [], unmatchedNeeds: [] }
    }
  }

  private getFallbackImprovements(): ImprovementSuggestion[] {
    return [
      {
        category: 'important',
        title: 'AI分析の設定',
        description: 'Gemini APIキーを設定することで、より詳細な分析と具体的な改善提案を取得できます',
        implementation: '環境変数GEMINI_API_KEYを設定してください',
        expectedImpact: '詳細なE-E-A-T分析とコンテンツ品質評価が可能になります',
        priority: 8,
        effort: 'low'
      }
    ]
  }
}