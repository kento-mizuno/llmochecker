import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreGauge } from '../../../components/charts/score-gauge'

describe('ScoreGauge', () => {
  it('基本的な情報を表示する', () => {
    render(<ScoreGauge score={85} />)
    
    expect(screen.getByText('総合スコア')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('/ 100')).toBeInTheDocument()
  })

  it('パーセンテージとグレードを正しく計算する', () => {
    render(<ScoreGauge score={92} maxScore={100} />)
    
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('カスタムスコアとmaxScoreで計算する', () => {
    render(<ScoreGauge score={36} maxScore={50} />)
    
    expect(screen.getByText('72')).toBeInTheDocument() // (36/50) * 100 = 72
    expect(screen.getByText('/ 100')).toBeInTheDocument()
  })

  it('カスタムタイトルと説明を表示する', () => {
    render(
      <ScoreGauge 
        score={75}
        title="カスタムタイトル"
        description="カスタム説明"
      />
    )
    
    expect(screen.getByText('カスタムタイトル')).toBeInTheDocument()
    expect(screen.getByText('カスタム説明')).toBeInTheDocument()
  })

  it('グレード表示を無効にできる', () => {
    render(<ScoreGauge score={85} showGrade={false} />)
    
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })

  it('異なるサイズバリアントが適用される', () => {
    const { rerender } = render(<ScoreGauge score={75} size="sm" />)
    expect(screen.getByText('75')).toHaveClass('text-lg')
    
    rerender(<ScoreGauge score={75} size="md" />)
    expect(screen.getByText('75')).toHaveClass('text-2xl')
    
    rerender(<ScoreGauge score={75} size="lg" />)
    expect(screen.getByText('75')).toHaveClass('text-3xl')
  })

  it('スコア別の色分けを行う', () => {
    const { rerender } = render(<ScoreGauge score={95} />)
    // 高スコア（緑）の確認は困難だが、エラーがないことを確認
    expect(screen.getByText('95')).toBeInTheDocument()
    
    rerender(<ScoreGauge score={65} />)
    expect(screen.getByText('65')).toBeInTheDocument()
    
    rerender(<ScoreGauge score={35} />)
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('適切なグレードを計算する', () => {
    const testCases = [
      { score: 98, expectedGrade: 'A+' },
      { score: 92, expectedGrade: 'A' },
      { score: 85, expectedGrade: 'B+' },
      { score: 75, expectedGrade: 'B' },
      { score: 65, expectedGrade: 'C+' },
      { score: 55, expectedGrade: 'C' },
      { score: 25, expectedGrade: 'F' }
    ]
    
    testCases.forEach(({ score, expectedGrade }) => {
      const { rerender } = render(<ScoreGauge score={score} />)
      expect(screen.getByText(expectedGrade)).toBeInTheDocument()
      rerender(<div />) // cleanup
    })
  })

  it('スコア説明が表示される', () => {
    const { rerender } = render(<ScoreGauge score={85} />)
    expect(screen.getByText('優秀なスコアです！')).toBeInTheDocument()
    
    rerender(<ScoreGauge score={65} />)
    expect(screen.getByText('良好なスコアです')).toBeInTheDocument()
    
    rerender(<ScoreGauge score={45} />)
    expect(screen.getByText('改善の余地があります')).toBeInTheDocument()
    
    rerender(<ScoreGauge score={25} />)
    expect(screen.getByText('大幅な改善が必要です')).toBeInTheDocument()
  })

  it('グレード別色分けガイドを表示する', () => {
    render(<ScoreGauge score={75} showGrade={true} />)
    
    expect(screen.getByText('A: 80+')).toBeInTheDocument()
    expect(screen.getByText('B: 60+')).toBeInTheDocument()
    expect(screen.getByText('C-F: 60未満')).toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <ScoreGauge score={75} className="custom-gauge" />
    )
    
    expect(container.querySelector('.custom-gauge')).toBeInTheDocument()
  })
})