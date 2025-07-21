'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartProps {
  data: Record<string, number>
  title: string
  colorMap: Record<string, string>
}

const PieChartComponent = ({ data, title, colorMap }: ChartProps) => {
  const formattedData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value: parseFloat((value * 100).toFixed(2)),
  }))

  const COLORS = formattedData.map((entry) => colorMap[entry.name.toLowerCase()] || '#8884d8')

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-6 shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-yellow-400">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={formattedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieChartComponent
