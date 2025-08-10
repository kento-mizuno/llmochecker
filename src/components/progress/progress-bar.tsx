'use client'

import { cn } from '../../../lib/utils'

interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const variantClasses = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500'
}

export function ProgressBar({
  progress,
  className,
  showPercentage = true,
  animated = true,
  size = 'md',
  variant = 'default'
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">進捗</span>
          {animated && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
                   style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
                   style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
                   style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-900">
            {clampedProgress.toFixed(1)}%
          </span>
        )}
      </div>
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'transition-all duration-500 ease-out rounded-full',
            variantClasses[variant],
            animated && 'transition-all'
          )}
          style={{ 
            width: `${clampedProgress}%`,
            transition: animated ? 'width 0.5s ease-out' : 'none'
          }}
        />
      </div>
    </div>
  )
}