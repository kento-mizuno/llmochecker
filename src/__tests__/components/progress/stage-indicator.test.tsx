import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StageIndicator } from '../../../components/progress/stage-indicator'
import { DIAGNOSIS_STAGES } from '../../../../lib/stores/diagnosis-store'

describe('StageIndicator', () => {
  it('現在のステージを表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.ANALYZING_CONTENT}
        progress={50}
      />
    )
    
    expect(screen.getByText('コンテンツ分析中')).toBeInTheDocument()
    expect(screen.getByText('コンテンツの品質を分析しています')).toBeInTheDocument()
  })

  it('コンパクト表示モードで表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.FETCHING_CONTENT}
        progress={25}
        compact={true}
      />
    )
    
    expect(screen.getByText('コンテンツ取得中')).toBeInTheDocument()
    expect(screen.getByText('Webサイトのコンテンツを取得しています')).toBeInTheDocument()
    expect(screen.getByText('2/8')).toBeInTheDocument() // ステップ表示
  })

  it('完了したステージにチェックアイコンを表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.ANALYZING_CONTENT}
        progress={50}
      />
    )
    
    // 初期化と取得は完了しているはず
    const checkIcons = document.querySelectorAll('[data-testid="check-circle"]')
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  it('現在のステージにローディングアイコンを表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.PARSING_HTML}
        progress={30}
      />
    )
    
    const loadingIcon = document.querySelector('[data-testid="loader"]')
    expect(loadingIcon).toBeInTheDocument()
  })

  it('エラー状態でエラーアイコンを表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.ERROR}
        progress={0}
      />
    )
    
    const errorIcon = document.querySelector('[data-testid="alert-circle"]')
    expect(errorIcon).toBeInTheDocument()
  })

  it('全体の進行状況を表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.EVALUATING_METRICS}
        progress={75}
      />
    )
    
    expect(screen.getByText('診断進行状況')).toBeInTheDocument()
    // ステップ番号の確認（評価計算中は5番目）
    expect(screen.getByText('ステップ 5/8')).toBeInTheDocument()
  })

  it('進捗バーが現在のステージで表示される', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.GENERATING_IMPROVEMENTS}
        progress={85}
      />
    )
    
    // 現在のステージの進捗バーを確認
    const progressBar = document.querySelector('[style*="width: 85%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('各ステージの接続線を表示する', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.ANALYZING_CONTENT}
        progress={60}
      />
    )
    
    // 接続線のスタイルクラスを確認
    const connectorLines = document.querySelectorAll('.h-8')
    expect(connectorLines.length).toBeGreaterThan(0)
  })

  it('完了状態では全ステージが完了として表示される', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.COMPLETED}
        progress={100}
      />
    )
    
    expect(screen.getByText('完了')).toBeInTheDocument()
    expect(screen.getByText('診断が正常に完了しました')).toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.INITIALIZING}
        progress={10}
        className="custom-indicator"
      />
    )
    
    const container = document.querySelector('.custom-indicator')
    expect(container).toBeInTheDocument()
  })

  it('適切な色分けが適用される', () => {
    render(
      <StageIndicator 
        currentStage={DIAGNOSIS_STAGES.ANALYZING_CONTENT}
        progress={50}
      />
    )
    
    // 完了ステージの緑色
    const completedElements = document.querySelectorAll('.text-green-700, .text-green-600')
    expect(completedElements.length).toBeGreaterThan(0)
    
    // 現在ステージの青色
    const currentElements = document.querySelectorAll('.text-blue-700, .text-blue-600')
    expect(currentElements.length).toBeGreaterThan(0)
    
    // 未来ステージのグレー色
    const pendingElements = document.querySelectorAll('.text-gray-500, .text-gray-400')
    expect(pendingElements.length).toBeGreaterThan(0)
  })
})