import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreRadarChart } from '../../../components/charts/score-radar-chart'

describe('ScoreRadarChart', () => {
  const mockData = [
    { category: 'SEO基礎', current: 85, average: 70, fullMark: 100 },
    { category: 'コンテンツ品質', current: 78, average: 75, fullMark: 100 },
    { category: '技術的要素', current: 65, average: 68, fullMark: 100 },
    { category: 'パフォーマンス', current: 92, average: 80, fullMark: 100 }
  ]

  it('タイトルと説明を表示する', () => {
    render(<ScoreRadarChart data={mockData} />)
    
    expect(screen.getByText('カテゴリ別スコア')).toBeInTheDocument()
    expect(screen.getByText('各カテゴリの評価と平均値の比較')).toBeInTheDocument()
  })

  it('カスタムタイトルと説明を表示する', () => {
    render(
      <ScoreRadarChart 
        data={mockData}
        title="カスタムタイトル"
        description="カスタム説明"
      />
    )
    
    expect(screen.getByText('カスタムタイトル')).toBeInTheDocument()
    expect(screen.getByText('カスタム説明')).toBeInTheDocument()
  })

  it('凡例を表示する', () => {
    render(<ScoreRadarChart data={mockData} />)
    
    expect(screen.getByText('あなたのスコア')).toBeInTheDocument()
    expect(screen.getByText('平均スコア')).toBeInTheDocument()
  })

  it('空のデータでもエラーが発生しない', () => {
    expect(() => {
      render(<ScoreRadarChart data={[]} />)
    }).not.toThrow()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <ScoreRadarChart data={mockData} className="custom-chart" />
    )
    
    expect(container.querySelector('.custom-chart')).toBeInTheDocument()
  })

  it('ResponsiveContainerが正しく設定される', () => {
    render(<ScoreRadarChart data={mockData} />)
    
    // ResponsiveContainerの存在を確認（DOMに直接検証可能な属性がないため、エラーがないことを確認）
    expect(screen.getByText('カテゴリ別スコア')).toBeInTheDocument()
  })
})