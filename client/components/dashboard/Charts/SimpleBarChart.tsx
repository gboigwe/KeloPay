// SimpleBarChart Component
// Lightweight bar chart using CSS (no external dependencies)

'use client'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: DataPoint[]
  title?: string
  height?: number
  showValues?: boolean
}

export default function SimpleBarChart({
  data,
  title,
  height = 200,
  showValues = true,
}: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      )}

      <div className="space-y-4" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          const barColor = item.color || 'bg-blue-500'

          return (
            <div key={index} className="flex items-center space-x-3">
              {/* Label */}
              <div className="w-24 text-sm text-gray-400 text-right flex-shrink-0">
                {item.label}
              </div>

              {/* Bar */}
              <div className="flex-1 h-8 bg-gray-700 rounded overflow-hidden relative">
                <div
                  className={`h-full ${barColor} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  aria-label={`${item.label}: ${item.value}`}
                />
              </div>

              {/* Value */}
              {showValues && (
                <div className="w-20 text-sm font-medium text-white text-right flex-shrink-0">
                  {item.value.toLocaleString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
