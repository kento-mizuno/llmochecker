import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ResultPage from '../../../../../app/diagnosis/[id]/result/page'

// Next.js router のモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// fetch APIのモック
global.fetch = vi.fn()

// Recharts のモック（Chart コンポーネントは複雑なため）
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  Legend: () => <div data-testid="legend" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}))

describe('ResultPage', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()

  const mockApiResponse = {
    id: 'test-123',
    fromCache: false,
    summary: {
      url: 'https://example.com',
      timestamp: '2024-01-15T10:00:00Z',
      overallScore: 72,
      category: 'B'
    },
    technicalSignals: {},
    contentAnalysis: {},
    evaluations: [
      {
        criteriaId: 'seo_title',
        score: 85,
        maxScore: 100,
        feedback: '良好なタイトル設定',
        suggestions: ['キーワード密度を最適化']
      },
      {
        criteriaId: 'content_quality',
        score: 78,
        maxScore: 100,
        feedback: 'コンテンツ品質は平均以上',
        suggestions: ['より詳細な情報を追加']
      }
    ],
    geminiAnalysis: {
      eeatScore: 75,
      qualityScore: 80,
      suggestions: ['専門性の向上', 'E-E-A-Tの強化'],
      strengths: ['コンテンツの独自性', '技術的な正確性'],
      weaknesses: ['権威性の不足', '更新頻度の改善が必要']
    },
    reports: {
      json: {},
      htmlUrl: '/api/diagnosis/test-123/result?format=html'
    },
    metadata: {
      generatedAt: '2024-01-15T10:05:00Z',
      version: '1.0.0'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
      back: mockBack
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ローディング状態を表示する', () => {
    ;(global.fetch as any).mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    expect(screen.getByText('診断結果を読み込み中...')).toBeInTheDocument()
    expect(screen.getByText('しばらくお待ちください')).toBeInTheDocument()
  })

  it('API呼び出しが成功した場合の結果表示', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('診断結果')).toBeInTheDocument()
    })

    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument() // 総合スコア
    expect(screen.getByText('B')).toBeInTheDocument() // グレード
  })

  it('API呼び出しでエラーが発生した場合の表示', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' })
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    })

    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  it('強みと弱みを表示する', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('強み')).toBeInTheDocument()
    })

    expect(screen.getByText('コンテンツの独自性')).toBeInTheDocument()
    expect(screen.getByText('技術的な正確性')).toBeInTheDocument()
    expect(screen.getByText('権威性の不足')).toBeInTheDocument()
    expect(screen.getByText('更新頻度の改善が必要')).toBeInTheDocument()
  })

  it('タブナビゲーションを表示する', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('概要')).toBeInTheDocument()
    })

    expect(screen.getByText('詳細分析')).toBeInTheDocument()
    expect(screen.getByText('改善提案')).toBeInTheDocument()
    expect(screen.getByText('比較')).toBeInTheDocument()
  })

  it('改善提案を表示する', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('診断結果')).toBeInTheDocument()
    })

    // 改善提案タブの内容（初期状態では表示されない可能性があるため、タブクリック後の確認が必要）
    expect(screen.getByText('専門性の向上')).toBeInTheDocument()
    expect(screen.getByText('E-E-A-Tの強化')).toBeInTheDocument()
  })

  it('ActionButtonsが正しく動作する', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('戻る')).toBeInTheDocument()
    })

    expect(screen.getByText('レポート')).toBeInTheDocument()
    expect(screen.getByText('共有')).toBeInTheDocument()
    expect(screen.getByText('新しい診断')).toBeInTheDocument()
  })

  it('チャートコンポーネントが表示される', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  it('キャッシュ状態を表示する', async () => {
    const cachedResponse = {
      ...mockApiResponse,
      fromCache: true
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => cachedResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('(キャッシュから取得)')).toBeInTheDocument()
    })
  })

  it('評価項目のマッピングが正しく動作する', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<ResultPage params={Promise.resolve({ id: 'test-123' })} />)

    await waitFor(() => {
      expect(screen.getByText('タイトル最適化')).toBeInTheDocument()
    })

    expect(screen.getByText('コンテンツ品質')).toBeInTheDocument()
  })
})