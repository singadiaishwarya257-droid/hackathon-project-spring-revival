import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, Users, Map, Droplets, BarChart3,
  Trash2, Edit, CheckCircle, XCircle, Search,
  RefreshCw, Brain, Download,
} from 'lucide-react';
import api from '@/services/api';
import { getStatusConfig, getRiskConfig, formatDate, formatNumber } from '@/utils/helpers';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'users',    label: 'Users',    icon: Users },
  { key: 'villages', label: 'Villages', icon: Map },
  { key: 'springs',  label: 'Springs',  icon: Droplets },
  { key: 'analyses', label: 'AI Results', icon: Brain },
];

export default function AdminPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [batchVillageId, setBatchVillageId] = useState('');

  // ── Users ────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/users?search=${search}&limit=50`).then((r) => r.data.users),
    enabled: tab === 'users',
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/users/${id}/status`, { is_active }),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  // ── Villages (always fetch for batch analysis) ──────────────
  const { data: allVillages = [], isLoading: allVillagesLoading } = useQuery({
    queryKey: ['all-villages-for-batch'],
    queryFn: () => api.get('/villages?limit=1000').then((r) => r.data.villages || []),
    enabled: tab === 'analyses', // Only fetch when on analyses tab
  });

  // ── Villages (for villages tab) ────────────────────────────
  const { data: villages = [], isLoading: villagesLoading } = useQuery({
    queryKey: ['admin-villages', search],
    queryFn: () => api.get(`/villages?search=${search}&limit=50`).then((r) => r.data.villages),
    enabled: tab === 'villages',
  });

  const deleteVillage = useMutation({
    mutationFn: (id) => api.delete(`/villages/${id}`),
    onSuccess: () => { toast.success('Village deleted'); qc.invalidateQueries({ queryKey: ['admin-villages'] }); },
  });

  // ── Springs ───────────────────────────────────
  const { data: springs = [], isLoading: springsLoading } = useQuery({
    queryKey: ['admin-springs', search],
    queryFn: () => api.get(`/springs?limit=50`).then((r) => r.data.springs),
    enabled: tab === 'springs',
  });

  const deleteSpring = useMutation({
    mutationFn: (id) => api.delete(`/springs/${id}`),
    onSuccess: () => { toast.success('Spring deleted'); qc.invalidateQueries({ queryKey: ['admin-springs'] }); },
  });

  // ── AI analyses ───────────────────────────────
  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ['admin-analyses'],
    queryFn: () => api.get('/analysis?limit=50').then((r) => r.data.analyses),
    enabled: tab === 'analyses',
  });

  // Batch AI analysis
  const batchAnalyse = useMutation({
    mutationFn: (village_id) => api.post('/analysis/batch', { village_id }),
    onSuccess: (d) => toast.success(`Analyzed ${d.data.analyzed} springs`),
    onError: (e) => toast.error(e.response?.data?.error || 'Batch analysis failed'),
  });

  const loading = { users: usersLoading, villages: villagesLoading, springs: springsLoading, analyses: analysesLoading }[tab];

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Shield size={22} className="text-gov-blue" /> Admin Panel
        </h1>
        <p className="page-subtitle">Manage users, villages, springs, and AI analyses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="input pl-9 w-56 h-9"
          />
        </div>
        {tab === 'analyses' && (
          <div className="flex gap-2 items-center">
            {allVillagesLoading ? (
              <div className="text-sm text-gray-500 italic">🔄 Loading villages...</div>
            ) : allVillages.length > 0 ? (
              <>
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  📍 Village:
                </label>
                <select
                  value={batchVillageId}
                  onChange={(e) => setBatchVillageId(e.target.value)}
                  disabled={batchAnalyse.isPending}
                  className="input w-64 h-9"
                >
                  <option value="">Select a village...</option>
                  {allVillages.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} {v.district && `(${v.district})`}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="text-sm text-red-500 italic">⚠️ No villages available. Check backend connection.</div>
            )}
            <button
              onClick={() => batchAnalyse.mutate(batchVillageId)}
              disabled={!batchVillageId || batchAnalyse.isPending || allVillagesLoading}
              className="btn-ocean btn-sm"
            >
              {batchAnalyse.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
              Batch Analyse
            </button>
          </div>
        )}
        <a href={`/api/reports/export/csv`} className="btn-secondary btn-sm ml-auto" download>
          <Download size={14} /> Export CSV
        </a>
        <a href={`/api/reports/export/pdf`} className="btn-secondary btn-sm" download>
          <Download size={14} /> Export PDF
        </a>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* ── Users table ── */}
            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Email', 'Role', 'District', 'Status', 'Last Login', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'officer' ? 'badge-blue' : 'badge-green'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.district || '—'}</td>
                      <td className="px-4 py-3">
                        {u.is_active
                          ? <span className="badge-green">Active</span>
                          : <span className="badge-red">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(u.last_login)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUser.mutate({ id: u.id, is_active: !u.is_active })}
                          className={`btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                        >
                          {u.is_active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Villages table ── */}
            {tab === 'villages' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Village', 'Taluk', 'District', 'State', 'Population', 'Tribal %', 'Springs', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {villages.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600">{v.taluk || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{v.district}</td>
                      <td className="px-4 py-3 text-gray-600">{v.state}</td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(v.population)}</td>
                      <td className="px-4 py-3 text-gray-600">{v.tribal_pct ?? '—'}%</td>
                      <td className="px-4 py-3 text-gray-600">{v.spring_count}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { if (confirm(`Delete village "${v.name}"?`)) deleteVillage.mutate(v.id); }}
                          className="btn-ghost btn-icon p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Springs table ── */}
            {tab === 'springs' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Spring', 'Village', 'Type', 'Status', 'Elevation', 'Discharge', 'Score', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {springs.map((s) => {
                    const sc = getStatusConfig(s.status);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name || 'Unnamed'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.village_name}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{s.spring_type || '—'}</td>
                        <td className="px-4 py-3"><span className={sc.badge}>{sc.label}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.elevation_m ? `${s.elevation_m}m` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.discharge_lpm ? `${s.discharge_lpm} LPM` : '—'}</td>
                        <td className="px-4 py-3 font-bold text-primary-700">
                          {s.recharge_score ? parseFloat(s.recharge_score).toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { if (confirm(`Delete spring "${s.name}"?`)) deleteSpring.mutate(s.id); }}
                            className="btn-ghost btn-icon p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── Analyses table ── */}
            {tab === 'analyses' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Village', 'Spring', 'Score', 'Confidence', 'Risk', 'Interventions', 'Analysed'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analyses.map((a) => {
                    const rc = getRiskConfig(a.risk_level);
                    // Extract nested spring and village names from populated objects
                    const springName = typeof a.spring_id === 'object' ? a.spring_id?.name : a.spring_id;
                    const villageName = typeof a.village_id === 'object' ? a.village_id?.name : a.village_id;
                    
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{villageName || a.village_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{springName || a.spring_name || '—'}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: getRiskConfig(a.risk_level).color }}>
                          {parseFloat(a.recharge_score || 0).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{parseFloat(a.confidence_score || 0).toFixed(1)}%</td>
                        <td className="px-4 py-3"><span className={rc.badge}>{rc.label}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                          {(a.interventions || []).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(a.analyzed_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Empty state */}
            {!loading && [users, villages, springs, analyses][TABS.findIndex(t=>t.key===tab)].length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No {tab} found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
