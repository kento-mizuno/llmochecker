import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { 
  useDiagnosisStore, 
  DIAGNOSIS_STAGES,
  type DiagnosisProgress 
} from '../../../lib/stores/diagnosis-store'

// fetchのモック
global.fetch = vi.fn()

describe('DiagnosisStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const { resetDiagnosis } = useDiagnosisStore.getState()
    resetDiagnosis()
    
    // fetchのモックをリセット
    vi.clearAllMocks()
    
    // タイマーをモック
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初期状態', () => {
    it('初期値が正しく設定されている', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      expect(result.current.currentDiagnosisId).toBe(null)
      expect(result.current.progress).toBe(null)
      expect(result.current.startTime).toBe(null)
      expect(result.current.isPolling).toBe(false)
      expect(result.current.pollingInterval).toBe(null)
    })
  })

  describe('診断開始', () => {
    it('診断を正しく開始する', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      const diagnosisId = 'test-diagnosis-123'

      act(() => {
        result.current.startDiagnosis(diagnosisId)
      })

      expect(result.current.currentDiagnosisId).toBe(diagnosisId)
      expect(result.current.startTime).toBeInstanceOf(Date)
      expect(result.current.progress).toEqual({
        stage: DIAGNOSIS_STAGES.INITIALIZING,
        progress: 0,
        message: '診断プロセスを開始しています',
        estimatedTimeRemaining: null
      })
      expect(result.current.isPolling).toBe(true)
    })

    it('ポーリングが開始される', async () => {
      const mockResponse = {
        stage: 'analyzing_content',
        progress: 50,
        message: 'コンテンツを分析中',
        estimatedTimeRemaining: 120
      }
      
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useDiagnosisStore())

      act(() => {
        result.current.startDiagnosis('test-id')
      })

      // 2秒後にポーリングが実行される
      await act(async () => {
        vi.advanceTimersByTime(2000)
        await vi.runAllTimersAsync()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/diagnosis/test-id/progress')
    })
  })

  describe('進捗更新', () => {
    it('進捗を正しく更新する', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      const newProgress: DiagnosisProgress = {
        stage: DIAGNOSIS_STAGES.ANALYZING_CONTENT,
        progress: 75,
        message: 'コンテンツを分析中',
        estimatedTimeRemaining: 60
      }

      act(() => {
        result.current.updateProgress(newProgress)
      })

      expect(result.current.progress).toEqual(newProgress)
    })

    it('完了時にポーリングが停止される', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      // 先にポーリングを開始
      act(() => {
        result.current.startDiagnosis('test-id')
      })
      
      expect(result.current.isPolling).toBe(true)

      // 完了状態に更新
      act(() => {
        result.current.updateProgress({
          stage: DIAGNOSIS_STAGES.COMPLETED,
          progress: 100,
          message: '診断が完了しました',
          estimatedTimeRemaining: 0
        })
      })

      expect(result.current.isPolling).toBe(false)
    })

    it('エラー時にポーリングが停止される', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      act(() => {
        result.current.startDiagnosis('test-id')
      })
      
      expect(result.current.isPolling).toBe(true)

      act(() => {
        result.current.updateProgress({
          stage: DIAGNOSIS_STAGES.ERROR,
          progress: 0,
          message: 'エラーが発生しました',
          estimatedTimeRemaining: null,
          error: 'テストエラー'
        })
      })

      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('診断停止', () => {
    it('診断を正しく停止する', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      act(() => {
        result.current.startDiagnosis('test-id')
      })

      act(() => {
        result.current.stopDiagnosis()
      })

      expect(result.current.currentDiagnosisId).toBe(null)
      expect(result.current.progress).toBe(null)
      expect(result.current.startTime).toBe(null)
      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('診断リセット', () => {
    it('すべての状態をリセットする', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      // 状態を設定
      act(() => {
        result.current.startDiagnosis('test-id')
        result.current.updateProgress({
          stage: DIAGNOSIS_STAGES.ANALYZING_CONTENT,
          progress: 50,
          message: 'テスト',
          estimatedTimeRemaining: 100
        })
      })

      act(() => {
        result.current.resetDiagnosis()
      })

      expect(result.current.currentDiagnosisId).toBe(null)
      expect(result.current.progress).toBe(null)
      expect(result.current.startTime).toBe(null)
      expect(result.current.isPolling).toBe(false)
      expect(result.current.pollingInterval).toBe(null)
    })
  })

  describe('ポーリング制御', () => {
    it('ポーリングを手動で停止できる', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      act(() => {
        result.current.startPolling('test-id')
      })
      
      expect(result.current.isPolling).toBe(true)

      act(() => {
        result.current.stopPolling()
      })

      expect(result.current.isPolling).toBe(false)
    })

    it('APIエラー時にエラー状態を設定する', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useDiagnosisStore())

      act(() => {
        result.current.startPolling('test-id')
      })

      await act(async () => {
        vi.advanceTimersByTime(2000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.progress?.stage).toBe(DIAGNOSIS_STAGES.ERROR)
      expect(result.current.progress?.message).toBe('ネットワークエラーが発生しました')
    })

    it('404レスポンス時にポーリングを停止する', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404
      })

      const { result } = renderHook(() => useDiagnosisStore())

      act(() => {
        result.current.startPolling('test-id')
      })

      expect(result.current.isPolling).toBe(true)

      await act(async () => {
        vi.advanceTimersByTime(2000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('残り時間計算', () => {
    it('進捗から残り時間を計算する', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      const startTime = new Date()
      
      act(() => {
        // 手動でstartTimeを設定
        useDiagnosisStore.setState({
          startTime,
          progress: {
            stage: DIAGNOSIS_STAGES.ANALYZING_CONTENT,
            progress: 25, // 25%完了
            message: 'テスト',
            estimatedTimeRemaining: null
          }
        })
      })

      // 1分後を想定
      vi.setSystemTime(new Date(startTime.getTime() + 60000))

      const estimatedTime = result.current.calculateEstimatedTime()
      
      // 25%完了に1分かかった場合、残り75%で3分かかると推定
      expect(estimatedTime).toBe(180) // 3分 = 180秒
    })

    it('進捗が0の場合はnullを返す', () => {
      const { result } = renderHook(() => useDiagnosisStore())
      
      act(() => {
        useDiagnosisStore.setState({
          startTime: new Date(),
          progress: {
            stage: DIAGNOSIS_STAGES.INITIALIZING,
            progress: 0,
            message: 'テスト',
            estimatedTimeRemaining: null
          }
        })
      })

      expect(result.current.calculateEstimatedTime()).toBe(null)
    })
  })
})