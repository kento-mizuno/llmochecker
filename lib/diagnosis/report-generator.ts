import { AnalysisResult, EvaluationResult, GeminiAnalysisResponse } from '../../src/types/analysis'

/**
 * 診断結果レポート生成
 */
export class ReportGenerator {

  /**
   * HTMLレポートを生成
   */
  static generateHtmlReport(result: AnalysisResult): string {
    const categoryScores = this.getCategoryScores(result)
    const improvements = this.getTopImprovements(result, 10)
    const timestamp = result.timestamp.toLocaleString('ja-JP')

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLMO診断レポート - ${result.url}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .score { 
            font-size: 3em; 
            font-weight: bold; 
            color: ${this.getScoreColor(result.overallScore)}; 
        }
        .category { 
            font-size: 2em; 
            padding: 10px 20px; 
            background: ${this.getCategoryColor(result.category)}; 
            color: white; 
            border-radius: 30px; 
            display: inline-block; 
            margin-top: 10px; 
        }
        .section { 
            margin: 30px 0; 
            padding: 20px; 
            background: #f8fafc; 
            border-radius: 6px; 
        }
        .section h2 { 
            color: #1e293b; 
            border-left: 4px solid #4f46e5; 
            padding-left: 15px; 
        }
        .score-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
        }
        .score-card { 
            background: white; 
            padding: 20px; 
            border-radius: 6px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        .score-card h3 { 
            margin: 0 0 10px 0; 
            color: #374151; 
        }
        .score-bar { 
            background: #e5e7eb; 
            height: 8px; 
            border-radius: 4px; 
            overflow: hidden; 
        }
        .score-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e); 
            transition: width 0.3s ease; 
        }
        .improvement-list { 
            list-style: none; 
            padding: 0; 
        }
        .improvement-item { 
            background: white; 
            margin: 15px 0; 
            padding: 20px; 
            border-radius: 6px; 
            border-left: 4px solid #4f46e5; 
        }
        .improvement-priority { 
            color: white; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 0.8em; 
            font-weight: bold; 
        }
        .critical { background: #ef4444; }
        .important { background: #f97316; }
        .moderate { background: #eab308; }
        .low { background: #6b7280; }
        .technical-info { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 15px; 
        }
        .tech-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 15px; 
            background: white; 
            border-radius: 4px; 
        }
        .footer { 
            text-align: center; 
            color: #6b7280; 
            font-size: 0.9em; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 LLMO診断レポート</h1>
            <div class="score">${result.overallScore}</div>
            <div class="category">グレード ${result.category}</div>
            <p><strong>URL:</strong> ${result.url}</p>
            <p><strong>診断日時:</strong> ${timestamp}</p>
        </div>

        <div class="section">
            <h2>📊 カテゴリ別スコア</h2>
            <div class="score-grid">
                ${Object.entries(categoryScores).map(([category, score]) => `
                    <div class="score-card">
                        <h3>${category}</h3>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${score}%"></div>
                        </div>
                        <p>${score.toFixed(1)}点</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🔧 主な改善提案</h2>
            <ul class="improvement-list">
                ${improvements.map(improvement => `
                    <li class="improvement-item">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <h3 style="margin: 0;">${improvement.title}</h3>
                            <span class="improvement-priority ${improvement.category}">${improvement.category}</span>
                        </div>
                        <p><strong>問題:</strong> ${improvement.description}</p>
                        <p><strong>解決方法:</strong> ${improvement.implementation}</p>
                        <p><strong>期待効果:</strong> ${improvement.expectedImpact}</p>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>⚙️ 技術的情報</h2>
            <div class="technical-info">
                <div class="tech-item">
                    <span>HTTPS</span>
                    <span>${result.technicalSignals.isHttps ? '✅' : '❌'}</span>
                </div>
                <div class="tech-item">
                    <span>読み込み時間</span>
                    <span>${result.technicalSignals.loadTime}ms</span>
                </div>
                <div class="tech-item">
                    <span>ページサイズ</span>
                    <span>${Math.round(result.technicalSignals.pageSize / 1024)}KB</span>
                </div>
                <div class="tech-item">
                    <span>robots.txt</span>
                    <span>${result.technicalSignals.hasRobotsTxt ? '✅' : '❌'}</span>
                </div>
                <div class="tech-item">
                    <span>サイトマップ</span>
                    <span>${result.technicalSignals.hasSitemap ? '✅' : '❌'}</span>
                </div>
                <div class="tech-item">
                    <span>構造化データ</span>
                    <span>${result.technicalSignals.hasStructuredData ? '✅' : '❌'}</span>
                </div>
            </div>
        </div>

        ${result.geminiAnalysis ? `
        <div class="section">
            <h2>🤖 AI分析結果</h2>
            <div class="score-grid">
                <div class="score-card">
                    <h3>Experience（経験）</h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.geminiAnalysis.eeAtAnalysis.experience.score}%"></div>
                    </div>
                    <p>${result.geminiAnalysis.eeAtAnalysis.experience.score}点</p>
                </div>
                <div class="score-card">
                    <h3>Expertise（専門性）</h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.geminiAnalysis.eeAtAnalysis.expertise.score}%"></div>
                    </div>
                    <p>${result.geminiAnalysis.eeAtAnalysis.expertise.score}点</p>
                </div>
                <div class="score-card">
                    <h3>Authoritativeness（権威性）</h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.geminiAnalysis.eeAtAnalysis.authoritativeness.score}%"></div>
                    </div>
                    <p>${result.geminiAnalysis.eeAtAnalysis.authoritativeness.score}点</p>
                </div>
                <div class="score-card">
                    <h3>Trustworthiness（信頼性）</h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.geminiAnalysis.eeAtAnalysis.trustworthiness.score}%"></div>
                    </div>
                    <p>${result.geminiAnalysis.eeAtAnalysis.trustworthiness.score}点</p>
                </div>
            </div>
            <p><strong>総合評価:</strong> ${result.geminiAnalysis.eeAtAnalysis.overall.assessment}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>このレポートは <a href="https://dailyup.co.jp/llmochecker">LLMO無料診断</a> によって生成されました</p>
            <p>AI検索における可視性向上のための分析結果です</p>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * JSON形式のレポート生成
   */
  static generateJsonReport(result: AnalysisResult): string {
    const report = {
      summary: {
        url: result.url,
        timestamp: result.timestamp,
        overallScore: result.overallScore,
        category: result.category
      },
      categoryScores: this.getCategoryScores(result),
      evaluations: result.evaluations.map(evaluation => ({
        criteriaId: evaluation.criteriaId,
        score: evaluation.score,
        status: evaluation.status,
        issues: evaluation.issues,
        suggestions: evaluation.suggestions
      })),
      technicalSignals: {
        https: result.technicalSignals.isHttps,
        loadTime: result.technicalSignals.loadTime,
        pageSize: result.technicalSignals.pageSize,
        robotsTxt: result.technicalSignals.hasRobotsTxt,
        sitemap: result.technicalSignals.hasSitemap,
        structuredData: result.technicalSignals.hasStructuredData
      },
      improvements: this.getTopImprovements(result, 20),
      geminiAnalysis: result.geminiAnalysis ? {
        eeat: result.geminiAnalysis.eeAtAnalysis,
        contentQuality: result.geminiAnalysis.contentQualityAnalysis,
        confidence: result.geminiAnalysis.confidence
      } : null
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * カテゴリ別スコア計算
   */
  private static getCategoryScores(result: AnalysisResult): Record<string, number> {
    const categoryMap: Record<string, string[]> = {
      'E-E-A-T': ['experience', 'expertise', 'authoritativeness', 'trustworthiness'],
      'エンティティ': ['knowledge-graph', 'nap-consistency'],
      'AI親和性': ['list-usage', 'definition-summary', 'qa-format', 'semantic-html'],
      '品質': ['info-accuracy', 'heading-structure', 'logical-structure', 'content-clarity'],
      '技術的要因': ['page-experience', 'crawlability', 'structured-data', 'llms-txt']
    }

    const scores: Record<string, number> = {}

    Object.entries(categoryMap).forEach(([category, criteriaIds]) => {
      const categoryEvaluations = result.evaluations.filter(evaluation => 
        criteriaIds.includes(evaluation.criteriaId)
      )
      
      if (categoryEvaluations.length > 0) {
        scores[category] = categoryEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / categoryEvaluations.length
      }
    })

    return scores
  }

  /**
   * 上位改善提案を取得
   */
  private static getTopImprovements(result: AnalysisResult, limit: number): Array<{
    title: string
    description: string
    implementation: string
    expectedImpact: string
    category: string
  }> {
    // 基本評価からの改善提案
    const basicImprovements = result.evaluations
      .filter(evaluation => evaluation.status === 'poor' || evaluation.status === 'fair')
      .flatMap(evaluation => evaluation.suggestions.map(suggestion => ({
        title: `${evaluation.criteriaId} の改善`,
        description: evaluation.issues.join(', ') || '改善が必要です',
        implementation: suggestion,
        expectedImpact: 'スコア向上が期待されます',
        category: evaluation.status === 'poor' ? 'critical' : 'important'
      })))

    // Gemini分析からの改善提案
    const geminiImprovements = result.geminiAnalysis?.improvements.map(improvement => ({
      title: improvement.title,
      description: improvement.description,
      implementation: improvement.implementation,
      expectedImpact: improvement.expectedImpact,
      category: improvement.category
    })) || []

    // 統合して優先順位順にソート
    const allImprovements = [...geminiImprovements, ...basicImprovements]
    const priorityOrder = { critical: 1, important: 2, moderate: 3, low: 4 }
    
    return allImprovements
      .sort((a, b) => (priorityOrder[a.category as keyof typeof priorityOrder] || 5) - 
                     (priorityOrder[b.category as keyof typeof priorityOrder] || 5))
      .slice(0, limit)
  }

  /**
   * スコア色を取得
   */
  private static getScoreColor(score: number): string {
    if (score >= 90) return '#22c55e' // green
    if (score >= 80) return '#3b82f6' // blue
    if (score >= 70) return '#eab308' // yellow
    if (score >= 60) return '#f97316' // orange
    return '#ef4444' // red
  }

  /**
   * カテゴリ色を取得
   */
  private static getCategoryColor(category: string): string {
    const colors = {
      'A': '#22c55e',
      'B': '#3b82f6',
      'C': '#eab308',
      'D': '#f97316',
      'F': '#ef4444'
    }
    return colors[category as keyof typeof colors] || '#6b7280'
  }
}