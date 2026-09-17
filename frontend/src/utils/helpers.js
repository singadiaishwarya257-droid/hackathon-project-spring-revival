import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merge helper */
export const cn = (...inputs) => twMerge(clsx(inputs));

/** Format number with Indian locale */
export const formatNumber = (n, decimals = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(n ?? 0);

/** Format date to DD MMM YYYY */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/** Risk level → Tailwind badge class + label */
export const getRiskConfig = (level) => ({
  low:      { label: 'Low Risk',      badge: 'badge-green', color: '#22c55e', bg: '#f0fdf4' },
  medium:   { label: 'Medium Risk',   badge: 'badge-amber', color: '#f59e0b', bg: '#fffbeb' },
  high:     { label: 'High Risk',     badge: 'badge-red',   color: '#ef4444', bg: '#fef2f2' },
  critical: { label: 'Critical Risk', badge: 'badge-red',   color: '#b91c1c', bg: '#fff1f2' },
}[level?.toLowerCase()] ?? { label: level, badge: 'badge-gray', color: '#6b7280', bg: '#f9fafb' });

/** Spring status → config */
export const getStatusConfig = (status) => ({
  active:   { label: 'Active',   badge: 'badge-green', dot: '#22c55e' },
  seasonal: { label: 'Seasonal', badge: 'badge-blue',  dot: '#3b82f6' },
  dry:      { label: 'Dry',      badge: 'badge-amber', dot: '#f59e0b' },
  unknown:  { label: 'Unknown',  badge: 'badge-gray',  dot: '#9ca3af' },
}[status?.toLowerCase()] ?? { label: status, badge: 'badge-gray', dot: '#9ca3af' });

/** Score → colour */
export const getScoreColor = (score) => {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  if (score >= 25) return '#ef4444';
  return '#b91c1c';
};

/** Score → label */
export const getScoreLabel = (score) => {
  if (score >= 70) return 'High Potential';
  if (score >= 45) return 'Moderate';
  if (score >= 25) return 'Low Potential';
  return 'Very Low';
};

/** Intervention → human label */
export const interventionLabel = (key) => ({
  check_dam:         '🏞 Check Dam',
  recharge_pit:      '⛏ Recharge Pit',
  contour_trench:    '〰 Contour Trench',
  percolation_tank:  '💧 Percolation Tank',
  spring_protection: '🌿 Spring Protection',
  gabion_structure:  '🪨 Gabion Structure',
}[key] ?? key);

/** Truncate text */
export const truncate = (str, n = 80) =>
  str?.length > n ? `${str.slice(0, n)}…` : str ?? '—';

/** Debounce function */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

/** Get initials from name */
export const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
