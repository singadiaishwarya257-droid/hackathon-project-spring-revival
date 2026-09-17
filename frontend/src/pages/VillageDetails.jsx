import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin, Users, Droplets, BarChart3, TrendingUp, AlertTriangle,
  ArrowLeft, ChevronRight, Map, CheckCircle, Clock, Activity,
} from 'lucide-react';
import api from '@/services/api';
import { getRiskConfig, getStatusConfig, formatDate, formatNumber } from '@/utils/helpers';
import ScoreGauge from '@/components/ui/ScoreGauge';
import RiskPieChart from '@/components/charts/RiskPieChart';

export default function VillageDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch village details with enriched data
  const { data: village, isLoading: villageLoading } = useQuery({
    queryKey: ['village', id],
    queryFn: () => api.get(`/villages/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  // Fetch all springs in this village
  const { data: springs = [] } = useQuery({
    queryKey: ['village-springs', id],
    queryFn: () => api.get(`/springs?village_id=${id}&limit=200`).then((r) => r.data.springs),
    enabled: !!id,
  });

  // Fetch analyses for this village
  const { data: analyses = [] } = useQuery({
    queryKey: ['village-analyses', id],
    queryFn: () => api.get(`/analysis?village_id=${id}&limit=200`).then((r) => r.data.analyses),
    enabled: !!id,
  });

  // Fetch rainfall data for this village
  const { data: rainfallData = [] } = useQuery({
    queryKey: ['village-rainfall', id],
    queryFn: () => api.get(`/rainfall?village_id=${id}&limit=365`).then((r) => r.data.data),
    enabled: !!id,
  });

  // Fetch surveys for this village
  const { data: surveys = [] } = useQuery({
    queryKey: ['village-surveys', id],
    queryFn: () => api.get(`/survey?village_id=${id}&limit=100`).then((r) => r.data.surveys),
    enabled: !!id,
  });

  if (villageLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 skeleton w-64 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={`load-${i}`} className="h-32 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!village?.village) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto text-amber-400 mb-3" />
        <p className="text-gray-500">Village not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary btn-sm mt-4">Go Back</button>
      </div>
    );
  }

  const v = village.village;
  const springCount = springs.length;
  const activeSpringCount = springs.filter((s) => s.status === 'active').length;
  const highRiskCount = analyses.filter((a) => a.risk_level === 'high' || a.risk_level === 'critical').length;
  const avgScore = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + parseFloat(a.recharge_score || 0), 0) / analyses.length).toFixed(1)
    : 0;
  const surveyCount = surveys.length;
  const completedSurveys = surveys.filter((s) => s.status === 'completed').length;
  const avgRainfall = rainfallData.length > 0
    ? (rainfallData.reduce((sum, r) => sum + parseFloat(r.rainfall_mm || 0), 0) / rainfallData.length).toFixed(1)
    : 0;

  // Risk distribution for chart
  const riskDistribution = [
    { risk_level: 'low', count: analyses.filter((a) => a.risk_level === 'low').length },
    { risk_level: 'medium', count: analyses.filter((a) => a.risk_level === 'medium').length },
    { risk_level: 'high', count: analyses.filter((a) => a.risk_level === 'high').length },
    { risk_level: 'critical', count: analyses.filter((a) => a.risk_level === 'critical').length },
  ];

  // Top springs by score
  const topSprings = analyses
    .sort((a, b) => parseFloat(b.recharge_score) - parseFloat(a.recharge_score))
    .slice(0, 5);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm flex items-center gap-1.5 -ml-2">
          <ArrowLeft size={15} /> Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium truncate">{v.name}</span>
      </div>

      {/* ── Header ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={20} className="text-primary-600" />
              <h1 className="text-2xl font-display font-bold text-gray-900">{v.name}</h1>
            </div>
            <p className="text-gray-500 flex items-center gap-1.5">
              {v.taluk && `${v.taluk}, `}{v.district}, {v.state}
            </p>
            {v.population && (
              <p className="text-xs text-gray-400 mt-1">
                Population: {formatNumber(v.population)} · Tribal: {v.tribal_pct || '—'}%
              </p>
            )}
          </div>
          <Link to={`/map?village=${id}`} className="btn-primary flex items-center gap-2">
            <Map size={16} /> View on Map
          </Link>
        </div>
      </motion.div>

      {/* ── Key Metrics ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: 'Total Springs', val: springCount, sub: `${activeSpringCount} active` },
          { icon: BarChart3, label: 'Avg Recharge Score', val: `${avgScore}/100`, sub: `${analyses.length} analyzed` },
          { icon: AlertTriangle, label: 'High Risk Springs', val: highRiskCount, sub: analyses.length > 0 ? `${((highRiskCount/analyses.length)*100).toFixed(0)}% of total` : '—' },
          { icon: Activity, label: 'Field Surveys', val: surveyCount, sub: `${completedSurveys} completed` },
        ].map(({ icon: Icon, label, val, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card"
          >
            <Icon size={16} className="text-primary-500 mb-2" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-bold text-gray-900 mt-0.5 text-lg">{val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'springs', label: 'Springs' },
          { key: 'analysis', label: 'AI Analysis' },
          { key: 'surveys', label: 'Surveys' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Risk distribution chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-600" /> Risk Level Distribution
              </h3>
              {riskDistribution.some(r => r.count > 0) ? (
                <RiskPieChart data={riskDistribution} />
              ) : (
                <div className="text-center py-8 text-gray-400">No analysis data available</div>
              )}
            </div>

            {/* Stats sidebar */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg Rainfall</span>
                  <span className="font-semibold text-gray-900">{avgRainfall} mm</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Survey Completion</span>
                  <span className="font-semibold text-gray-900">
                    {surveyCount > 0 ? `${((completedSurveys/surveyCount)*100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Active Springs</span>
                  <span className="font-semibold text-gray-900">{activeSpringCount}/{springCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top springs by score */}
          {topSprings.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-ocean-600" /> Top Springs by Recharge Potential
              </h3>
              <div className="space-y-2">
                {topSprings.map((a, i) => (
                  <Link
                    key={a.id}
                    to={`/springs/${a.spring_id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="font-medium text-gray-900">{a.spring_name || 'Unnamed'}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Risk: <span className={getRiskConfig(a.risk_level).badge}>{getRiskConfig(a.risk_level).label}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg" style={{ color: getRiskConfig(a.risk_level).color }}>
                        {parseFloat(a.recharge_score).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400">score</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SPRINGS TAB ───────────────────────────────────── */}
      {activeTab === 'springs' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Droplets size={16} className="text-primary-600" /> Springs in {v.name}
            </h3>
            <span className="text-sm text-gray-500">{springCount} springs</span>
          </div>
          {springs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Type', 'Status', 'Elevation', 'Discharge', 'Recharge Score', 'Risk'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {springs.map((s) => {
                    const analysis = analyses.find(a => a.spring_id === s.id);
                    const rc = getRiskConfig(analysis?.risk_level);
                    const sc = getStatusConfig(s.status);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link to={`/springs/${s.id}`} className="font-medium text-primary-600 hover:underline">
                            {s.name || 'Unnamed'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{s.spring_type || '—'}</td>
                        <td className="px-4 py-3"><span className={sc.badge}>{sc.label}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.elevation_m ? `${s.elevation_m}m` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.discharge_lpm ? `${s.discharge_lpm} LPM` : '—'}</td>
                        <td className="px-4 py-3 font-bold text-primary-700">
                          {analysis?.recharge_score ? parseFloat(analysis.recharge_score).toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {analysis ? <span className={rc.badge}>{rc.label}</span> : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">No springs recorded in this village</p>
          )}
        </div>
      )}

      {/* ── AI ANALYSIS TAB ───────────────────────────────── */}
      {activeTab === 'analysis' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-ocean-600" /> AI Analysis Results
          </h3>
          {analyses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Spring', 'Score', 'Confidence', 'Risk', 'Top Feature', 'Interventions', 'Date'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analyses.map((a) => {
                    const rc = getRiskConfig(a.risk_level);
                    const topFeature = a.analysis_details?.top_features?.[0];
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          <Link to={`/springs/${a.spring_id}`} className="text-primary-600 hover:underline">
                            {a.spring_name || 'Unnamed'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: rc.color }}>
                          {parseFloat(a.recharge_score || 0).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{parseFloat(a.confidence_score || 0).toFixed(1)}%</td>
                        <td className="px-4 py-3"><span className={rc.badge}>{rc.label}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                          {topFeature?.feature?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {a.interventions?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {a.interventions.slice(0, 2).map((i) => (
                                <span key={i} className="badge-green text-[10px]">{i}</span>
                              ))}
                              {a.interventions.length > 2 && <span className="text-gray-400">+{a.interventions.length - 2}</span>}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(a.analyzed_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No AI analyses for this village yet</p>
              <Link to="/analysis" className="btn-ocean btn-sm inline-flex">Run AI Analysis</Link>
            </div>
          )}
        </div>
      )}

      {/* ── SURVEYS TAB ────────────────────────────────────── */}
      {activeTab === 'surveys' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-earth-600" /> Field Surveys
            </h3>
            <span className="text-sm text-gray-500">{surveyCount} surveys</span>
          </div>
          {surveys.length > 0 ? (
            <div className="space-y-3">
              {surveys.map((s) => {
                const sc = getStatusConfig(s.status);
                return (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: sc.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{s.spring_name || 'Unnamed Spring'}</p>
                        <span className={sc.badge}>{sc.label}</span>
                        <span className="text-xs text-gray-400">{formatDate(s.survey_date)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{s.surveyor_name}</p>
                      {s.notes && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{s.notes}</p>}
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        {s.discharge_observed_lpm && <span>Flow: {s.discharge_observed_lpm} LPM</span>}
                        {s.ph_value && <span>pH: {s.ph_value}</span>}
                        {s.condition_rating && <span>Rating: {'⭐'.repeat(s.condition_rating)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No field surveys recorded yet</p>
              <Link to="/survey" className="btn-primary btn-sm inline-flex">New Survey</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
