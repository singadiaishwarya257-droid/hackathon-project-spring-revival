import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';

export default function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend, index = 0 }) {
  const colors = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-200' },
    ocean:   { bg: 'bg-ocean-100',   text: 'text-ocean-700',   border: 'border-ocean-200' },
    earth:   { bg: 'bg-earth-100',   text: 'text-earth-700',   border: 'border-earth-200' },
    red:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
    amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
    purple:  { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200' },
  };
  const c = colors[color] || colors.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="stat-card"
    >
      <div className={cn('stat-icon', c.bg, c.border, 'border')}>
        <Icon size={22} className={c.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        {trend != null && (
          <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-primary-600' : 'text-red-500')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
    </motion.div>
  );
}
