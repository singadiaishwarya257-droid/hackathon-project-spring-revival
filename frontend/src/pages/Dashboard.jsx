import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map, Droplets, ClipboardList, AlertTriangle,
  Brain, Users, ArrowRight, TrendingUp,
} from 'lucide-react';
import api from '@/services/api';
import StatCard from '@/components/ui/StatCard';
import RainfallChart from '@/components/charts/RainfallChart';
import RiskPieChart from '@/components/charts/RiskPieChart';
import { getRiskConfig, getStatusConfig, formatDate, formatNumber, interventionLabel } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';

// ── Data hooks ────────────────────────────────────────────────────────────────
const useStats = () =>
  useQuery({ queryKey: ['dashboard', 'stats'], queryFn: () => api.get('/dashboard/stats').then((r) => r.data.stats) });

const useRainfall = () =>
  useQuery({ queryKey: ['dashboard', 'rainfall'], queryFn: () => api.get('/dashboard/chart/rainfall').then((r) => r.data.data) });

const useRisk = () =>
  useQuery({ queryKey: ['dashboard', 'risk'], queryFn: () => api.get('/dashboard/chart/risk-distribution').then((r) => r.data.data) });

const useActivity = () =>
  useQuery({ queryKey: ['dashboard', 'activity'], queryFn: () => api.get('/dashboard/recent-activity').then((r) => r.data) });

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton h-6 rounded ${className}`} />
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: stats,    isLoading: statsLoading    } = useStats();
  const { data: rainfall, isLoading: rainfallLoading } = useRainfall();
  const { data: risk,     isLoading: riskLoading     } = useRisk();
  const { data: activity, isLoading: actLoading      } = useActivity();

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            Spring Revival Dashboard · {user?.district || 'All Districts'}, {user?.state || 'India'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/analysis" className="btn-ocean btn-sm">
            <Brain size={15} /> Run AI Analysis
          </Link>
          <Link to="/map" className="btn-primary btn-sm">
            <Map size={15} /> View Map
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Map} label="Total Villages" index={0} color="ocean"
          value={statsLoading ? '—' : formatNumber(stats?.total_villages)}
          sub="Mapped tribal areas"
        />
        <StatCard
          icon={Droplets} label="Springs Mapped" index={1} color="primary"
          value={statsLoading ? '—' : formatNumber(stats?.total_springs)}
          sub={`${stats?.active_springs ?? '—'} active`}
        />
        <StatCard
          icon={ClipboardList} label="Field Surveys" index={2} color="earth"
          value={statsLoading ? '—' : formatNumber(stats?.total_surveys)}
          sub={`${stats?.completed_surveys ?? '—'} completed`}
        />
        <StatCard
          icon={AlertTriangle} label="High Risk Zones" index={3} color="red"
          value={statsLoading ? '—' : formatNumber(stats?.high_risk_zones)}
          sub={`Avg score: ${stats?.avg_recharge_score ?? '—'}`}
        />
      </div>

      {/* ── Charts row ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rainfall chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">30-Day Rainfall Trend</h3>
              <p className="text-xs text-gray-500">Daily precipitation (mm) · Open-Meteo API</p>
            </div>
            <span className="badge-blue">Live</span>
          </div>
          {rainfallLoading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="skeleton w-full h-full rounded-lg" />
            </div>
          ) : (
            <RainfallChart data={rainfall || []} height={210} />
          )}
        </div>

        {/* Risk distribution */}
        <div className="card">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900">Risk Distribution</h3>
            <p className="text-xs text-gray-500">AI-assessed recharge zones</p>
          </div>
          {riskLoading ? (
            <div className="h-52 skeleton rounded-lg" />
          ) : (
            <RiskPieChart data={risk || []} />
          )}
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent surveys */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Field Surveys</h3>
            <Link to="/survey" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {actLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : activity?.recent_surveys?.length ? (
            <div className="space-y-2">
              {activity.recent_surveys.map((s) => {
                const sc = getStatusConfig(s.status);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.spring_name || 'Unnamed Spring'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.village_name} · {s.surveyor_name} · {formatDate(s.survey_date)}
                      </p>
                    </div>
                    <span className={sc.badge}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No surveys yet</p>
          )}
        </div>

        {/* Recent AI analyses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent AI Analyses</h3>
            <Link to="/analysis" className="text-xs text-ocean-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {actLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : activity?.recent_analyses?.length ? (
            <div className="space-y-2">
              {activity.recent_analyses.map((a) => {
                const rc = getRiskConfig(a.risk_level);
                const score = parseFloat(a.recharge_score || 0);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Mini score bar */}
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-base font-bold" style={{ color: rc.color }}>
                        {score.toFixed(0)}
                      </p>
                      <div className="h-1 w-full bg-gray-200 rounded-full mt-0.5">
                        <div className="h-1 rounded-full" style={{ width: `${score}%`, background: rc.color }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {a.spring_name || a.village_name || 'Unknown location'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(a.analyzed_at)}</p>
                    </div>
                    <span className={rc.badge}>{rc.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No analyses yet</p>
          )}
        </div>
      </div>

      {/* ── Quick links ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/map',      icon: Map,          label: 'Interactive Map',  color: 'bg-ocean-50 text-ocean-700 border-ocean-200' },
          { to: '/analysis', icon: Brain,         label: 'AI Analysis',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { to: '/survey',   icon: ClipboardList, label: 'Field Survey',    color: 'bg-earth-50 text-earth-700 border-earth-200' },
          { to: '/reports',  icon: TrendingUp,    label: 'Generate Report', color: 'bg-primary-50 text-primary-700 border-primary-200' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-card-hover ${color}`}
          >
            <Icon size={22} />
            <span className="text-xs font-semibold text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Additional Navigation ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* Villages section */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Map size={16} className="text-primary-600" /> Explore Villages
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {stats?.total_villages || '—'} tribal villages mapped across {stats?.total_springs || '—'} springs
          </p>
          <Link to="/map" className="btn-primary btn-sm w-full justify-center">
            View All Villages
          </Link>
        </div>

        {/* Analysis section */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Brain size={16} className="text-purple-600" /> Run Analysis
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            AI-powered recharge predictions for {stats?.total_springs || '—'} springs
          </p>
          <Link to="/analysis" className="btn-ocean btn-sm w-full justify-center">
            Start AI Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};
