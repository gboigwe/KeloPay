// SimpleLineChart Component
// Lightweight line chart using SVG (no external dependencies)

'use client'

import { formatChartDate } from '@/lib/utils/formatting'

interface DataPoint {
  timestamp: number
  date: string
  value: number
}

interface SimpleLineChartProps {
  data: DataPoint[]
  title?: string
  height?: number
  color?: string
  showGrid?: boolean
}

export default function SimpleLineChart({
  data,
  title,
  height = 300,
  color = '#3b82f6', // blue-500
  showGrid = true,
}: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">No data available</p>
      </div>
    )
  }

  const padding = 40
  const width = 800
  const chartHeight = height - padding * 2
  const chartWidth = width - padding * 2

  const values = data.map(d => d.value)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const valueRange = maxValue - minValue || 1

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((d.value - minValue) / valueRange) * chartHeight
    return { x, y, ...d }
  })

  // Create path string for the line
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create path for the area under the line
  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${height - padding}
    L ${padding} ${height - padding}
    Z
  `

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={title || 'Line chart'}
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="opacity-20">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding + chartHeight - ratio * chartHeight
                return (
                  <line
                    key={i}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#6b7280"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                )
              })}
            </g>
          )}

          {/* Area under the line */}
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />

          {/* The line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={color}
                className="cursor-pointer hover:r-6 transition-all"
              />
              <title>{`${p.date}: ${p.value.toLocaleString()}`}</title>
            </g>
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = padding + chartHeight - ratio * chartHeight
            const value = minValue + ratio * valueRange
            return (
              <text
                key={i}
                x={padding - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-400"
              >
                {value.toFixed(0)}
              </text>
            )
          })}

          {/* X-axis labels (show first, middle, last) */}
          {[0, Math.floor(points.length / 2), points.length - 1].map(i => {
            const p = points[i]
            if (!p) return null
            return (
              <text
                key={i}
                x={p.x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {p.date}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-400">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: color }}
          />
          <span>Value</span>
        </div>
      </div>
    </div>
  )
}
