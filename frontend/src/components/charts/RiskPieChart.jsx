import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#b91c1c',
};

const LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2 text-sm">
      <p className="font-semibold" style={{ color: COLORS[payload[0].name] }}>
        {LABELS[payload[0].name] || payload[0].name} Risk
      </p>
      <p className="text-gray-700">{payload[0].value} zones</p>
    </div>
  );
};

export default function RiskPieChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.risk_level,
    value: parseInt(d.count),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="50%"
          innerRadius={55} outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] || '#6b7280'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(val) => <span className="text-xs text-gray-600">{LABELS[val] || val}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
