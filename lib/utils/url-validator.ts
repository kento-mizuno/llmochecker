import { UrlValidationResult } from '@/types/analysis'

/**
 * URLバリデーションと正規化
 */
export class UrlValidator {
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:']
  private static readonly MAX_URL_LENGTH = 2083
  private static readonly BLOCKED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1'
  ]

  /**
   * URLを検証し正規化する
   */
  static validate(inputUrl: string): UrlValidationResult {
    const result: UrlValidationResult = {
      isValid: false,
      normalizedUrl: '',
      errors: [],
      warnings: []
    }

    try {
      // 基本的な形式チェック
      if (!inputUrl || typeof inputUrl !== 'string') {
        result.errors.push('URLが入力されていません')
        return result
      }

      // 長さチェック
      if (inputUrl.length > this.MAX_URL_LENGTH) {
        result.errors.push(`URLが長すぎます（最大${this.MAX_URL_LENGTH}文字）`)
        return result
      }

      // プロトコルの補完
      let normalizedUrl = inputUrl.trim()
      if (!/^https?:\/\//.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`
      }

      // URL形式の検証
      const url = new URL(normalizedUrl)
      
      // プロトコルチェック
      if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
        result.errors.push(`サポートされていないプロトコルです: ${url.protocol}`)
        return result
      }

      // ドメインチェック
      if (this.BLOCKED_DOMAINS.includes(url.hostname)) {
        result.errors.push('ローカルホストは分析できません')
        return result
      }

      // IPアドレスチェック
      if (this.isIpAddress(url.hostname)) {
        result.warnings.push('IPアドレスが指定されています。ドメイン名の使用を推奨します')
      }

      // HTTPSチェック
      if (url.protocol === 'http:') {
        result.warnings.push('HTTPSの使用を推奨します')
      }

      // 正規化処理
      result.normalizedUrl = this.normalizeUrl(url)
      result.isValid = true

    } catch (error) {
      if (error instanceof TypeError) {
        result.errors.push('無効なURL形式です')
      } else {
        result.errors.push(`URL解析エラー: ${error}`)
      }
    }

    return result
  }

  /**
   * URLを正規化する
   */
  private static normalizeUrl(url: URL): string {
    // パスの正規化
    if (url.pathname === '/') {
      url.pathname = ''
    }

    // クエリパラメータの並び替え（一貫性のため）
    if (url.search) {
      const params = new URLSearchParams(url.search)
      const sortedParams = new URLSearchParams()
      Array.from(params.keys()).sort().forEach(key => {
        params.getAll(key).forEach(value => sortedParams.append(key, value))
      })
      url.search = sortedParams.toString()
    }

    // フラグメント除去
    url.hash = ''

    return url.toString()
  }

  /**
   * IPアドレスかどうかを判定
   */
  private static isIpAddress(hostname: string): boolean {
    // IPv4の簡易チェック
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipv4Regex.test(hostname)) {
      return hostname.split('.').every(part => {
        const num = parseInt(part, 10)
        return num >= 0 && num <= 255
      })
    }

    // IPv6の簡易チェック
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv6Regex.test(hostname)
  }

  /**
   * 複数のURLを一括検証
   */
  static validateBatch(urls: string[]): UrlValidationResult[] {
    return urls.map(url => this.validate(url))
  }
}