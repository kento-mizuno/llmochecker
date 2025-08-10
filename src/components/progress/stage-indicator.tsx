'use client'

import { useMemo } from 'react'
import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { DiagnosisStage, DIAGNOSIS_STAGES, STAGE_DETAILS } from '../../../lib/stores/diagnosis-store'

interface StageIndicatorProps {
  currentStage: DiagnosisStage
  progress: number
  className?: string
  compact?: boolean
}

export function StageIndicator({
  currentStage,
  progress,
  className,
  compact = false
}: StageIndicatorProps) {
  const stages = useMemo(() => {
    const stageKeys = Object.values(DIAGNOSIS_STAGES).filter(
      stage => stage !== DIAGNOSIS_STAGES.ERROR
    )
    
    return stageKeys.map(stage => {
      const isCompleted = getStageOrder(currentStage) > getStageOrder(stage)
      const isCurrent = currentStage === stage
      const isError = currentStage === DIAGNOSIS_STAGES.ERROR
      
      let status: 'pending' | 'current' | 'completed' | 'error' = 'pending'
      
      if (isError) {
        status = 'error'
      } else if (isCompleted) {
        status = 'completed'
      } else if (isCurrent) {
        status = 'current'
      }
      
      return {
        key: stage,
        ...STAGE_DETAILS[stage],
        status,
        order: getStageOrder(stage)
      }
    }).sort((a, b) => a.order - b.order)
  }, [currentStage])

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <StageIcon stage={currentStage} />
        <div className="flex-1">
          <div className="text-sm font-medium">
            {STAGE_DETAILS[currentStage]?.name || '不明'}
          </div>
          <div className="text-xs text-gray-500">
            {STAGE_DETAILS[currentStage]?.description || '処理中...'}
          </div>
        </div>
        <div className="text-xs font-medium text-gray-600">
          {getStageOrder(currentStage)}/{Object.keys(STAGE_DETAILS).length - 2}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">診断進行状況</h3>
        <div className="text-sm text-gray-500">
          ステップ {getStageOrder(currentStage)}/{stages.length}
        </div>
      </div>
      
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1
          
          return (
            <div key={stage.key} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <StageIcon stage={stage.key as DiagnosisStage} status={stage.status} />
                {!isLast && (
                  <div className={cn(
                    'w-px h-8 mt-2',
                    stage.status === 'completed' 
                      ? 'bg-green-300' 
                      : stage.status === 'error'
                      ? 'bg-red-300'
                      : 'bg-gray-300'
                  )} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-sm font-medium',
                  stage.status === 'completed' && 'text-green-700',
                  stage.status === 'current' && 'text-blue-700',
                  stage.status === 'error' && 'text-red-700',
                  stage.status === 'pending' && 'text-gray-500'
                )}>
                  {stage.name}
                </div>
                <div className={cn(
                  'text-xs mt-1',
                  stage.status === 'completed' && 'text-green-600',
                  stage.status === 'current' && 'text-blue-600',
                  stage.status === 'error' && 'text-red-600',
                  stage.status === 'pending' && 'text-gray-400'
                )}>
                  {stage.description}
                </div>
                
                {stage.status === 'current' && progress > 0 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface StageIconProps {
  stage: DiagnosisStage
  status?: 'pending' | 'current' | 'completed' | 'error'
}

function StageIcon({ stage, status }: StageIconProps) {
  const actualStatus = status || getStatusFromStage(stage)
  
  switch (actualStatus) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'current':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'pending':
    default:
      return <Circle className="w-5 h-5 text-gray-400" />
  }
}

function getStageOrder(stage: DiagnosisStage): number {
  const order = {
    [DIAGNOSIS_STAGES.INITIALIZING]: 1,
    [DIAGNOSIS_STAGES.FETCHING_CONTENT]: 2,
    [DIAGNOSIS_STAGES.PARSING_HTML]: 3,
    [DIAGNOSIS_STAGES.ANALYZING_CONTENT]: 4,
    [DIAGNOSIS_STAGES.EVALUATING_METRICS]: 5,
    [DIAGNOSIS_STAGES.GENERATING_IMPROVEMENTS]: 6,
    [DIAGNOSIS_STAGES.SAVING_RESULTS]: 7,
    [DIAGNOSIS_STAGES.COMPLETED]: 8,
    [DIAGNOSIS_STAGES.ERROR]: 0
  }
  
  return order[stage] || 0
}

function getStatusFromStage(stage: DiagnosisStage): 'pending' | 'current' | 'completed' | 'error' {
  switch (stage) {
    case DIAGNOSIS_STAGES.COMPLETED:
      return 'completed'
    case DIAGNOSIS_STAGES.ERROR:
      return 'error'
    default:
      return 'current'
  }
}