'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoreData {
  category: string
  current: number
  average: number
  fullMark: number
}

interface ScoreRadarChartProps {
  data: ScoreData[]
  title?: string
  description?: string
  className?: string
}

export function ScoreRadarChart({ 
  data, 
  title = "カテゴリ別スコア", 
  description = "各カテゴリの評価と平均値の比較",
  className 
}: ScoreRadarChartProps) {
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
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis 
              dataKey="category" 
              className="text-sm"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              className="text-xs"
            />
            <Radar
              name="あなたのスコア"
              dataKey="current"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Radar
              name="平均スコア"
              dataKey="average"
              stroke="#64748b"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}