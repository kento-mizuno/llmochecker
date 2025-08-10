import { test, expect } from '@playwright/test'

test.describe('診断進捗表示', () => {
  test.beforeEach(async ({ page }) => {
    // モック設定用のページを準備
    await page.addInitScript(() => {
      // fetchのモック設定
      const originalFetch = window.fetch
      window.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('/api/diagnosis/') && url.includes('/progress')) {
          const diagnosisId = url.split('/')[3]
          
          // モックの進捗データを返す
          const mockStages = ['initializing', 'fetching_content', 'parsing_html', 'analyzing_content', 'completed']
          const currentTime = Date.now()
          const stageIndex = Math.floor((currentTime / 2000) % mockStages.length)
          const progress = ((stageIndex + 1) / mockStages.length) * 100
          
          return new Response(JSON.stringify({
            stage: mockStages[stageIndex],
            progress: progress,
            message: `${mockStages[stageIndex]}を実行中...`,
            estimatedTimeRemaining: Math.max(0, (mockStages.length - stageIndex - 1) * 30)
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        if (typeof url === 'string' && url.includes('/api/diagnosis/start')) {
          return new Response(JSON.stringify({
            diagnosisId: 'test-e2e-123',
            status: 'started',
            progressUrl: '/api/diagnosis/test-e2e-123/progress',
            resultUrl: '/api/diagnosis/test-e2e-123/result',
            estimatedDuration: 300
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        return originalFetch(url, options)
      }
    })
  })

  test('診断進捗ページにアクセスできる', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    await expect(page).toHaveTitle(/LLMO/)
    await expect(page.locator('h1')).toContainText('LLMO診断進行状況')
  })

  test('診断IDが表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-e2e-abc/progress')
    
    await expect(page.locator('text=診断ID:')).toBeVisible()
    await expect(page.locator('text=test-e2e-')).toBeVisible()
  })

  test('進捗バーが表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 進捗バーの存在確認
    await expect(page.locator('[role="progressbar"], .bg-gray-200')).toBeVisible()
    
    // 進捗パーセンテージの表示確認
    await expect(page.locator('text=進捗')).toBeVisible()
  })

  test('診断段階が表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 段階表示の確認
    await expect(page.locator('text=診断進行状況')).toBeVisible()
    await expect(page.locator('text=ステップ')).toBeVisible()
  })

  test('リアルタイム更新インジケーターが表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // リアルタイム更新の表示を待機
    await expect(page.locator('text=リアルタイム更新中')).toBeVisible({ timeout: 10000 })
    
    // アニメーションドット（ポーリング中のインジケーター）の確認
    const pollingIndicator = page.locator('.animate-pulse')
    await expect(pollingIndicator).toBeVisible()
  })

  test('中止ボタンが機能する', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 中止ボタンの存在確認
    const cancelButton = page.locator('button:has-text("中止"), button:has-text("診断を中止")')
    await expect(cancelButton).toBeVisible()
    
    // 中止ボタンをクリック
    await cancelButton.click()
    
    // ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL('/')
  })

  test('ホームボタンが機能する', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // ホームに戻るボタンの確認
    const homeButton = page.locator('button:has-text("ホームに戻る")')
    await expect(homeButton).toBeVisible()
    
    await homeButton.click()
    await expect(page).toHaveURL('/')
  })

  test('進捗が更新される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 最初の進捗状態を確認
    const initialProgress = page.locator('text=初期化中, text=initializing')
    await expect(initialProgress.first()).toBeVisible({ timeout: 5000 })
    
    // 進捗の更新を待機（2秒間隔のポーリング）
    await page.waitForTimeout(3000)
    
    // より高い進捗状態に更新されることを確認
    const updatedProgress = page.locator('text=コンテンツ取得中, text=fetching_content, text=解析中, text=分析中')
    await expect(updatedProgress.first()).toBeVisible({ timeout: 5000 })
  })

  test('経過時間が表示され更新される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 経過時間の表示確認
    await expect(page.locator('text=経過時間')).toBeVisible()
    
    // 時間の形式確認（MM:SS）
    const timeDisplay = page.locator('text=/\\d+:\\d{2}/')
    await expect(timeDisplay).toBeVisible()
    
    // 時間が更新されることを確認
    const initialTime = await timeDisplay.textContent()
    await page.waitForTimeout(2000)
    const updatedTime = await timeDisplay.textContent()
    
    // 時間が進んでいることを確認（完全に同じでないことを確認）
    expect(updatedTime).not.toBe(initialTime)
  })

  test('推定残り時間が表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 残り時間の表示を待機
    await expect(page.locator('text=残り時間, text=残り約')).toBeVisible({ timeout: 5000 })
  })

  test('診断についての説明セクションが表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // 診断についてのセクション確認
    await expect(page.locator('text=診断について')).toBeVisible()
    
    // LLMO説明文の確認
    await expect(page.locator('text=LLMO（Large Language Model Optimization）診断')).toBeVisible()
    
    // 分析項目のリスト確認
    await expect(page.locator('text=HTML構造とメタデータ')).toBeVisible()
    await expect(page.locator('text=E-E-A-T')).toBeVisible()
  })

  test('よくある質問セクションが表示される', async ({ page }) => {
    await page.goto('/diagnosis/test-123/progress')
    
    // FAQセクションの確認
    await expect(page.locator('text=よくある質問')).toBeVisible()
    
    // FAQ項目の確認
    await expect(page.locator('text=診断にはどのくらい時間がかかりますか？')).toBeVisible()
    await expect(page.locator('text=診断中にページを閉じても大丈夫ですか？')).toBeVisible()
  })

  test('完了状態への遷移', async ({ page }) => {
    // 完了状態をモックするために特別なIDを使用
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('/api/diagnosis/completed-123/progress')) {
          return new Response(JSON.stringify({
            stage: 'completed',
            progress: 100,
            message: '診断が完了しました',
            estimatedTimeRemaining: 0
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return originalFetch(url, options)
      }
    })

    await page.goto('/diagnosis/completed-123/progress')
    
    // 完了状態の確認
    await expect(page.locator('text=診断完了')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=診断が正常に完了しました')).toBeVisible()
    
    // 進捗が100%であることを確認
    await expect(page.locator('text=100.0%')).toBeVisible()
  })

  test('エラー状態の表示', async ({ page }) => {
    // エラー状態をモックするために特別なIDを使用
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('/api/diagnosis/error-123/progress')) {
          return new Response(JSON.stringify({
            stage: 'error',
            progress: 0,
            message: 'ネットワークエラーが発生しました',
            estimatedTimeRemaining: null,
            error: 'Connection timeout'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return originalFetch(url, options)
      }
    })

    await page.goto('/diagnosis/error-123/progress')
    
    // エラー状態の確認
    await expect(page.locator('text=診断エラー')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=診断中にエラーが発生しました')).toBeVisible()
    await expect(page.locator('text=Connection timeout')).toBeVisible()
    
    // 再試行ボタンの確認
    await expect(page.locator('button:has-text("再試行")')).toBeVisible()
  })

  test('無効な診断IDでエラー表示', async ({ page }) => {
    await page.goto('/diagnosis//progress') // 空のID
    
    // エラーメッセージの確認
    await expect(page.locator('text=診断IDが見つかりません')).toBeVisible()
    await expect(page.locator('button:has-text("ホームに戻る")')).toBeVisible()
  })
})