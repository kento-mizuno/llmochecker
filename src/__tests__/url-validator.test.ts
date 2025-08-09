import { describe, it, expect } from 'vitest'
import { UrlValidator } from '../../lib/utils/url-validator'

describe('UrlValidator', () => {
  describe('validate', () => {
    it('有効なHTTPS URLを正規化する', () => {
      const result = UrlValidator.validate('https://example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedUrl).toBe('https://example.com/')
      expect(result.errors).toHaveLength(0)
    })

    it('プロトコルなしのURLにHTTPSを補完する', () => {
      const result = UrlValidator.validate('example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedUrl).toBe('https://example.com/')
    })

    it('HTTP URLに警告を出す', () => {
      const result = UrlValidator.validate('http://example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('HTTPSの使用を推奨します')
    })

    it('無効なURLを拒否する', () => {
      const result = UrlValidator.validate('invalid url with spaces')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('ローカルホストを拒否する', () => {
      const result = UrlValidator.validate('localhost:3000')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ローカルホストは分析できません')
    })

    it('空のURLを拒否する', () => {
      const result = UrlValidator.validate('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('URLが入力されていません')
    })
  })
})