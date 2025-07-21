'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartProps {
  data: Record<string, number> // e.g., { joy: 0.6, anticipation: 0.4 }
  title: string
  colorMap: Record<string, string> // e.g., { joy: 'bg-yellow-400' }
}

const PieChartComponent = ({ data, title, colorMap }: ChartProps) => {
  // 1. Filter out very small slices (e.g., less than 0.01% of the total)
  //    and prepare data for Recharts, ensuring names are capitalized.
  const chartData = Object.entries(data)
    .filter(([, value]) => value * 100 > 0.01) // Filter out values contributing less than 0.01%
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize the first letter of the name
      value: parseFloat((value * 100).toFixed(2)), // Convert to percentage, fix to 2 decimal places
    }))

  // 2. If no data remains after filtering, display a message instead of an empty chart.
  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg mt-6 shadow-md text-center text-gray-400">
        <h3 className="text-lg font-semibold mb-2 text-yellow-400">{title}</h3>
        <p className="mt-4">No significant data to display for this chart.</p>
      </div>
    )
  }

  // 3. Generate an array of colors corresponding to the formattedData.
  //    Uses the colorMap, falling back to a distinct default if a color is not found.
  const COLORS = chartData.map((entry) => {
    // Attempt to match the name (case-insensitive) to the colorMap
    return colorMap[entry.name.toLowerCase()] || '#FF7F50'; // Fallback to a distinct orange if no color found
  })

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-6 shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-yellow-400">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value" // The key in chartData that represents the slice size
            nameKey="name"  // The key in chartData that represents the label/name
            cx="50%" // Center X position
            cy="50%" // Center Y position
            outerRadius={80} // Radius of the pie chart
            // Improved label: displays name and percentage directly on the slice
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false} // Hides the connecting lines from slices to labels for cleaner look
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          {/* Tooltip for hover information, formatted to show percentage */}
          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
          {/* Legend to show color-coded names at the bottom */}
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieChartComponent