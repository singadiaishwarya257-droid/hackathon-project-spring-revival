import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  Filter, TrendingUp, Droplets, Map,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/services/api';
import { getRiskConfig, formatNumber, formatDate, getScoreColor } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';

// Export button component
const ExportButton = ({ format, villageId }) => {
  const { token } = useAuthStore();
  const isCSV = format === 'csv';
  
  const handleExport = async () => {
    try {
      const url = `/api/reports/export/${format}${villageId ? `?village_id=${villageId}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Export failed with status ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = isCSV ? 'spring-revival-report.csv' : 'spring-revival-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (err) {
      console.error(`${format.toUpperCase()} export failed:`, err);
      alert(`Failed to export ${format.toUpperCase()}: ${err.message}`);
    }
  };
  
  if (!token) {
    return (
      <button className="btn-secondary btn-sm opacity-50 cursor-not-allowed" disabled>
        <FileSpreadsheet size={14} /> {isCSV ? 'Export CSV' : 'Export PDF'}
      </button>
    );
  }
  
  return (
    <button onClick={handleExport} className={isCSV ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}>
      {isCSV ? <FileSpreadsheet size={14} /> : <FileText size={14} />}
      {isCSV ? 'Export CSV' : 'Export PDF'}
    </button>
  );
};

export default function Reports() {
  const [villageId, setVillageId] = useState('');
  const [activeChart, setActiveChart] = useState('springs');

  // Fetch villages for filter
  const { data: villages = [] } = useQuery({
    queryKey: ['villages-select'],
    queryFn: () => api.get('/villages?limit=100').then((r) => r.data.villages),
  });

  // Fetch springs for chart
  const { data: springs = [] } = useQuery({
    queryKey: ['report-springs', villageId],
    queryFn: () => api.get(`/springs?limit=100${villageId ? `&village_id=${villageId}` : ''}`).then((r) => r.data.springs),
  });

  // Fetch analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['report-analyses', villageId],
    queryFn: () => api.get(`/analysis?limit=100${villageId ? `&village_id=${villageId}` : ''}`).then((r) => r.data.analyses),
  });

  // Group springs by score band
  const scoreBands = [
    { band: '0–25',  range: [0,  25],  count: 0, label: 'Very Low' },
    { band: '25–45', range: [25, 45],  count: 0, label: 'Low' },
    { band: '45–70', range: [45, 70],  count: 0, label: 'Moderate' },
    { band: '70–100',range: [70, 100], count: 0, label: 'High' },
  ];
  analyses.forEach((a) => {
    const s = parseFloat(a.recharge_score || 0);
    const band = scoreBands.find((b) => s >= b.range[0] && s < b.range[1]);
    if (band) band.count++;
  });

  // Risk distribution
  const riskData = ['low','medium','high','critical'].map((r) => ({
    risk: r.charAt(0).toUpperCase() + r.slice(1),
    count: analyses.filter((a) => a.risk_level === r).length,
    color: getRiskConfig(r).color,
  }));

  // Top springs by score
  const topSprings = [...analyses]
    .sort((a, b) => b.recharge_score - a.recharge_score)
    .slice(0, 8)
    .map((a) => ({
      name: (a.spring_name || a.village_name || 'Unknown').slice(0, 16),
      score: parseFloat(a.recharge_score || 0).toFixed(1),
      color: getScoreColor(a.recharge_score),
    }));

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 size={22} className="text-ocean-600" /> Reports & Analytics
          </h1>
          <p className="page-subtitle">District-level analysis, charts, and export tools</p>
        </div>
        {/* Export buttons */}
        <div className="flex gap-2">
          <ExportButton format="csv" villageId={villageId} />
          <ExportButton format="pdf" villageId={villageId} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="card py-3 px-4 flex items-center gap-4 flex-wrap">
        <Filter size={15} className="text-gray-400 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Village/Region:</label>
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="input h-8 text-sm w-56"
          >
            <option value="">All Villages</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>{v.name} — {v.district}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500 ml-auto">
          {analyses.length} analyses · {springs.length} springs
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: 'Total Springs',    val: formatNumber(springs.length),       color: 'text-primary-600 bg-primary-50' },
          { icon: TrendingUp, label: 'Avg Score',      val: analyses.length ? (analyses.reduce((s,a) => s + parseFloat(a.recharge_score||0), 0) / analyses.length).toFixed(1) : '—', color: 'text-ocean-600 bg-ocean-50' },
          { icon: Map, label: 'High Potential',        val: analyses.filter((a) => a.recharge_score >= 70).length, color: 'text-green-600 bg-green-50' },
          { icon: BarChart3, label: 'High Risk Zones', val: analyses.filter((a) => a.risk_level === 'high' || a.risk_level === 'critical').length, color: 'text-red-600 bg-red-50' },
        ].map(({ icon: Icon, label, val, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card text-center"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'springs', label: 'Score Distribution' },
          { key: 'risk',    label: 'Risk Breakdown' },
          { key: 'top',     label: 'Top Springs' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveChart(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeChart === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="card">
        {activeChart === 'springs' && (
          <>
            <h3 className="font-semibold text-gray-900 mb-4">Recharge Score Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreBands} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="band" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} springs`, 'Count']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreBands.map((b, i) => (
                    <Cell key={i} fill={['#ef4444','#f59e0b','#3b82f6','#22c55e'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'risk' && (
          <>
            <h3 className="font-semibold text-gray-900 mb-4">Risk Level Breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="risk" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} zones`, 'Count']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'top' && (
          <>
            <h3 className="font-semibold text-gray-900 mb-4">Top Springs by Recharge Score</h3>
            {topSprings.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topSprings} margin={{ top: 5, right: 10, bottom: 30, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}`, 'Score']} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {topSprings.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-10 text-sm">No data available</p>
            )}
          </>
        )}
      </div>

      {/* Tabular spring report */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Spring-wise Analysis Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Spring', 'Village', 'District', 'Score', 'Confidence', 'Risk', 'Interventions', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {analyses.slice(0, 20).map((a) => {
                const rc = getRiskConfig(a.risk_level);
                // Extract nested spring and village names from populated objects
                const springName = typeof a.spring_id === 'object' ? a.spring_id?.name : a.spring_id;
                const villageName = typeof a.village_id === 'object' ? a.village_id?.name : a.village_id;
                const villageData = typeof a.village_id === 'object' ? a.village_id : null;
                const district = villageData?.district || a.district || '—';
                
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-primary-600 hover:underline cursor-pointer">{springName || a.spring_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{villageName || a.village_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-medium">{district}</td>
                    <td className="px-4 py-2.5 font-bold" style={{ color: getScoreColor(a.recharge_score) }}>
                      {parseFloat(a.recharge_score || 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{parseFloat(a.confidence_score||0).toFixed(1)}%</td>
                    <td className="px-4 py-2.5"><span className={rc.badge}>{rc.label}</span></td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[180px] truncate">
                      {(a.interventions || []).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{formatDate(a.analyzed_at)}</td>
                  </tr>
                );
              })}
              {analyses.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-8">No analysis data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
