import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '@/utils/helpers';

/**
 * Circular SVG gauge showing recharge suitability score
 */
export default function ScoreGauge({ score = 0, size = 120, strokeWidth = 10, showLabel = true }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const safeScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (safeScore / 100) * circumference;
  const color = getScoreColor(safeScore);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="font-display font-bold leading-none"
            style={{ fontSize: size * 0.22, color }}
          >
            {safeScore.toFixed(0)}
          </motion.span>
          <span className="text-gray-400" style={{ fontSize: size * 0.09 }}>/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold" style={{ color }}>
          {getScoreLabel(safeScore)}
        </span>
      )}
    </div>
  );
}
