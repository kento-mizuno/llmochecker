import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 診断の各段階を定義
export const DIAGNOSIS_STAGES = {
  INITIALIZING: 'initializing',
  FETCHING_CONTENT: 'fetching_content',
  PARSING_HTML: 'parsing_html',
  ANALYZING_CONTENT: 'analyzing_content',
  EVALUATING_METRICS: 'evaluating_metrics',
  GENERATING_IMPROVEMENTS: 'generating_improvements',
  SAVING_RESULTS: 'saving_results',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const

export type DiagnosisStage = typeof DIAGNOSIS_STAGES[keyof typeof DIAGNOSIS_STAGES]

// 診断進捗の状態
export interface DiagnosisProgress {
  stage: DiagnosisStage
  progress: number // 0-100の進捗率
  message: string
  estimatedTimeRemaining: number | null // 秒単位
  error?: string
}

// 診断状態
export interface DiagnosisState {
  // 現在の診断ID
  currentDiagnosisId: string | null
  
  // 進捗情報
  progress: DiagnosisProgress | null
  
  // 診断開始時刻
  startTime: Date | null
  
  // ポーリング関連
  isPolling: boolean
  pollingInterval: NodeJS.Timeout | null
  
  // アクション
  startDiagnosis: (diagnosisId: string) => void
  updateProgress: (progress: DiagnosisProgress) => void
  stopDiagnosis: () => void
  resetDiagnosis: () => void
  
  // ポーリング制御
  startPolling: (diagnosisId: string) => void
  stopPolling: () => void
  
  // 残り時間計算
  calculateEstimatedTime: () => number | null
}

// 各段階の詳細情報
export const STAGE_DETAILS: Record<DiagnosisStage, { name: string; description: string }> = {
  [DIAGNOSIS_STAGES.INITIALIZING]: {
    name: '初期化中',
    description: '診断プロセスを開始しています'
  },
  [DIAGNOSIS_STAGES.FETCHING_CONTENT]: {
    name: 'コンテンツ取得中',
    description: 'Webサイトのコンテンツを取得しています'
  },
  [DIAGNOSIS_STAGES.PARSING_HTML]: {
    name: 'HTML解析中',
    description: 'HTMLコンテンツを解析しています'
  },
  [DIAGNOSIS_STAGES.ANALYZING_CONTENT]: {
    name: 'コンテンツ分析中',
    description: 'コンテンツの品質を分析しています'
  },
  [DIAGNOSIS_STAGES.EVALUATING_METRICS]: {
    name: '評価計算中',
    description: 'LLMO評価指標を計算しています'
  },
  [DIAGNOSIS_STAGES.GENERATING_IMPROVEMENTS]: {
    name: '改善提案生成中',
    description: 'AI改善提案を生成しています'
  },
  [DIAGNOSIS_STAGES.SAVING_RESULTS]: {
    name: '結果保存中',
    description: '診断結果を保存しています'
  },
  [DIAGNOSIS_STAGES.COMPLETED]: {
    name: '完了',
    description: '診断が正常に完了しました'
  },
  [DIAGNOSIS_STAGES.ERROR]: {
    name: 'エラー',
    description: '診断中にエラーが発生しました'
  }
}

export const useDiagnosisStore = create<DiagnosisState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      currentDiagnosisId: null,
      progress: null,
      startTime: null,
      isPolling: false,
      pollingInterval: null,
      
      // 診断開始
      startDiagnosis: (diagnosisId: string) => {
        set({
          currentDiagnosisId: diagnosisId,
          startTime: new Date(),
          progress: {
            stage: DIAGNOSIS_STAGES.INITIALIZING,
            progress: 0,
            message: STAGE_DETAILS[DIAGNOSIS_STAGES.INITIALIZING].description,
            estimatedTimeRemaining: null
          }
        })
        
        // ポーリング開始
        get().startPolling(diagnosisId)
      },
      
      // 進捗更新
      updateProgress: (progress: DiagnosisProgress) => {
        set((state) => ({
          progress: {
            ...progress,
            estimatedTimeRemaining: get().calculateEstimatedTime()
          }
        }))
        
        // 完了またはエラー時はポーリング停止
        if (progress.stage === DIAGNOSIS_STAGES.COMPLETED || 
            progress.stage === DIAGNOSIS_STAGES.ERROR) {
          get().stopPolling()
        }
      },
      
      // 診断停止
      stopDiagnosis: () => {
        get().stopPolling()
        set({
          currentDiagnosisId: null,
          progress: null,
          startTime: null
        })
      },
      
      // 診断リセット
      resetDiagnosis: () => {
        get().stopPolling()
        set({
          currentDiagnosisId: null,
          progress: null,
          startTime: null,
          isPolling: false,
          pollingInterval: null
        })
      },
      
      // ポーリング開始
      startPolling: (diagnosisId: string) => {
        const { isPolling, pollingInterval } = get()
        
        // 既にポーリング中の場合は停止
        if (isPolling && pollingInterval) {
          clearInterval(pollingInterval)
        }
        
        // 新しいポーリング開始
        const interval = setInterval(async () => {
          try {
            const response = await fetch(`/api/diagnosis/${diagnosisId}/progress`)
            if (response.ok) {
              const progressData = await response.json()
              get().updateProgress(progressData)
            } else if (response.status === 404) {
              // 診断が見つからない場合はポーリング停止
              get().stopPolling()
            }
          } catch (error) {
            console.error('Progress polling error:', error)
            // エラーが続く場合はポーリング停止
            get().updateProgress({
              stage: DIAGNOSIS_STAGES.ERROR,
              progress: 0,
              message: 'ネットワークエラーが発生しました',
              estimatedTimeRemaining: null,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }, 2000) // 2秒間隔
        
        set({
          isPolling: true,
          pollingInterval: interval
        })
      },
      
      // ポーリング停止
      stopPolling: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        set({
          isPolling: false,
          pollingInterval: null
        })
      },
      
      // 残り時間計算
      calculateEstimatedTime: () => {
        const { progress, startTime } = get()
        if (!progress || !startTime || progress.progress <= 0) {
          return null
        }
        
        const elapsed = (Date.now() - startTime.getTime()) / 1000 // 経過時間（秒）
        const estimatedTotal = elapsed / (progress.progress / 100) // 予想総時間
        const remaining = Math.max(0, estimatedTotal - elapsed) // 残り時間
        
        return Math.round(remaining)
      }
    }),
    {
      name: 'diagnosis-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)