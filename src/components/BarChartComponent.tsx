// src/components/BarChartComponent.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartProps {
  data: Record<string, number> // e.g., { toxic: 0.1, insult: 0.05 }
  title: string
  colorMap: Record<string, string> // e.g., { toxic: '#DC2626' }
}

const BarChartComponent = ({ data, title, colorMap }: ChartProps) => {
  // Prepare data for a multi-bar chart: each entry is a category and its score.
  // We'll create a single data point for the BarChart,
  // and then create multiple <Bar> components, one for each toxicity type.
  // Or, a simpler way is to transform data to: [{ name: 'toxicity', score: X}, {name: 'insult', score: Y}]
  // And then use a single <Bar dataKey="score" /> with custom XAxis for names.
  // Let's use the latter approach which is common for "breakdown" type bar charts.

  const barData = Object.entries(data)
    .filter(([, value]) => value * 100 >= 0.01) // Filter out very small values for visual clarity
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1), // Format names
      score: parseFloat((value * 100).toFixed(2)), // Convert to percentage
    }));

  if (barData.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg mt-6 shadow-md text-center text-gray-400">
        <h3 className="text-lg font-semibold mb-2 text-yellow-400">{title}</h3>
        <p className="mt-4">No significant data to display for this chart.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-6 shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-yellow-400">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={barData} // Data for the chart
          margin={{
            top: 20, right: 30, left: 20, bottom: 5,
          }}
          layout="vertical" // Making it a horizontal bar chart often looks better for categories
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis
            type="number" // X-axis for score values
            stroke="#BBB"
            tick={{ fill: '#BBB', fontSize: 12 }}
            label={{ value: 'Percentage (%)', position: 'insideBottomRight', offset: -5, fill: '#BBB' }}
            domain={[0, 100]} // Ensure X-axis goes up to 100%
          />
          <YAxis
            type="category" // Y-axis for category names
            dataKey="name"
            stroke="#BBB"
            tick={{ fill: '#BBB', fontSize: 12 }}
            width={100} // Give some space for long labels
          />
          <Tooltip
            cursor={{ fill: '#444' }}
            contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#FFF' }}
            itemStyle={{ color: '#FFF' }}
            formatter={(value: number) => `${value.toFixed(2)}%`}
          />
          <Legend wrapperStyle={{ color: '#FFF', paddingTop: '10px' }} />

          {/* Single Bar component. The `fill` will be dynamically mapped. */}
          <Bar dataKey="score" name="Score" fill={(entry) => colorMap[entry.name.toLowerCase().replace(/\s/g, '_')] || '#8884d8'} />
          {/* Note: Recharts' Bar component can take a function for `fill` to color individual bars based on data.
             The `name` prop here will be used in the legend for this single Bar series.
             The `entry.name.toLowerCase().replace(/\s/g, '_')` converts "Identity Attack" to "identity_attack"
             to match keys in your toxicityColors map.
          */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;