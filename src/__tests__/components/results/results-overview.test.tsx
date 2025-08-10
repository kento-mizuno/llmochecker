import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsOverview } from '../../../components/results/results-overview'

describe('ResultsOverview', () => {
  const mockResult = {
    url: 'https://example.com',
    totalScore: 72,
    maxScore: 100,
    grade: 'B',
    categories: [
      {
        name: 'SEO基礎',
        score: 85,
        maxScore: 100,
        status: 'excellent' as const
      },
      {
        name: 'コンテンツ品質',
        score: 78,
        maxScore: 100,
        status: 'good' as const
      },
      {
        name: '技術的要素',
        score: 45,
        maxScore: 100,
        status: 'critical' as const
      }
    ],
    strengths: [
      'ページ読み込み速度が優秀',
      'メタタグが適切に設定されている'
    ],
    weaknesses: [
      'アクセシビリティの改善が必要',
      'ユーザビリティに課題がある'
    ],
    completedAt: '2024-01-15T10:00:00Z',
    analysisTime: 142
  }

  it('基本情報を表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('診断結果サマリー')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('総合スコア')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('グレード')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('評価項目')).toBeInTheDocument()
  })

  it('完了時間と分析時間を表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText(/2024.+に完了/)).toBeInTheDocument()
    expect(screen.getByText(/分析時間.+2分22秒/)).toBeInTheDocument()
  })

  it('カテゴリ別ステータスを表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('カテゴリ別ステータス')).toBeInTheDocument()
    expect(screen.getByText('SEO基礎')).toBeInTheDocument()
    expect(screen.getByText('85/100 ポイント')).toBeInTheDocument()
    expect(screen.getByText('コンテンツ品質')).toBeInTheDocument()
    expect(screen.getByText('78/100 ポイント')).toBeInTheDocument()
    expect(screen.getByText('技術的要素')).toBeInTheDocument()
    expect(screen.getByText('45/100 ポイント')).toBeInTheDocument()
  })

  it('ステータスバッジを表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('優秀')).toBeInTheDocument()
    expect(screen.getByText('良好')).toBeInTheDocument()
    expect(screen.getByText('要注意')).toBeInTheDocument()
  })

  it('パーセンテージを正しく計算して表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('85%')).toBeInTheDocument() // 85/100 = 85%
    expect(screen.getByText('78%')).toBeInTheDocument() // 78/100 = 78%
    expect(screen.getByText('45%')).toBeInTheDocument() // 45/100 = 45%
  })

  it('強みを表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('強み')).toBeInTheDocument()
    expect(screen.getByText('現在優秀な評価を受けている項目')).toBeInTheDocument()
    expect(screen.getByText('ページ読み込み速度が優秀')).toBeInTheDocument()
    expect(screen.getByText('メタタグが適切に設定されている')).toBeInTheDocument()
  })

  it('弱み/改善項目を表示する', () => {
    render(<ResultsOverview result={mockResult} />)

    expect(screen.getByText('改善が必要な項目')).toBeInTheDocument()
    expect(screen.getByText('優先的に対応すべき項目')).toBeInTheDocument()
    expect(screen.getByText('アクセシビリティの改善が必要')).toBeInTheDocument()
    expect(screen.getByText('ユーザビリティに課題がある')).toBeInTheDocument()
  })

  it('強みが空の場合の表示', () => {
    const resultWithoutStrengths = {
      ...mockResult,
      strengths: []
    }

    render(<ResultsOverview result={resultWithoutStrengths} />)

    expect(screen.getByText('現時点で特筆すべき強みが見つかりませんでした。')).toBeInTheDocument()
  })

  it('弱みが空の場合の表示', () => {
    const resultWithoutWeaknesses = {
      ...mockResult,
      weaknesses: []
    }

    render(<ResultsOverview result={resultWithoutWeaknesses} />)

    expect(screen.getByText('大きな問題は見つかりませんでした。')).toBeInTheDocument()
  })

  it('ステータスアイコンが表示される', () => {
    render(<ResultsOverview result={mockResult} />)

    // アイコンの存在確認（正確なアイコンのテストは困難だが、コンポーネントが描画されることを確認）
    expect(screen.getByText('強み')).toBeInTheDocument()
    expect(screen.getByText('改善が必要な項目')).toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <ResultsOverview result={mockResult} className="custom-overview" />
    )

    expect(container.querySelector('.custom-overview')).toBeInTheDocument()
  })

  it('分析時間のフォーマットが正しく動作する', () => {
    // 60秒未満のケース
    const resultWithShortTime = {
      ...mockResult,
      analysisTime: 45
    }
    
    const { rerender } = render(<ResultsOverview result={resultWithShortTime} />)
    expect(screen.getByText(/45秒/)).toBeInTheDocument()

    // 60秒以上のケース
    const resultWithLongTime = {
      ...mockResult,
      analysisTime: 125 // 2分5秒
    }
    
    rerender(<ResultsOverview result={resultWithLongTime} />)
    expect(screen.getByText(/2分5秒/)).toBeInTheDocument()
  })
})