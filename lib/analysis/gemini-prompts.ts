import { PromptTemplate } from '@/types/analysis'

/**
 * Gemini AI分析用のプロンプトテンプレート
 */
export class GeminiPrompts {
  
  /**
   * E-E-A-T分析用プロンプト
   */
  static getEEATAnalysisPrompt(): PromptTemplate {
    return {
      system: `あなたはSEO専門家・コンテンツ品質評価のエキスパートです。
GoogleのE-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）ガイドラインに基づいて、
Webページのコンテンツを詳細に分析し、LLMベースの検索エンジンでの可視性向上のための評価を行ってください。

# 評価基準

## Experience（経験）
- 一次情報・実体験の有無
- 実際の検証・テスト結果
- 個人的な体験談の含有
- 写真・動画などの証拠

## Expertise（専門性）  
- 著者の専門資格・経歴
- 業界での経験年数
- 専門用語の適切な使用
- 技術的な深い理解

## Authoritativeness（権威性）
- 外部からの言及・被リンク
- 業界での認知度
- 権威あるサイトからの引用
- 第三者による評価

## Trustworthiness（信頼性）
- 情報の正確性・最新性
- 引用元の明示
- 連絡先・運営者情報
- プライバシーポリシー
- HTTPS使用

# 出力形式
JSON形式で以下の構造で回答してください：

{
  "experience": {
    "score": 0-100,
    "evidence": ["根拠1", "根拠2"],
    "issues": ["問題点1", "問題点2"]
  },
  "expertise": {
    "score": 0-100,
    "evidence": ["根拠1", "根拠2"],
    "issues": ["問題点1", "問題点2"]
  },
  "authoritativeness": {
    "score": 0-100,
    "evidence": ["根拠1", "根拠2"],
    "issues": ["問題点1", "問題点2"]
  },
  "trustworthiness": {
    "score": 0-100,
    "evidence": ["根拠1", "根拠2"],
    "issues": ["問題点1", "問題点2"]
  },
  "overall": {
    "score": 0-100,
    "assessment": "総合的な評価コメント"
  }
}`,
      
      user: `以下のWebページをE-E-A-Tの観点から分析してください：

URL: {url}
タイトル: {title}
メタ説明: {description}

# ページの基本情報
- 総文字数: {wordCount}
- 見出し構造: {headingStructure}
- 画像数: {imageCount}
- 外部リンク数: {externalLinks}
- 内部リンク数: {internalLinks}

# 技術的情報
- HTTPS: {isHttps}
- 構造化データ: {hasStructuredData}
- 読み込み時間: {loadTime}ms

# ページコンテンツ
{content}

上記の情報をもとに、E-E-A-Tの4つの要素について詳細に分析し、各要素のスコア（0-100）と具体的な根拠、改善すべき問題点を指摘してください。`
    }
  }

  /**
   * コンテンツ品質分析用プロンプト
   */
  static getContentQualityPrompt(): PromptTemplate {
    return {
      system: `あなたはコンテンツ品質評価とAI検索最適化の専門家です。
LLMベースの検索エンジン（ChatGPT、Claude、Geminiなど）での可視性向上を目的として、
Webページのコンテンツ品質を以下の5つの観点から詳細に分析してください。

# 評価観点

## 1. Clarity（明確性）
- 文章の読みやすさ
- 論理的な構成
- 専門用語の説明
- 結論の明確さ

## 2. Completeness（完全性）
- トピックの網羅性
- 必要な情報の充足
- 段階的な説明
- 関連情報の提供

## 3. Accuracy（正確性）
- 事実の正確性
- 最新性
- 引用元の信頼性
- 検証可能性

## 4. Uniqueness（独自性）
- オリジナルな視点
- 独自の分析・洞察
- 他サイトとの差別化
- 付加価値の提供

## 5. User Intent（ユーザー意図への適合）
- 検索意図との一致
- 問題解決の度合い
- 行動喚起の適切性
- ユーザー体験の質

# 出力形式
JSON形式で回答してください。`,
      
      user: `以下のWebページのコンテンツ品質を分析してください：

URL: {url}
タイトル: {title}

# コンテンツ詳細
{content}

# 基本統計
- 文字数: {wordCount}
- 段落数: 推定{paragraphCount}
- リスト数: {listsCount}
- 表数: {tablesCount}

上記をもとに、以下のJSON形式で詳細な品質分析を行ってください：

{
  "clarity": {
    "score": 0-100,
    "assessment": "明確性の評価コメント",
    "issues": ["改善点1", "改善点2"]
  },
  "completeness": {
    "score": 0-100,
    "assessment": "完全性の評価コメント",
    "missingElements": ["不足要素1", "不足要素2"]
  },
  "accuracy": {
    "score": 0-100,
    "assessment": "正確性の評価コメント",
    "concerns": ["懸念点1", "懸念点2"]
  },
  "uniqueness": {
    "score": 0-100,
    "assessment": "独自性の評価コメント",
    "duplicateRisk": ["重複リスク1", "重複リスク2"]
  },
  "userIntent": {
    "score": 0-100,
    "matchedIntents": ["適合する検索意図1", "適合する検索意図2"],
    "unmatchedNeeds": ["未対応のニーズ1", "未対応のニーズ2"]
  }
}`
    }
  }

  /**
   * 改善提案生成用プロンプト
   */
  static getImprovementSuggestionsPrompt(): PromptTemplate {
    return {
      system: `あなたはLLMO（Large Language Model Optimization）の専門家です。
AI検索における可視性向上のための具体的で実践的な改善提案を生成してください。

# 改善提案の原則
1. 具体的で実装しやすい内容
2. 優先順位と期待効果を明確化
3. 工数と難易度を考慮
4. LLM特有の評価ポイントに着目

# カテゴリ分類
- critical: 必須（SEO・UX・信頼性に大きく影響）
- important: 重要（改善効果が高い）
- moderate: 中程度（付加価値向上）
- low: 低優先度（微調整・最適化）

# 出力形式
改善提案の配列をJSON形式で出力してください。`,
      
      user: `以下の分析結果をもとに、LLMOの改善提案を生成してください：

URL: {url}
現在の総合スコア: {overallScore}/100

# E-E-A-T分析結果
{eeAtAnalysis}

# コンテンツ品質分析結果
{contentQualityAnalysis}

# 技術的問題点
{technicalIssues}

上記をもとに、優先度の高い順に改善提案を作成してください：

[
  {
    "category": "critical|important|moderate|low",
    "title": "改善提案のタイトル",
    "description": "問題の詳細説明",
    "implementation": "具体的な実装方法",
    "expectedImpact": "期待される効果",
    "priority": 1-10,
    "effort": "low|medium|high"
  }
]`
    }
  }

  /**
   * プロンプトのプレースホルダーを置換
   */
  static replacePlaceholders(template: string, data: Record<string, any>): string {
    let result = template
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      result = result.replace(new RegExp(placeholder, 'g'), replacement)
    })
    
    return result
  }
}