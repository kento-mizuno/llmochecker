import * as cheerio from 'cheerio'
import { MetaData, ContentAnalysis, HeadingStructure, ImageAnalysis } from '@/types/analysis'

/**
 * HTML解析とメタデータ抽出
 */
export class HtmlParser {
  private $: cheerio.CheerioAPI

  constructor(html: string) {
    this.$ = cheerio.load(html)
  }

  /**
   * メタデータを抽出
   */
  extractMetadata(): MetaData {
    const $ = this.$
    const metadata: MetaData = {}

    // 基本的なメタタグ
    metadata.title = $('title').text().trim() || undefined
    metadata.description = $('meta[name="description"]').attr('content') || undefined
    metadata.keywords = $('meta[name="keywords"]').attr('content') || undefined
    metadata.author = $('meta[name="author"]').attr('content') || undefined
    metadata.viewport = $('meta[name="viewport"]').attr('content') || undefined
    metadata.charset = $('meta[charset]').attr('charset') || 
                      $('meta[http-equiv="content-type"]').attr('content') || undefined
    metadata.robots = $('meta[name="robots"]').attr('content') || undefined

    // Canonicalリンク
    metadata.canonical = $('link[rel="canonical"]').attr('href') || undefined

    // Open Graph
    metadata.ogTitle = $('meta[property="og:title"]').attr('content') || undefined
    metadata.ogDescription = $('meta[property="og:description"]').attr('content') || undefined
    metadata.ogImage = $('meta[property="og:image"]').attr('content') || undefined
    metadata.ogType = $('meta[property="og:type"]').attr('content') || undefined

    // Twitter Card
    metadata.twitterCard = $('meta[name="twitter:card"]').attr('content') || undefined
    metadata.twitterTitle = $('meta[name="twitter:title"]').attr('content') || undefined
    metadata.twitterDescription = $('meta[name="twitter:description"]').attr('content') || undefined
    metadata.twitterImage = $('meta[name="twitter:image"]').attr('content') || undefined

    return metadata
  }

  /**
   * コンテンツ分析を実行
   */
  analyzeContent(): ContentAnalysis {
    const $ = this.$

    // テキストコンテンツの取得
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length

    // 見出し構造の分析
    const headingStructure = this.analyzeHeadingStructure()

    // リンクの分析
    const { internalLinks, externalLinks } = this.analyzeLinks()

    // 画像の分析
    const images = this.analyzeImages()

    // リストとテーブルの分析
    const listsCount = $('ul, ol').length
    const tablesCount = $('table').length

    // 連絡先情報の検出
    const hasContactInfo = this.detectContactInfo()
    const hasAddressInfo = this.detectAddressInfo()

    return {
      wordCount,
      headingStructure,
      internalLinks,
      externalLinks,
      images,
      listsCount,
      tablesCount,
      hasContactInfo,
      hasAddressInfo
    }
  }

  /**
   * 見出し構造を分析
   */
  private analyzeHeadingStructure(): HeadingStructure {
    const $ = this.$
    const structure: HeadingStructure = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
      structure: []
    }

    // 各レベルの見出し数をカウント
    for (let i = 1; i <= 6; i++) {
      const count = $(`h${i}`).length
      structure[`h${i}` as keyof HeadingStructure] = count
    }

    // 見出し階層構造を取得
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const tagName = element.name
      const text = $(element).text().trim()
      if (text) {
        structure.structure.push(`${tagName.toUpperCase()}: ${text}`)
      }
    })

    return structure
  }

  /**
   * リンクを分析
   */
  private analyzeLinks(): { internalLinks: number; externalLinks: number } {
    const $ = this.$
    let internalLinks = 0
    let externalLinks = 0

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (!href) return

      if (href.startsWith('http://') || href.startsWith('https://')) {
        externalLinks++
      } else if (href.startsWith('/') || href.startsWith('#') || !href.includes('://')) {
        internalLinks++
      }
    })

    return { internalLinks, externalLinks }
  }

  /**
   * 画像を分析
   */
  private analyzeImages(): ImageAnalysis {
    const $ = this.$
    const images = $('img')
    
    let withAlt = 0
    let withTitle = 0
    let optimized = 0

    images.each((_, element) => {
      const $img = $(element)
      const alt = $img.attr('alt')
      const title = $img.attr('title')
      const src = $img.attr('src')

      // alt属性の確認
      if (alt && alt.trim().length > 0) {
        withAlt++
      }

      // title属性の確認
      if (title && title.trim().length > 0) {
        withTitle++
      }

      // 最適化の確認（WebP, 遅延読み込みなど）
      if (src && (src.includes('.webp') || $img.attr('loading') === 'lazy')) {
        optimized++
      }
    })

    return {
      total: images.length,
      withAlt,
      withTitle,
      optimized
    }
  }

  /**
   * 連絡先情報を検出
   */
  private detectContactInfo(): boolean {
    const $ = this.$
    const text = $('body').text().toLowerCase()
    
    const contactPatterns = [
      /contact/,
      /連絡/,
      /お問い?合わせ/,
      /電話/,
      /tel[:：]/,
      /email/,
      /メール/,
      /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    ]

    return contactPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 住所情報を検出
   */
  private detectAddressInfo(): boolean {
    const $ = this.$
    const text = $('body').text()
    
    const addressPatterns = [
      /〒\d{3}-?\d{4}/,  // 郵便番号
      /[都道府県市区町村]/,
      /address/i,
      /住所/,
      /所在地/
    ]

    return addressPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 構造化データを抽出
   */
  extractStructuredData(): any[] {
    const $ = this.$
    const structuredData: any[] = []

    // JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).html()
        if (jsonText) {
          const data = JSON.parse(jsonText)
          structuredData.push(data)
        }
      } catch (error) {
        console.warn('JSON-LD解析エラー:', error)
      }
    })

    return structuredData
  }

  /**
   * パフォーマンス関連の要素を検出
   */
  detectPerformanceElements(): {
    hasLazyLoading: boolean
    hasCriticalCSS: boolean
    hasPreloadLinks: boolean
    hasServiceWorker: boolean
  } {
    const $ = this.$

    return {
      hasLazyLoading: $('img[loading="lazy"], iframe[loading="lazy"]').length > 0,
      hasCriticalCSS: $('style').length > 0,
      hasPreloadLinks: $('link[rel="preload"]').length > 0,
      hasServiceWorker: $('script').text().includes('serviceWorker') ||
                       $('script').text().includes('sw.js')
    }
  }
}