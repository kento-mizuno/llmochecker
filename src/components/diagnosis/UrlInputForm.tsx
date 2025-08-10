'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, History, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/Form'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { storage } from '@/lib/utils'

// URL入力のスキーマ定義
const urlFormSchema = z.object({
  url: z
    .string()
    .min(1, 'URLを入力してください')
    .url('有効なURLを入力してください')
    .regex(
      /^https?:\/\/.+/,
      'http://またはhttps://で始まるURLを入力してください'
    )
    .transform(url => {
      // URL正規化処理
      try {
        const normalizedUrl = new URL(url)
        // トレーリングスラッシュを除去
        if (normalizedUrl.pathname === '/') {
          return normalizedUrl.origin
        }
        return normalizedUrl.href.replace(/\/$/, '')
      } catch {
        return url
      }
    })
})

type UrlFormData = z.infer<typeof urlFormSchema>

interface UrlInputFormProps {
  onSubmit: (url: string) => void
  isLoading?: boolean
  initialUrl?: string
}

export function UrlInputForm({ onSubmit, isLoading = false, initialUrl }: UrlInputFormProps) {
  const [urlHistory, setUrlHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: initialUrl || ''
    },
    mode: 'onChange' // リアルタイム検証を有効化
  })

  // 履歴の読み込み
  useEffect(() => {
    const history = storage.get('url_history', [])
    setUrlHistory(history.slice(0, 5)) // 最新5件のみ保持
  }, [])

  // リアルタイム入力検証の処理
  const watchedUrl = form.watch('url')
  useEffect(() => {
    if (!watchedUrl) {
      setValidationStatus('idle')
      return
    }

    const result = urlFormSchema.safeParse({ url: watchedUrl })
    setValidationStatus(result.success ? 'valid' : 'invalid')
  }, [watchedUrl])

  const handleSubmit = (data: UrlFormData) => {
    // 履歴に追加
    const newHistory = [data.url, ...urlHistory.filter(h => h !== data.url)].slice(0, 5)
    setUrlHistory(newHistory)
    storage.set('url_history', newHistory)
    
    onSubmit(data.url)
  }

  const handleHistorySelect = (url: string) => {
    form.setValue('url', url)
    setShowHistory(false)
  }

  const handleHistoryRemove = (urlToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newHistory = urlHistory.filter(url => url !== urlToRemove)
    setUrlHistory(newHistory)
    storage.set('url_history', newHistory)
  }

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Globe className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* タイトル */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">診断するサイトのURLを入力</h2>
          <p className="text-muted-foreground">
            https://example.com の形式でウェブサイトのURLを入力してください
          </p>
        </div>

        {/* URL入力フィールド */}
        <FormField>
          <FormLabel htmlFor="url" required>
            ウェブサイトURL
          </FormLabel>
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">
              {getValidationIcon()}
            </div>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              className="pl-12 pr-12 text-lg"
              error={form.formState.errors.url?.message}
              {...form.register('url')}
              disabled={isLoading}
              autoComplete="url"
              autoFocus
            />
            {/* 履歴ボタン */}
            {urlHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded p-1"
                disabled={isLoading}
                aria-label="URL履歴を表示"
              >
                <History className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* リアルタイムステータス */}
          {validationStatus === 'valid' && !form.formState.errors.url && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>有効なURLです</span>
            </div>
          )}
        </FormField>

        {/* URL履歴ドロップダウン */}
        {showHistory && urlHistory.length > 0 && (
          <div className="relative">
            <div className="absolute top-2 left-0 w-full bg-background border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">診断履歴</span>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-muted-foreground hover:text-foreground focus-ring rounded p-1"
                    aria-label="履歴を閉じる"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="py-2">
                {urlHistory.map((historyUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleHistorySelect(historyUrl)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{historyUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleHistoryRemove(historyUrl, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all focus-ring rounded p-1"
                      aria-label="履歴から削除"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full llmo-gradient text-white hover:opacity-90"
          disabled={isLoading || !form.formState.isValid || validationStatus !== 'valid'}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>診断を開始しています...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>無料診断を開始</span>
            </div>
          )}
        </Button>

        {/* フォームのバリデーションエラー表示 */}
        {form.formState.errors.url && (
          <FormMessage type="error">
            {form.formState.errors.url.message}
          </FormMessage>
        )}

        {/* 注意事項 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>※ 診断は完全無料です。入力されたデータは保存されません。</p>
          <p>※ 診断には2-3分程度かかります。</p>
        </div>
      </Form>
    </div>
  )
}