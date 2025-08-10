import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UrlInputForm } from '@/components/diagnosis/UrlInputForm'

// ローカルストレージのモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('UrlInputForm', () => {
  const mockOnSubmit = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('正常にレンダリングされる', () => {
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByText('診断するサイトのURLを入力')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('無料診断を開始')).toBeInTheDocument()
  })

  it('有効なURLを入力すると送信ボタンが有効になる', async () => {
    const user = userEvent.setup()
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('無料診断を開始')
    
    // 初期状態では送信ボタンが無効
    expect(submitButton).toBeDisabled()
    
    // 有効なURLを入力
    await user.type(input, 'https://example.com')
    
    // 送信ボタンが有効になる
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('無効なURLを入力するとエラーが表示される', async () => {
    const user = userEvent.setup()
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    
    // 無効なURLを入力
    await user.type(input, 'invalid-url')
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('有効なURLを入力してください')).toBeInTheDocument()
    })
  })

  it('httpプロトコルを入力するとエラーが表示される', async () => {
    const user = userEvent.setup()
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    
    // httpで始まらないURLを入力
    await user.type(input, 'ftp://example.com')
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('http://またはhttps://で始まるURLを入力してください')).toBeInTheDocument()
    })
  })

  it('フォームを送信すると正規化されたURLが渡される', async () => {
    const user = userEvent.setup()
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('無料診断を開始')
    
    // トレーリングスラッシュ付きのURLを入力
    await user.type(input, 'https://example.com/')
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    // フォームを送信
    await user.click(submitButton)
    
    // 正規化されたURL（スラッシュなし）が渡される
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('ローディング状態では入力とボタンが無効になる', () => {
    render(<UrlInputForm onSubmit={mockOnSubmit} isLoading={true} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('診断を開始しています...')
    
    expect(input).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('初期URLが設定されている場合、フィールドに表示される', () => {
    render(<UrlInputForm onSubmit={mockOnSubmit} initialUrl="https://test.com" />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    expect(input).toHaveValue('https://test.com')
  })

  it('履歴からURLを選択できる', async () => {
    const user = userEvent.setup()
    
    // 履歴データをモック
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      'https://example1.com',
      'https://example2.com'
    ]))
    
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    // 履歴ボタンをクリック
    const historyButton = screen.getByLabelText('URL履歴を表示')
    await user.click(historyButton)
    
    // 履歴が表示される
    expect(screen.getByText('https://example1.com')).toBeInTheDocument()
    expect(screen.getByText('https://example2.com')).toBeInTheDocument()
    
    // 履歴からURLを選択
    await user.click(screen.getByText('https://example1.com'))
    
    // 入力フィールドに選択したURLが入る
    const input = screen.getByPlaceholderText('https://example.com')
    expect(input).toHaveValue('https://example1.com')
  })

  it('履歴からURLを削除できる', async () => {
    const user = userEvent.setup()
    
    // 履歴データをモック
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      'https://example1.com',
      'https://example2.com'
    ]))
    
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    // 履歴ボタンをクリック
    const historyButton = screen.getByLabelText('URL履歴を表示')
    await user.click(historyButton)
    
    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByLabelText('履歴から削除')
    await user.click(deleteButtons[0])
    
    // ローカルストレージから削除される
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'url_history',
      JSON.stringify(['https://example2.com'])
    )
  })

  it('リアルタイムバリデーションが動作する', async () => {
    const user = userEvent.setup()
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    
    // 有効なURLを入力
    await user.type(input, 'https://example.com')
    
    // 有効なアイコンとメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('有効なURLです')).toBeInTheDocument()
    })
  })

  it('アクセシビリティが適切に設定されている', () => {
    render(<UrlInputForm onSubmit={mockOnSubmit} />)
    
    const input = screen.getByPlaceholderText('https://example.com')
    const label = screen.getByText('ウェブサイトURL')
    
    // ラベルとinputが関連付けられている
    expect(input).toHaveAccessibleName('ウェブサイトURL')
    
    // 必須フィールドマークが表示されている
    expect(screen.getByText('*')).toBeInTheDocument()
    
    // autocompleteが設定されている
    expect(input).toHaveAttribute('autocomplete', 'url')
    
    // autofocusが設定されている
    expect(input).toHaveFocus()
  })
})