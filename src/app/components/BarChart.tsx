'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  emotions: Record<string, number>;
}

export default function BarChart({ emotions }: Props) {
  const labels = Object.keys(emotions);
  const values = Object.values(emotions);

  const data = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: values,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return <Bar data={data} options={options} height={220} />;
}
