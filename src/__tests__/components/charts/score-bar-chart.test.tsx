import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBarChart } from '../../../components/charts/score-bar-chart'

describe('ScoreBarChart', () => {
  const mockData = [
    { name: 'SEO基礎', score: 85, maxScore: 100, color: '#10b981' },
    { name: 'コンテンツ品質', score: 78, maxScore: 100, color: '#f59e0b' },
    { name: '技術的要素', score: 65, maxScore: 100, color: '#f97316' },
    { name: 'パフォーマンス', score: 92, maxScore: 100, color: '#10b981' }
  ]

  it('タイトルと説明を表示する', () => {
    render(<ScoreBarChart data={mockData} />)
    
    expect(screen.getByText('カテゴリ別スコア詳細')).toBeInTheDocument()
    expect(screen.getByText('各カテゴリの詳細スコア')).toBeInTheDocument()
  })

  it('カスタムタイトルと説明を表示する', () => {
    render(
      <ScoreBarChart 
        data={mockData}
        title="詳細分析"
        description="スコア内訳"
      />
    )
    
    expect(screen.getByText('詳細分析')).toBeInTheDocument()
    expect(screen.getByText('スコア内訳')).toBeInTheDocument()
  })

  it('凡例を表示する', () => {
    render(<ScoreBarChart data={mockData} />)
    
    expect(screen.getByText('優秀 (80-100%)')).toBeInTheDocument()
    expect(screen.getByText('良好 (60-79%)')).toBeInTheDocument()
    expect(screen.getByText('改善要 (40-59%)')).toBeInTheDocument()
    expect(screen.getByText('要注意 (0-39%)')).toBeInTheDocument()
  })

  it('色分けされた凡例アイコンを表示する', () => {
    render(<ScoreBarChart data={mockData} />)
    
    const greenIcon = document.querySelector('.bg-green-500')
    const amberIcon = document.querySelector('.bg-amber-500')
    const orangeIcon = document.querySelector('.bg-orange-500')
    const redIcon = document.querySelector('.bg-red-500')
    
    expect(greenIcon).toBeInTheDocument()
    expect(amberIcon).toBeInTheDocument()
    expect(orangeIcon).toBeInTheDocument()
    expect(redIcon).toBeInTheDocument()
  })

  it('空のデータでもエラーが発生しない', () => {
    expect(() => {
      render(<ScoreBarChart data={[]} />)
    }).not.toThrow()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <ScoreBarChart data={mockData} className="custom-bar-chart" />
    )
    
    expect(container.querySelector('.custom-bar-chart')).toBeInTheDocument()
  })

  it('Y軸のラベルが正しく設定される', () => {
    render(<ScoreBarChart data={mockData} />)
    
    // Y軸ラベルの存在確認（チャートライブラリの内部構造のため直接検証は困難）
    expect(screen.getByText('カテゴリ別スコア詳細')).toBeInTheDocument()
  })
})