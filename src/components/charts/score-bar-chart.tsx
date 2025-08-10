'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CategoryScore {
  name: string
  score: number
  maxScore: number
  color: string
}

interface ScoreBarChartProps {
  data: CategoryScore[]
  title?: string
  description?: string
  className?: string
}

// スコア範囲による色分け
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981' // green-500
  if (score >= 60) return '#f59e0b' // amber-500
  if (score >= 40) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

// カスタムツールチップ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-600">
          スコア: {data.score} / {data.maxScore} ({Math.round((data.score / data.maxScore) * 100)}%)
        </p>
      </div>
    )
  }
  return null
}

export function ScoreBarChart({ 
  data, 
  title = "カテゴリ別スコア詳細", 
  description = "各カテゴリの詳細スコア",
  className 
}: ScoreBarChartProps) {
  // データを加工して色を付ける
  const chartData = data.map(item => ({
    ...item,
    percentage: Math.round((item.score / item.maxScore) * 100),
    fill: getScoreColor((item.score / item.maxScore) * 100)
  }))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              className="text-sm"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, 100]}
              className="text-sm"
              label={{ value: 'スコア (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="percentage" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* 凡例 */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>優秀 (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>良好 (60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>改善要 (40-59%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>要注意 (0-39%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}