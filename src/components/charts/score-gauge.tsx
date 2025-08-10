'use client'

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoreGaugeProps {
  score: number
  maxScore?: number
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  showGrade?: boolean
  className?: string
}

// スコアからグレードを計算
const getGrade = (percentage: number): string => {
  if (percentage >= 95) return 'A+'
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C+'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D+'
  if (percentage >= 30) return 'D'
  return 'F'
}

// パーセンテージから色を取得
const getColor = (percentage: number): string => {
  if (percentage >= 80) return '#10b981' // green-500
  if (percentage >= 60) return '#f59e0b' // amber-500
  if (percentage >= 40) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

// サイズ設定
const sizeConfig = {
  sm: { height: 150, fontSize: 'text-lg', titleSize: 'text-base' },
  md: { height: 200, fontSize: 'text-2xl', titleSize: 'text-lg' },
  lg: { height: 250, fontSize: 'text-3xl', titleSize: 'text-xl' }
}

export function ScoreGauge({ 
  score, 
  maxScore = 100, 
  title = "総合スコア",
  description,
  size = 'md',
  showGrade = true,
  className 
}: ScoreGaugeProps) {
  const percentage = Math.round((score / maxScore) * 100)
  const grade = getGrade(percentage)
  const color = getColor(percentage)
  const config = sizeConfig[size]
  
  // 半円ゲージのデータ
  const data = [
    { name: 'score', value: percentage, fill: color },
    { name: 'remaining', value: 100 - percentage, fill: '#f1f5f9' }
  ]

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className={config.titleSize}>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative">
          <ResponsiveContainer width={200} height={config.height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* 中央のスコア表示 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold ${config.fontSize}`} style={{ color }}>
              {percentage}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
            {showGrade && (
              <div 
                className="text-lg font-semibold mt-1 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: color + '20',
                  color: color
                }}
              >
                {grade}
              </div>
            )}
          </div>
        </div>
        
        {/* スコア説明 */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            {score} / {maxScore} ポイント
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {percentage >= 80 && "優秀なスコアです！"}
            {percentage >= 60 && percentage < 80 && "良好なスコアです"}
            {percentage >= 40 && percentage < 60 && "改善の余地があります"}
            {percentage < 40 && "大幅な改善が必要です"}
          </div>
        </div>
        
        {/* グレード説明 */}
        {showGrade && (
          <div className="mt-4 text-center">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded"></div>
                <span>A: 80+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded"></div>
                <span>B: 60+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span>C-F: 60未満</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}