import { supabaseAdmin } from '../supabase/client'
import { AnalysisResult, EvaluationResult, GeminiAnalysisResponse } from '../../src/types/analysis'
import { Database } from '../../src/types/supabase'

type Tables = Database['public']['Tables']
type DiagnosisRow = Tables['diagnoses']['Row']
type EvaluationRow = Tables['evaluations']['Row']
type ImprovementRow = Tables['improvements']['Row']
type ProgressRow = Tables['diagnosis_progress']['Row']

/**
 * 診断結果の生成・保存サービス
 */
export class DiagnosisService {
  
  /**
   * 診断結果をデータベースに保存
   */
  async saveDiagnosis(analysisResult: AnalysisResult): Promise<string> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client が初期化されていません')
    }

    try {
      // 1. メイン診断レコードを作成
      const diagnosisData: Omit<DiagnosisRow, 'id' | 'created_at' | 'updated_at'> = {
        url: analysisResult.url,
        title: analysisResult.metadata.title || null,
        description: analysisResult.metadata.description || null,
        overall_score: analysisResult.overallScore,
        category: analysisResult.category,
        diagnosis_date: analysisResult.timestamp.toISOString(),
        metadata: analysisResult.metadata as any, // JSON型
        technical_signals: analysisResult.technicalSignals as any, // JSON型
        content_analysis: analysisResult.contentAnalysis as any, // JSON型
        gemini_analysis: analysisResult.geminiAnalysis as any || null, // JSON型
        status: 'completed'
      }

      const { data: diagnosis, error: diagnosisError } = await supabaseAdmin
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single()

      if (diagnosisError) {
        throw new Error(`診断レコード保存エラー: ${diagnosisError.message}`)
      }

      // 2. 評価結果を保存
      await this.saveEvaluations(diagnosis.id, analysisResult.evaluations)

      // 3. 改善提案を保存（Gemini分析結果がある場合）
      if (analysisResult.geminiAnalysis) {
        await this.saveImprovements(diagnosis.id, analysisResult.geminiAnalysis)
      }

      console.log(`✅ 診断結果を保存しました: ${diagnosis.id}`)
      return diagnosis.id

    } catch (error) {
      console.error('診断結果保存エラー:', error)
      throw error
    }
  }

  /**
   * 評価結果を保存
   */
  private async saveEvaluations(diagnosisId: string, evaluations: EvaluationResult[]): Promise<void> {
    if (!supabaseAdmin) return

    const evaluationData: Omit<EvaluationRow, 'id' | 'created_at'>[] = evaluations.map(evaluation => ({
      diagnosis_id: diagnosisId,
      criteria_id: evaluation.criteriaId,
      score: evaluation.score,
      max_score: evaluation.maxScore,
      status: evaluation.status,
      issues: evaluation.issues,
      suggestions: evaluation.suggestions
    }))

    const { error } = await supabaseAdmin
      .from('evaluations')
      .insert(evaluationData)

    if (error) {
      throw new Error(`評価結果保存エラー: ${error.message}`)
    }
  }

  /**
   * 改善提案を保存
   */
  private async saveImprovements(diagnosisId: string, geminiAnalysis: GeminiAnalysisResponse): Promise<void> {
    if (!supabaseAdmin) return

    const improvementData: Omit<ImprovementRow, 'id' | 'created_at'>[] = geminiAnalysis.improvements.map((improvement, index) => ({
      diagnosis_id: diagnosisId,
      category: improvement.category,
      title: improvement.title,
      description: improvement.description,
      implementation: improvement.implementation,
      expected_impact: improvement.expectedImpact,
      priority: improvement.priority,
      effort: improvement.effort,
      display_order: index + 1
    }))

    const { error } = await supabaseAdmin
      .from('improvements')
      .insert(improvementData)

    if (error) {
      throw new Error(`改善提案保存エラー: ${error.message}`)
    }
  }

  /**
   * 診断結果を取得
   */
  async getDiagnosis(diagnosisId: string): Promise<AnalysisResult | null> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client が初期化されていません')
    }

    try {
      // メイン診断データを取得
      const { data: diagnosis, error: diagnosisError } = await supabaseAdmin
        .from('diagnoses')
        .select('*')
        .eq('id', diagnosisId)
        .single()

      if (diagnosisError || !diagnosis) {
        return null
      }

      // 評価結果を取得
      const { data: evaluations, error: evaluationsError } = await supabaseAdmin
        .from('evaluations')
        .select('*')
        .eq('diagnosis_id', diagnosisId)
        .order('criteria_id')

      if (evaluationsError) {
        throw new Error(`評価結果取得エラー: ${evaluationsError.message}`)
      }

      // 改善提案を取得
      const { data: improvements, error: improvementsError } = await supabaseAdmin
        .from('improvements')
        .select('*')
        .eq('diagnosis_id', diagnosisId)
        .order('display_order')

      if (improvementsError) {
        throw new Error(`改善提案取得エラー: ${improvementsError.message}`)
      }

      // AnalysisResult形式に変換
      return this.convertToAnalysisResult(diagnosis, evaluations || [], improvements || [])

    } catch (error) {
      console.error('診断結果取得エラー:', error)
      throw error
    }
  }

  /**
   * URLによる診断履歴を取得
   */
  async getDiagnosisByUrl(url: string, limit: number = 10): Promise<DiagnosisRow[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client が初期化されていません')
    }

    const { data, error } = await supabaseAdmin
      .from('diagnoses')
      .select('*')
      .eq('url', url)
      .order('diagnosis_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`診断履歴取得エラー: ${error.message}`)
    }

    return data || []
  }

  /**
   * 最新の診断結果を取得（キャッシュ機能）
   */
  async getLatestDiagnosis(url: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<AnalysisResult | null> {
    if (!supabaseAdmin) return null

    const cutoffTime = new Date(Date.now() - maxAge).toISOString()

    const { data: diagnosis, error } = await supabaseAdmin
      .from('diagnoses')
      .select('*')
      .eq('url', url)
      .eq('status', 'completed')
      .gte('diagnosis_date', cutoffTime)
      .order('diagnosis_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !diagnosis) {
      return null
    }

    console.log(`📋 キャッシュされた診断結果を使用: ${diagnosis.id}`)
    return this.getDiagnosis(diagnosis.id)
  }

  /**
   * 進捗追跡レコードを作成
   */
  async createProgressTracker(url: string, estimatedDuration: number = 180000): Promise<string> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client が初期化されていません')
    }

    const progressData: Omit<ProgressRow, 'id' | 'created_at' | 'updated_at'> = {
      url,
      status: 'initializing',
      current_step: 'URL検証',
      progress_percentage: 0,
      estimated_completion: new Date(Date.now() + estimatedDuration).toISOString(),
      steps_completed: [],
      error_message: null
    }

    const { data, error } = await supabaseAdmin
      .from('diagnosis_progress')
      .insert(progressData)
      .select('id')
      .single()

    if (error) {
      throw new Error(`進捗追跡作成エラー: ${error.message}`)
    }

    return data.id
  }

  /**
   * 進捗を更新
   */
  async updateProgress(
    progressId: string, 
    status: string, 
    currentStep: string, 
    percentage: number,
    completedSteps?: string[],
    errorMessage?: string
  ): Promise<void> {
    if (!supabaseAdmin) return

    const updateData: Partial<ProgressRow> = {
      status,
      current_step: currentStep,
      progress_percentage: percentage,
      updated_at: new Date().toISOString()
    }

    if (completedSteps) {
      updateData.steps_completed = completedSteps
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabaseAdmin
      .from('diagnosis_progress')
      .update(updateData)
      .eq('id', progressId)

    if (error) {
      console.warn('進捗更新エラー:', error.message)
    }
  }

  /**
   * データベース形式からAnalysisResult形式に変換
   */
  private convertToAnalysisResult(
    diagnosis: DiagnosisRow,
    evaluations: EvaluationRow[],
    improvements: ImprovementRow[]
  ): AnalysisResult {
    const evaluationResults: EvaluationResult[] = evaluations.map(evaluation => ({
      criteriaId: evaluation.criteria_id,
      score: evaluation.score,
      maxScore: evaluation.max_score,
      status: evaluation.status as 'excellent' | 'good' | 'fair' | 'poor',
      issues: evaluation.issues || [],
      suggestions: evaluation.suggestions || []
    }))

    let geminiAnalysis: GeminiAnalysisResponse | undefined
    if (diagnosis.gemini_analysis) {
      geminiAnalysis = {
        ...diagnosis.gemini_analysis as any,
        improvements: improvements.map(imp => ({
          category: imp.category as 'critical' | 'important' | 'moderate' | 'low',
          title: imp.title,
          description: imp.description,
          implementation: imp.implementation,
          expectedImpact: imp.expected_impact,
          priority: imp.priority,
          effort: imp.effort as 'low' | 'medium' | 'high'
        }))
      }
    }

    return {
      url: diagnosis.url,
      timestamp: new Date(diagnosis.diagnosis_date),
      metadata: diagnosis.metadata as any,
      technicalSignals: diagnosis.technical_signals as any,
      contentAnalysis: diagnosis.content_analysis as any,
      evaluations: evaluationResults,
      overallScore: diagnosis.overall_score,
      category: diagnosis.category as 'A' | 'B' | 'C' | 'D' | 'F',
      geminiAnalysis
    }
  }

  /**
   * 統計情報を取得
   */
  async getStatistics(days: number = 30): Promise<{
    totalDiagnoses: number
    averageScore: number
    categoryDistribution: Record<string, number>
    topIssues: Array<{ issue: string; count: number }>
  }> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client が初期化されていません')
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // 基本統計
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('diagnoses')
      .select('overall_score, category')
      .gte('diagnosis_date', cutoffDate)
      .eq('status', 'completed')

    if (statsError) {
      throw new Error(`統計取得エラー: ${statsError.message}`)
    }

    const totalDiagnoses = stats?.length || 0
    const averageScore = totalDiagnoses > 0 
      ? stats!.reduce((sum, item) => sum + item.overall_score, 0) / totalDiagnoses 
      : 0

    const categoryDistribution = stats?.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalDiagnoses,
      averageScore: Math.round(averageScore * 100) / 100,
      categoryDistribution,
      topIssues: [] // 実装は簡略化
    }
  }
}