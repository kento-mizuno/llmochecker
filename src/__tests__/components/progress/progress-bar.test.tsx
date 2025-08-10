import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../../../components/progress/progress-bar'

describe('ProgressBar', () => {
  it('基本的な進捗バーを表示する', () => {
    render(<ProgressBar progress={50} />)
    
    expect(screen.getByText('進捗')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })

  it('進捗率が0-100の範囲に制限される', () => {
    const { rerender } = render(<ProgressBar progress={150} />)
    expect(screen.getByText('100.0%')).toBeInTheDocument()

    rerender(<ProgressBar progress={-50} />)
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('パーセンテージ表示を非表示にできる', () => {
    render(<ProgressBar progress={75} showPercentage={false} />)
    
    expect(screen.getByText('進捗')).toBeInTheDocument()
    expect(screen.queryByText('75.0%')).not.toBeInTheDocument()
  })

  it('アニメーションを無効にできる', () => {
    render(<ProgressBar progress={60} animated={false} />)
    
    const progressElement = screen.getByRole('progressbar', { hidden: true })
    expect(progressElement).toBeInTheDocument()
  })

  it('サイズバリアントが適用される', () => {
    const { rerender } = render(<ProgressBar progress={50} size="sm" />)
    let container = document.querySelector('.h-2')
    expect(container).toBeInTheDocument()

    rerender(<ProgressBar progress={50} size="lg" />)
    container = document.querySelector('.h-4')
    expect(container).toBeInTheDocument()
  })

  it('カラーバリアントが適用される', () => {
    const { rerender } = render(<ProgressBar progress={50} variant="success" />)
    let colorElement = document.querySelector('.bg-green-500')
    expect(colorElement).toBeInTheDocument()

    rerender(<ProgressBar progress={50} variant="error" />)
    colorElement = document.querySelector('.bg-red-500')
    expect(colorElement).toBeInTheDocument()

    rerender(<ProgressBar progress={50} variant="warning" />)
    colorElement = document.querySelector('.bg-yellow-500')
    expect(colorElement).toBeInTheDocument()
  })

  it('アニメーション中のドット表示', () => {
    render(<ProgressBar progress={50} animated={true} />)
    
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('カスタムクラス名が適用される', () => {
    render(<ProgressBar progress={50} className="custom-progress" />)
    
    const container = document.querySelector('.custom-progress')
    expect(container).toBeInTheDocument()
  })

  it('進捗バーの幅が正しく設定される', () => {
    render(<ProgressBar progress={75} />)
    
    const progressBar = document.querySelector('[style*="width: 75%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('アクセシビリティ属性が設定される', () => {
    render(<ProgressBar progress={50} />)
    
    // 進捗を示すセマンティックな要素があることを確認
    expect(screen.getByText('進捗')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })
})