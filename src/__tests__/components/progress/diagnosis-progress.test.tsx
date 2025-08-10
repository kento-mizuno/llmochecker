import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DiagnosisProgress } from '../../../components/progress/diagnosis-progress'
import { useDiagnosisStore, DIAGNOSIS_STAGES } from '../../../../lib/stores/diagnosis-store'

// Zustand storeをモック
vi.mock('../../../../lib/stores/diagnosis-store', () => ({
  useDiagnosisStore: vi.fn(),
  DIAGNOSIS_STAGES: {
    INITIALIZING: 'initializing',
    FETCHING_CONTENT: 'fetching_content',
    PARSING_HTML: 'parsing_html',
    ANALYZING_CONTENT: 'analyzing_content',
    EVALUATING_METRICS: 'evaluating_metrics',
    GENERATING_IMPROVEMENTS: 'generating_improvements',
    SAVING_RESULTS: 'saving_results',
    COMPLETED: 'completed',
    ERROR: 'error'
  }
}))

describe('DiagnosisProgress', () => {
  const mockStartDiagnosis = vi.fn()
  const mockStopDiagnosis = vi.fn()
  const mockResetDiagnosis = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnComplete = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // デフォルトのstore状態
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: null,
      currentDiagnosisId: null,
      startTime: null,
      isPolling: false,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期状態で準備中メッセージを表示する', () => {
    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText('診断を準備中...')).toBeInTheDocument()
  })

  it('診断開始時にstartDiagnosisが呼ばれる', () => {
    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    expect(mockStartDiagnosis).toHaveBeenCalledWith('test-123')
  })

  it('進行中の診断を表示する', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.ANALYZING_CONTENT,
        progress: 60,
        message: 'コンテンツを分析中',
        estimatedTimeRemaining: 120
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(),
      isPolling: true,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText('診断進行中')).toBeInTheDocument()
    expect(screen.getByText('60.0%')).toBeInTheDocument()
    expect(screen.getByText('残り約 2分')).toBeInTheDocument()
    expect(screen.getByText('リアルタイム更新中')).toBeInTheDocument()
  })

  it('完了状態を表示する', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.COMPLETED,
        progress: 100,
        message: '診断が完了しました',
        estimatedTimeRemaining: 0
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(Date.now() - 180000), // 3分前
      isPolling: false,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText('診断完了')).toBeInTheDocument()
    expect(screen.getByText('診断が正常に完了しました！')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument() // 経過時間
  })

  it('エラー状態を表示する', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.ERROR,
        progress: 0,
        message: 'ネットワークエラー',
        estimatedTimeRemaining: null,
        error: 'Connection failed'
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(),
      isPolling: false,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText('診断エラー')).toBeInTheDocument()
    expect(screen.getByText('診断中にエラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('Connection failed')).toBeInTheDocument()
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.ANALYZING_CONTENT,
        progress: 30,
        message: 'テスト中',
        estimatedTimeRemaining: 180
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(),
      isPolling: true,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    const cancelButton = screen.getByText('診断を中止')
    fireEvent.click(cancelButton)
    
    expect(mockStopDiagnosis).toHaveBeenCalled()
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('再試行ボタンをクリックするとresetDiagnosisが呼ばれる', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.ERROR,
        progress: 0,
        message: 'エラー',
        estimatedTimeRemaining: null,
        error: 'Test error'
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(),
      isPolling: false,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    const retryButton = screen.getByText('再試行')
    fireEvent.click(retryButton)
    
    expect(mockResetDiagnosis).toHaveBeenCalled()
  })

  it('コンパクト表示モードで表示する', () => {
    ;(useDiagnosisStore as any).mockReturnValue({
      progress: {
        stage: DIAGNOSIS_STAGES.FETCHING_CONTENT,
        progress: 25,
        message: 'コンテンツ取得中',
        estimatedTimeRemaining: 240
      },
      currentDiagnosisId: 'test-123',
      startTime: new Date(),
      isPolling: true,
      startDiagnosis: mockStartDiagnosis,
      stopDiagnosis: mockStopDiagnosis,
      resetDiagnosis: mockResetDiagnosis
    })

    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
        compact={true}
      />
    )
    
    expect(screen.getByText('診断進行中')).toBeInTheDocument()
    expect(screen.getByText('残り約 4分')).toBeInTheDocument()
    
    // コンパクト表示では中止ボタンのテキストが短い
    expect(screen.getByText('中止')).toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    render(
      <DiagnosisProgress 
        diagnosisId="test-123"
        className="custom-progress"
        onCancel={mockOnCancel}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )
    
    const container = document.querySelector('.custom-progress')
    expect(container).toBeInTheDocument()
  })
})