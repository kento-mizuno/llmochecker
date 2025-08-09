import puppeteer, { Browser, Page } from 'puppeteer'
import { CrawlOptions, TechnicalSignals } from '@/types/analysis'

/**
 * Puppeteerを使用したWebクローリング
 */
export class WebCrawler {
  private browser: Browser | null = null
  private readonly defaultOptions: CrawlOptions = {
    timeout: 30000,
    waitUntil: 'networkidle2',
    userAgent: 'Mozilla/5.0 (compatible; LLMO-Checker/1.0; +https://dailyup.co.jp/llmochecker)',
    viewport: {
      width: 1920,
      height: 1080
    }
  }

  /**
   * ブラウザを初期化
   */
  async init(): Promise<void> {
    if (this.browser) return

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
  }

  /**
   * URLからページデータを取得
   */
  async crawlPage(url: string, options: Partial<CrawlOptions> = {}): Promise<CrawlResult> {
    await this.init()
    if (!this.browser) throw new Error('ブラウザの初期化に失敗しました')

    const mergedOptions = { ...this.defaultOptions, ...options }
    const page = await this.browser.newPage()

    try {
      // ユーザーエージェントとビューポートの設定
      await page.setUserAgent(mergedOptions.userAgent || this.defaultOptions.userAgent!)
      if (mergedOptions.viewport) {
        await page.setViewport(mergedOptions.viewport)
      }

      // ページ読み込み開始時間を記録
      const startTime = Date.now()
      
      // ページへアクセス
      const response = await page.goto(url, {
        timeout: mergedOptions.timeout,
        waitUntil: mergedOptions.waitUntil
      })

      if (!response) {
        throw new Error('ページの読み込みに失敗しました')
      }

      const loadTime = Date.now() - startTime

      // HTMLコンテンツの取得
      const html = await page.content()
      
      // ページサイズの計算
      const pageSize = Buffer.byteLength(html, 'utf8')

      // 技術的シグナルの検出
      const technicalSignals = await this.detectTechnicalSignals(page, url)
      technicalSignals.loadTime = loadTime
      technicalSignals.pageSize = pageSize
      technicalSignals.responseCode = response.status()

      // スクリーンショット（オプション）
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        encoding: 'base64'
      })

      return {
        url,
        html,
        technicalSignals,
        screenshot: `data:image/png;base64,${screenshot}`,
        timestamp: new Date()
      }

    } catch (error) {
      throw new Error(`ページクローリングエラー: ${error}`)
    } finally {
      await page.close()
    }
  }

  /**
   * 技術的シグナルを検出
   */
  private async detectTechnicalSignals(page: Page, url: string): Promise<TechnicalSignals> {
    const signals: TechnicalSignals = {
      hasRobotsTxt: false,
      hasSitemap: false,
      hasStructuredData: false,
      hasHreflang: false,
      hasCanonical: false,
      isHttps: false,
      hasViewport: false,
      loadTime: 0,
      pageSize: 0,
      responseCode: 0
    }

    try {
      // HTTPSチェック
      signals.isHttps = url.startsWith('https://')

      // メタタグの検証
      const metaTags = await page.evaluate(() => {
        const metas = Array.from(document.querySelectorAll('meta'))
        return metas.map(meta => ({
          name: meta.getAttribute('name') || meta.getAttribute('property') || '',
          content: meta.getAttribute('content') || '',
          httpEquiv: meta.getAttribute('http-equiv') || ''
        }))
      })

      // ビューポートの検出
      signals.hasViewport = metaTags.some(meta => 
        meta.name === 'viewport' && meta.content.length > 0
      )

      // Canonicalリンクの検出
      signals.hasCanonical = await page.evaluate(() => {
        const canonical = document.querySelector('link[rel="canonical"]')
        return canonical !== null
      })

      // hreflangの検出
      signals.hasHreflang = await page.evaluate(() => {
        const hreflang = document.querySelector('link[hreflang]')
        return hreflang !== null
      })

      // 構造化データの検出
      signals.hasStructuredData = await page.evaluate(() => {
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]')
        const microdata = document.querySelectorAll('[itemscope]')
        return jsonLd.length > 0 || microdata.length > 0
      })

      // robots.txtとサイトマップの存在確認
      await this.checkExternalResources(url, signals)

    } catch (error) {
      console.warn('技術的シグナル検出中にエラー:', error)
    }

    return signals
  }

  /**
   * robots.txtとサイトマップの存在確認
   */
  private async checkExternalResources(url: string, signals: TechnicalSignals): Promise<void> {
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    try {
      // robots.txtの確認
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`)
      signals.hasRobotsTxt = robotsResponse.ok

      // sitemap.xmlの確認
      const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
      signals.hasSitemap = sitemapResponse.ok
    } catch (error) {
      console.warn('外部リソース確認エラー:', error)
    }
  }

  /**
   * ブラウザを終了
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

export interface CrawlResult {
  url: string
  html: string
  technicalSignals: TechnicalSignals
  screenshot: string
  timestamp: Date
}