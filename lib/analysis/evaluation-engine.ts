import { MetaData, ContentAnalysis, TechnicalSignals, EvaluationResult } from '@/types/analysis'

/**
 * 18項目の基本評価ロジック
 */
export class EvaluationEngine {
  
  /**
   * 全評価を実行
   */
  static evaluateAll(
    metadata: MetaData,
    contentAnalysis: ContentAnalysis,
    technicalSignals: TechnicalSignals,
    html: string
  ): EvaluationResult[] {
    const evaluations: EvaluationResult[] = []

    // E-E-A-T評価（最重要）
    evaluations.push(this.evaluateExperience(contentAnalysis, html))
    evaluations.push(this.evaluateExpertise(contentAnalysis, html))
    evaluations.push(this.evaluateAuthoritativeness(contentAnalysis, technicalSignals))
    evaluations.push(this.evaluateTrustworthiness(metadata, technicalSignals))

    // エンティティ評価（最重要）
    evaluations.push(this.evaluateKnowledgeGraph(html))
    evaluations.push(this.evaluateNAPConsistency(contentAnalysis))

    // AI親和性評価（重要）
    evaluations.push(this.evaluateListUsage(contentAnalysis))
    evaluations.push(this.evaluateDefinitionSummary(contentAnalysis))
    evaluations.push(this.evaluateQuestionAnswerFormat(html))
    evaluations.push(this.evaluateSemanticHTML(html))

    // 品質評価（重要）
    evaluations.push(this.evaluateInformationAccuracy(metadata, html))
    evaluations.push(this.evaluateLogicalHeadingStructure(contentAnalysis))

    // 文書階層評価（重要）
    evaluations.push(this.evaluateLogicalStructure(contentAnalysis))

    // 言語明快性評価（重要）
    evaluations.push(this.evaluateContentClarity(contentAnalysis))

    // 技術的評価（中程度）
    evaluations.push(this.evaluatePageExperience(technicalSignals))
    evaluations.push(this.evaluateCrawlability(technicalSignals))
    evaluations.push(this.evaluateStructuredData(technicalSignals))

    // 低重要度評価
    evaluations.push(this.evaluateLlmsTxtPresence(technicalSignals))

    return evaluations
  }

  /**
   * 経験（Experience）の明示
   */
  private static evaluateExperience(content: ContentAnalysis, html: string): EvaluationResult {
    let score = 0
    const issues: string[] = []
    const suggestions: string[] = []

    // 一次情報の検出パターン
    const experiencePatterns = [
      /実際に|実体験|体験談|やってみた|使ってみた|試してみた/,
      /個人的な|私の場合|筆者の/,
      /実験|検証|テスト|比較|調査/,
      /写真|画像|スクリーンショット|動画/
    ]

    const htmlLower = html.toLowerCase()
    let matchedPatterns = 0

    experiencePatterns.forEach(pattern => {
      if (pattern.test(html)) {
        matchedPatterns++
      }
    })

    // スコア計算（0-100）
    if (matchedPatterns >= 3) {
      score = 90
    } else if (matchedPatterns >= 2) {
      score = 70
    } else if (matchedPatterns >= 1) {
      score = 50
    } else {
      score = 20
      issues.push('一次情報や実体験に基づく内容が不足')
      suggestions.push('実際の体験談や検証結果を追加してください')
    }

    // 画像が多い場合はボーナス
    if (content.images.total > 3) {
      score = Math.min(100, score + 10)
    }

    return {
      criteriaId: 'experience',
      score,
      maxScore: 100,
      status: this.getStatus(score),
      issues,
      suggestions
    }
  }

  /**
   * 専門性（Expertise）の証明
   */
  private static evaluateExpertise(content: ContentAnalysis, html: string): EvaluationResult {
    let score = 0
    const issues: string[] = []
    const suggestions: string[] = []

    // 専門性を示すパターン
    const expertisePatterns = [
      /著者|執筆者|監修者|編集者/,
      /資格|認定|ライセンス|専門家/,
      /博士|修士|学位|PhD|Dr\./,
      /年の経験|専門分野|プロフィール/,
      /所属|勤務|研究/
    ]

    let matchedPatterns = 0
    expertisePatterns.forEach(pattern => {
      if (pattern.test(html)) {
        matchedPatterns++
      }
    })

    if (matchedPatterns >= 3) {
      score = 85
    } else if (matchedPatterns >= 2) {
      score = 65
    } else if (matchedPatterns >= 1) {
      score = 45
    } else {
      score = 15
      issues.push('著者の専門性が明示されていません')
      suggestions.push('著者の資格や経歴を明記してください')
    }

    return {
      criteriaId: 'expertise',
      score,
      maxScore: 100,
      status: this.getStatus(score),
      issues,
      suggestions
    }
  }

  /**
   * 権威性（Authoritativeness）の構築
   */
  private static evaluateAuthoritativeness(content: ContentAnalysis, signals: TechnicalSignals): EvaluationResult {
    let score = 0
    const issues: string[] = []
    const suggestions: string[] = []

    // 外部リンクがある場合はプラス
    if (content.externalLinks > 0) {
      score += 30
    } else {
      issues.push('権威あるサイトへの外部リンクがありません')
      suggestions.push('信頼できる情報源へのリンクを追加してください')
    }

    // 内部リンクが充実している場合
    if (content.internalLinks > 5) {
      score += 25
    }

    // 構造化データがある場合
    if (signals.hasStructuredData) {
      score += 25
    }

    // 基本スコア
    score += 20

    return {
      criteriaId: 'authoritativeness',
      score: Math.min(100, score),
      maxScore: 100,
      status: this.getStatus(Math.min(100, score)),
      issues,
      suggestions
    }
  }

  /**
   * 信頼性（Trustworthiness）の確保
   */
  private static evaluateTrustworthiness(metadata: MetaData, signals: TechnicalSignals): EvaluationResult {
    let score = 0
    const issues: string[] = []
    const suggestions: string[] = []

    // HTTPS使用
    if (signals.isHttps) {
      score += 30
    } else {
      issues.push('HTTPSが使用されていません')
      suggestions.push('セキュリティのためHTTPSに移行してください')
    }

    // メタデータの充実度
    if (metadata.title && metadata.description) {
      score += 25
    }

    // 連絡先情報
    if (metadata.author) {
      score += 20
    }

    // Canonicalタグ
    if (metadata.canonical) {
      score += 15
    }

    // 基本スコア
    score += 10

    return {
      criteriaId: 'trustworthiness',
      score: Math.min(100, score),
      maxScore: 100,
      status: this.getStatus(Math.min(100, score)),
      issues,
      suggestions
    }
  }

  /**
   * ナレッジグラフでの存在感
   */
  private static evaluateKnowledgeGraph(html: string): EvaluationResult {
    let score = 30 // 基本スコア
    const issues: string[] = []
    const suggestions: string[] = []

    // 構造化データの確認
    const hasStructuredData = html.includes('application/ld+json') || 
                             html.includes('itemscope')

    if (hasStructuredData) {
      score += 40
    } else {
      issues.push('構造化データが設定されていません')
      suggestions.push('JSON-LDまたはmicrodataを実装してください')
    }

    // エンティティ関連の情報
    const entityPatterns = [
      /会社概要|企業情報|組織情報/,
      /設立|創業|所在地|代表者/
    ]

    let hasEntityInfo = false
    entityPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        hasEntityInfo = true
      }
    })

    if (hasEntityInfo) {
      score += 30
    } else {
      issues.push('エンティティ情報が不足しています')
      suggestions.push('会社概要や組織情報を充実させてください')
    }

    return {
      criteriaId: 'knowledge-graph',
      score: Math.min(100, score),
      maxScore: 100,
      status: this.getStatus(Math.min(100, score)),
      issues,
      suggestions
    }
  }

  /**
   * NAP情報の一貫性
   */
  private static evaluateNAPConsistency(content: ContentAnalysis): EvaluationResult {
    let score = 20 // 基本スコア
    const issues: string[] = []
    const suggestions: string[] = []

    // 連絡先情報の存在
    if (content.hasContactInfo) {
      score += 40
    } else {
      issues.push('連絡先情報が見つかりません')
      suggestions.push('電話番号やメールアドレスを明記してください')
    }

    // 住所情報の存在
    if (content.hasAddressInfo) {
      score += 40
    } else {
      issues.push('住所情報が見つかりません')
      suggestions.push('所在地を明記してください')
    }

    return {
      criteriaId: 'nap-consistency',
      score: Math.min(100, score),
      maxScore: 100,
      status: this.getStatus(Math.min(100, score)),
      issues,
      suggestions
    }
  }

  /**
   * リスト・表形式の活用
   */
  private static evaluateListUsage(content: ContentAnalysis): EvaluationResult {
    let score = 0
    const issues: string[] = []
    const suggestions: string[] = []

    const totalListsAndTables = content.listsCount + content.tablesCount

    if (totalListsAndTables >= 3) {
      score = 90
    } else if (totalListsAndTables >= 2) {
      score = 70
    } else if (totalListsAndTables >= 1) {
      score = 50
    } else {
      score = 20
      issues.push('リストや表が使用されていません')
      suggestions.push('情報を整理してリストや表で表示してください')
    }

    return {
      criteriaId: 'list-usage',
      score,
      maxScore: 100,
      status: this.getStatus(score),
      issues,
      suggestions
    }
  }

  // 他の評価メソッドも同様に実装...
  // 簡略化のため、いくつかの基本的な評価メソッドを実装

  /**
   * 要約・定義文の提示
   */
  private static evaluateDefinitionSummary(content: ContentAnalysis): EvaluationResult {
    let score = 50 // 基本スコア
    const issues: string[] = []
    const suggestions: string[] = []

    // 文字数が適切かチェック
    if (content.wordCount >= 500) {
      score += 30
    } else {
      issues.push('コンテンツの文字数が不足しています')
    }

    // 見出し構造があるかチェック
    if (content.headingStructure.h2 > 0) {
      score += 20
    }

    return {
      criteriaId: 'definition-summary',
      score: Math.min(100, score),
      maxScore: 100,
      status: this.getStatus(Math.min(100, score)),
      issues,
      suggestions
    }
  }

  // その他の評価メソッドのスタブ実装
  private static evaluateQuestionAnswerFormat(html: string): EvaluationResult {
    return this.createBasicEvaluation('qa-format', 60, [], [])
  }

  private static evaluateSemanticHTML(html: string): EvaluationResult {
    return this.createBasicEvaluation('semantic-html', 70, [], [])
  }

  private static evaluateInformationAccuracy(metadata: MetaData, html: string): EvaluationResult {
    return this.createBasicEvaluation('info-accuracy', 65, [], [])
  }

  private static evaluateLogicalHeadingStructure(content: ContentAnalysis): EvaluationResult {
    let score = 50
    if (content.headingStructure.h1 === 1) score += 25
    if (content.headingStructure.h2 > 0) score += 25
    return this.createBasicEvaluation('heading-structure', score, [], [])
  }

  private static evaluateLogicalStructure(content: ContentAnalysis): EvaluationResult {
    return this.createBasicEvaluation('logical-structure', 70, [], [])
  }

  private static evaluateContentClarity(content: ContentAnalysis): EvaluationResult {
    return this.createBasicEvaluation('content-clarity', 65, [], [])
  }

  private static evaluatePageExperience(signals: TechnicalSignals): EvaluationResult {
    let score = 40
    if (signals.loadTime < 3000) score += 30
    if (signals.hasViewport) score += 30
    return this.createBasicEvaluation('page-experience', score, [], [])
  }

  private static evaluateCrawlability(signals: TechnicalSignals): EvaluationResult {
    let score = 30
    if (signals.hasRobotsTxt) score += 35
    if (signals.hasSitemap) score += 35
    return this.createBasicEvaluation('crawlability', score, [], [])
  }

  private static evaluateStructuredData(signals: TechnicalSignals): EvaluationResult {
    const score = signals.hasStructuredData ? 90 : 20
    return this.createBasicEvaluation('structured-data', score, [], [])
  }

  private static evaluateLlmsTxtPresence(signals: TechnicalSignals): EvaluationResult {
    return this.createBasicEvaluation('llms-txt', 50, [], [])
  }

  /**
   * 基本的な評価結果を作成
   */
  private static createBasicEvaluation(
    criteriaId: string,
    score: number,
    issues: string[],
    suggestions: string[]
  ): EvaluationResult {
    return {
      criteriaId,
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      status: this.getStatus(score),
      issues,
      suggestions
    }
  }

  /**
   * スコアからステータスを判定
   */
  private static getStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'fair'
    return 'poor'
  }
}