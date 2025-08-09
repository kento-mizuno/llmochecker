import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  title?: string
  message?: string
  type?: 'error' | 'warning' | 'info'
  onRetry?: () => void
  onGoHome?: () => void
  showReport?: boolean
  className?: string
}

const typeVariants = {
  error: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    borderColor: 'border-yellow-200', 
    bgColor: 'bg-yellow-50'
  },
  info: {
    icon: AlertTriangle,
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50'
  }
}

export function ErrorDisplay({
  title = 'エラーが発生しました',
  message = '申し訳ございません。予期しないエラーが発生しました。',
  type = 'error',
  onRetry,
  onGoHome,
  showReport = true,
  className
}: ErrorDisplayProps) {
  const variant = typeVariants[type]
  const Icon = variant.icon

  return (
    <Card className={cn('w-full max-w-md mx-auto', variant.borderColor, className)}>
      <CardHeader className="text-center">
        <div className={cn('mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4', variant.bgColor)}>
          <Icon className={cn('h-6 w-6', variant.iconColor)} />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">
          {message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              再試行
            </Button>
          )}
          
          {onGoHome && (
            <Button
              onClick={onGoHome}
              className="flex-1"
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              ホームに戻る
            </Button>
          )}
        </div>

        {showReport && (
          <div className="pt-4 border-t text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                // TODO: エラーレポート機能
                console.log('Error report requested')
              }}
            >
              <Bug className="h-3 w-3 mr-1" />
              問題を報告する
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error, retry: () => void }>
}) {
  // 簡易的なエラーバウンダリ（実際のプロジェクトではreact-error-boundaryを使用推奨）
  return <>{children}</>
}

export function InlineError({ 
  message, 
  className 
}: { 
  message: string
  className?: string 
}) {
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3', className)}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="接続エラー"
      message="ネットワーク接続に問題があります。インターネット接続を確認して再試行してください。"
      type="warning"
      onRetry={onRetry}
    />
  )
}

export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorDisplay
      title="ページが見つかりません"
      message="お探しのページは存在しないか、移動された可能性があります。"
      type="info"
      onGoHome={onGoHome}
      showReport={false}
    />
  )
}