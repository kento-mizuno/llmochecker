import { AnalysisEngine } from '../analysis/analysis-engine'
import { DiagnosisService } from './diagnosis-service'
import { ReportGenerator } from './report-generator'
import { AnalysisResult, CrawlOptions } from '../../src/types/analysis'

/**
 * 統合診断サービス
 * 分析→保存→レポート生成の全フローを管理
 */
export class IntegratedDiagnosis {
  private analysisEngine: AnalysisEngine
  private diagnosisService: DiagnosisService

  constructor(geminiApiKey?: string) {
    this.analysisEngine = new AnalysisEngine(geminiApiKey)
    this.diagnosisService = new DiagnosisService()
  }

  /**
   * 完全診断フローを実行
   */
  async executeDiagnosis(
    url: string, 
    options: Partial<CrawlOptions> = {},
    useCache: boolean = true
  ): Promise<DiagnosisResult> {
    let progressId: string | null = null

    try {
      // 1. 進捗追跡開始
      progressId = await this.diagnosisService.createProgressTracker(url)
      await this.updateProgress(progressId, 'analyzing', 'URL検証', 5)

      // 2. キャッシュチェック（24時間以内）
      if (useCache) {
        console.log('🔍 キャッシュをチェック中...')
        const cachedResult = await this.diagnosisService.getLatestDiagnosis(url)
        if (cachedResult) {
          await this.updateProgress(progressId, 'completed', '完了（キャッシュ使用）', 100)
          return {
            diagnosisId: 'cached',
            result: cachedResult,
            fromCache: true,
            reports: {
              html: ReportGenerator.generateHtmlReport(cachedResult),
              json: ReportGenerator.generateJsonReport(cachedResult)
            }
          }
        }
      }

      // 3. URL分析・評価実行
      await this.updateProgress(progressId, 'analyzing', 'Webクローリング', 20)
      console.log('🕷️  新規診断を開始...')
      
      const analysisResult = await this.analysisEngine.analyzeUrl(url, options)
      
      await this.updateProgress(progressId, 'processing', '分析結果処理中', 80)

      // 4. 診断結果をデータベース保存
      console.log('💾 診断結果を保存中...')
      const diagnosisId = await this.diagnosisService.saveDiagnosis(analysisResult)

      // 5. レポート生成
      console.log('📄 レポートを生成中...')
      const reports = {
        html: ReportGenerator.generateHtmlReport(analysisResult),
        json: ReportGenerator.generateJsonReport(analysisResult)
      }

      // 6. 進捗完了
      await this.updateProgress(progressId, 'completed', '診断完了', 100)

      console.log('✅ 統合診断が完了しました')
      
      return {
        diagnosisId,
        result: analysisResult,
        fromCache: false,
        reports
      }

    } catch (error) {
      // エラー時の進捗更新
      if (progressId) {
        await this.updateProgress(
          progressId, 
          'error', 
          'エラー発生', 
          0, 
          undefined,
          error instanceof Error ? error.message : String(error)
        )
      }
      
      console.error('❌ 統合診断エラー:', error)
      throw error
    } finally {
      // リソースクリーンアップ
      await this.analysisEngine.dispose()
    }
  }

  /**
   * 診断結果を取得
   */
  async getDiagnosis(diagnosisId: string): Promise<DiagnosisResult | null> {
    const result = await this.diagnosisService.getDiagnosis(diagnosisId)
    if (!result) return null

    return {
      diagnosisId,
      result,
      fromCache: false,
      reports: {
        html: ReportGenerator.generateHtmlReport(result),
        json: ReportGenerator.generateJsonReport(result)
      }
    }
  }

  /**
   * URL診断履歴を取得
   */
  async getDiagnosisHistory(url: string, limit: number = 10): Promise<DiagnosisHistoryItem[]> {
    const history = await this.diagnosisService.getDiagnosisByUrl(url, limit)
    
    return history.map(diagnosis => ({
      id: diagnosis.id,
      url: diagnosis.url,
      overallScore: diagnosis.overall_score,
      category: diagnosis.category,
      diagnosisDate: new Date(diagnosis.diagnosis_date),
      status: diagnosis.status
    }))
  }

  /**
   * 進捗状態を取得
   */
  async getProgress(progressId: string): Promise<ProgressStatus | null> {
    if (!this.diagnosisService) return null

    try {
      // Supabase から進捗情報を取得
      const progress = await this.diagnosisService.getProgress(progressId)
      if (!progress) return null
      
      return {
        id: progressId,
        status: progress.status,
        currentStep: progress.current_step,
        percentage: progress.progress_percentage,
        estimatedCompletion: new Date(progress.estimated_completion)
      }
    } catch (error) {
      console.error('進捗取得エラー:', error)
      return null
    }
  }

  /**
   * 統計情報を取得
   */
  async getStatistics(days: number = 30): Promise<DiagnosisStatistics> {
    return this.diagnosisService.getStatistics(days)
  }

  /**
   * 進捗を更新
   */
  private async updateProgress(
    progressId: string,
    status: string,
    currentStep: string,
    percentage: number,
    completedSteps?: string[],
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.diagnosisService.updateProgress(
        progressId,
        status,
        currentStep,
        percentage,
        completedSteps,
        errorMessage
      )
    } catch (error) {
      console.warn('進捗更新エラー:', error)
    }
  }

  /**
   * バッチ診断（複数URL同時処理）
   */
  async executeBatchDiagnosis(
    urls: string[],
    options: Partial<CrawlOptions> = {},
    useCache: boolean = true
  ): Promise<BatchDiagnosisResult> {
    const results: Array<DiagnosisResult | { error: string, url: string }> = []
    const startTime = Date.now()

    console.log(`🔄 バッチ診断開始: ${urls.length}件のURL`)

    for (const url of urls) {
      try {
        const result = await this.executeDiagnosis(url, options, useCache)
        results.push(result)
        console.log(`✅ ${url} の診断完了`)
      } catch (error) {
        console.error(`❌ ${url} の診断失敗:`, error)
        results.push({
          error: error instanceof Error ? error.message : String(error),
          url
        })
      }

      // レート制限対策（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const processingTime = Date.now() - startTime
    const successCount = results.filter(r => 'result' in r).length
    const errorCount = results.length - successCount

    console.log(`🏁 バッチ診断完了: 成功${successCount}件、失敗${errorCount}件、実行時間${Math.round(processingTime/1000)}秒`)

    return {
      results,
      summary: {
        total: urls.length,
        success: successCount,
        errors: errorCount,
        processingTime
      }
    }
  }
}

/**
 * 型定義
 */
export interface DiagnosisResult {
  diagnosisId: string
  result: AnalysisResult
  fromCache: boolean
  reports: {
    html: string
    json: string
  }
}

export interface DiagnosisHistoryItem {
  id: string
  url: string
  overallScore: number
  category: string
  diagnosisDate: Date
  status: string
}

export interface ProgressStatus {
  id: string
  status: string
  currentStep: string
  percentage: number
  estimatedCompletion: Date
}

export interface DiagnosisStatistics {
  totalDiagnoses: number
  averageScore: number
  categoryDistribution: Record<string, number>
  topIssues: Array<{ issue: string; count: number }>
}

export interface BatchDiagnosisResult {
  results: Array<DiagnosisResult | { error: string, url: string }>
  summary: {
    total: number
    success: number
    errors: number
    processingTime: number
  }
}