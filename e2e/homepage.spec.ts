import { test, expect } from '@playwright/test'

test.describe('ホームページ', () => {
  test('ページが正常に表示される', async ({ page }) => {
    await page.goto('/')
    
    // ページタイトルを確認
    await expect(page).toHaveTitle(/LLMO無料診断/)
    
    // メインコンテンツが表示されることを確認
    await expect(page.locator('body')).toBeVisible()
  })
  
  test('基本的なナビゲーション', async ({ page }) => {
    await page.goto('/')
    
    // ページが読み込まれることを確認
    await page.waitForLoadState('domcontentloaded')
  })
})