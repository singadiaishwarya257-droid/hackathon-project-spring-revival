import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">
        {label ? format(parseISO(label), 'dd MMM yyyy') : ''}
      </p>
      <p className="text-ocean-600">
        Rainfall: <strong>{parseFloat(payload[0]?.value || 0).toFixed(1)} mm</strong>
      </p>
    </div>
  );
};

export default function RainfallChart({ data = [], height = 220 }) {
  const formatted = data.map((d) => ({
    ...d,
    total_mm: parseFloat(d.total_mm || 0),
    label: d.date,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="rainfallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tickFormatter={(d) => { try { return format(parseISO(d), 'dd MMM'); } catch { return d; } }}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v}mm`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total_mm"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#rainfallGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
