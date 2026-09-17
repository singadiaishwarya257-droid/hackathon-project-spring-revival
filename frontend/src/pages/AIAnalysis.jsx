import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, AlertTriangle, CheckCircle,
  TrendingUp, ChevronDown, ChevronUp, RefreshCw, Info, Layers,
} from 'lucide-react';
import api from '@/services/api';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { getRiskConfig, interventionLabel, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const schema = z.object({
  latitude:              z.coerce.number().min(8).max(37),
  longitude:             z.coerce.number().min(68).max(97),
  annual_rainfall_mm:    z.coerce.number().min(0).max(10000).default(1800),
  elevation_m:           z.coerce.number().min(0).max(8848).default(500),
  slope_deg:             z.coerce.number().min(0).max(90).default(15),
  soil_permeability:     z.coerce.number().min(0).max(1).default(0.35),
  land_use_code:         z.string().default('forest'),
  geology_type:          z.string().default('granite'),
  distance_to_stream_m:  z.coerce.number().min(0).default(300),
  ndvi_value:            z.coerce.number().min(-1).max(1).default(0.55),
});

const LAND_USES    = ['forest','mixed_forest','plantation','grassland','agriculture','scrubland','wetland','barren','urban'];
const GEOLOGY_OPTS = ['granite','basalt','limestone','schist','sandstone','alluvial','laterite','quartzite'];

// ── Feature slider ────────────────────────────────────────────────────────────
const Slider = ({ label, name, min, max, step = 0.01, register, watch, unit = '' }) => {
  const val = watch(name);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-xs font-bold text-primary-700">{parseFloat(val || 0).toFixed(step >= 1 ? 0 : 2)}{unit}</span>
      </div>
      <input type="range" {...register(name)} min={min} max={max} step={step}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
                   accent-primary-600" />
    </div>
  );
};

export default function AIAnalysis() {
  const qc = useQueryClient();
  const [result, setResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandFeatures, setExpandFeatures] = useState(false);
  const [showBatchTab, setShowBatchTab] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: 13.4162, longitude: 75.2558,
      annual_rainfall_mm: 1800, elevation_m: 500,
      slope_deg: 15, soil_permeability: 0.35,
      land_use_code: 'forest', geology_type: 'granite',
      distance_to_stream_m: 300, ndvi_value: 0.55,
    },
  });

  // Fetch villages for batch analysis
  const { data: villages = [], isLoading: villagesLoading, error: villagesError } = useQuery({
    queryKey: ['villages-list'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/villages?limit=1000');
        return data.villages || [];
      } catch (err) {
        console.error('Failed to fetch villages:', err);
        // Return empty array on error - UI will show error state
        return [];
      }
    },
    retry: 2,
  });

  // Mutation: Batch analysis
  const batchMutation = useMutation({
    mutationFn: async (villageId) => {
      const { data } = await api.post('/analysis/batch', { village_id: villageId });
      return data;
    },
    onSuccess: (data) => {
      setBatchResults(data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analysis-history'] });
      toast.success(`Analyzed ${data.analyzed} springs in the village!`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Batch analysis failed'),
  });

  // Fetch weather to auto-fill rainfall
  const fillWeather = async () => {
    const lat = watch('latitude'), lon = watch('longitude');
    if (!lat || !lon) return;
    try {
      toast.loading('Fetching weather data…', { id: 'weather' });
      const { data } = await api.get(`/external/weather?latitude=${lat}&longitude=${lon}&past_days=365`);
      const total = (data.daily?.precipitation_sum || []).reduce((a, b) => a + (b || 0), 0);
      setValue('annual_rainfall_mm', Math.round(total));
      toast.success(`Rainfall set: ${Math.round(total)} mm/year`, { id: 'weather' });
    } catch { toast.error('Could not fetch weather', { id: 'weather' }); }
  };

  // Fetch elevation
  const fillElevation = async () => {
    const lat = watch('latitude'), lon = watch('longitude');
    if (!lat || !lon) return;
    try {
      toast.loading('Fetching elevation…', { id: 'elev' });
      const { data } = await api.get(`/external/elevation?locations=${lat},${lon}`);
      if (data.results?.[0]?.elevation != null) {
        setValue('elevation_m', data.results[0].elevation);
        toast.success(`Elevation: ${data.results[0].elevation} m`, { id: 'elev' });
      }
    } catch { toast.error('Could not fetch elevation', { id: 'elev' }); }
  };

  // Mutation: call AI service via backend
  const mutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/analysis/predict', {
        ...formData,
        village_id: null, spring_id: null,
      });
      return data.ai_response;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Analysis complete!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Analysis failed'),
  });

  // History
  const { data: history } = useQuery({
    queryKey: ['analysis-history'],
    queryFn: () => api.get('/analysis?limit=10').then((r) => r.data.analyses),
    enabled: showHistory,
  });

  const onSubmit = (data) => mutation.mutate(data);

  const rc = result ? getRiskConfig(result.risk_level) : null;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain size={24} className="text-purple-600" /> AI Recharge Analysis
          </h1>
          <p className="page-subtitle">Random Forest model trained on Western Ghats hydro-geological data</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setShowBatchTab(false); setBatchResults(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                !showBatchTab 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single Location
            </button>
            <button
              onClick={() => { setShowBatchTab(true); setResult(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                showBatchTab 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers size={14} /> Batch Analysis
            </button>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary btn-sm"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Batch Analysis Tab ──────────────── */}
        {showBatchTab ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="lg:col-span-2 space-y-4"
          >
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers size={15} className="text-primary-600" /> Batch Analysis
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a village to analyze all springs at once. AI will generate recharge scores and risk assessments.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="label text-sm font-medium text-gray-700 mb-2">
                    📍 Select Village
                  </label>
                  {villagesLoading ? (
                    <div className="input bg-gray-50 text-gray-500">Loading villages...</div>
                  ) : villagesError || villages.length === 0 ? (
                    <div className="input bg-red-50 border-red-200 text-red-600 flex items-center gap-2">
                      <span>⚠️ Unable to load villages. Please try refreshing the page.</span>
                    </div>
                  ) : (
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          setBatchResults(null);
                          batchMutation.mutate(e.target.value);
                        }
                      }}
                      disabled={batchMutation.isPending || villagesLoading}
                      className="input cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {villages.length > 0 ? '🗺️ Choose a village...' : '❌ No villages available'}
                      </option>
                      {villages.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} {v.district && `(${v.district}, ${v.state || 'Karnataka'})`}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {villages.length > 0 ? `${villages.length} villages available` : 'Loading...'}
                  </p>
                </div>
              </div>

              {batchMutation.isPending && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Analyzing springs...</p>
                    <p className="text-xs text-blue-600">This may take a few seconds</p>
                  </div>
                </div>
              )}
              
              {batchMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-3">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm text-red-800">{batchMutation.error?.response?.data?.error || 'Analysis failed'}</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Input form ──────────────── */
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-primary-600" /> Location & Auto-fill
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label">Latitude *</label>
                  <input {...register('latitude')} type="number" step="0.0001" className="input" />
                </div>
                <div>
                  <label className="label">Longitude *</label>
                  <input {...register('longitude')} type="number" step="0.0001" className="input" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={fillWeather} className="btn-secondary btn-sm flex-1">
                  <CloudRainIcon size={13} /> Auto Rainfall
                </button>
                <button type="button" onClick={fillElevation} className="btn-secondary btn-sm flex-1">
                  <MountainIcon size={13} /> Auto Elevation
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Hydro-Geological Features</h3>
              <form id="analysis-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Slider label="Annual Rainfall" name="annual_rainfall_mm" min={200} max={5000} step={50} unit=" mm" register={register} watch={watch} />
                <Slider label="Elevation" name="elevation_m" min={10} max={3000} step={10} unit=" m" register={register} watch={watch} />
                <Slider label="Slope" name="slope_deg" min={1} max={60} step={1} unit="°" register={register} watch={watch} />
                <Slider label="Soil Permeability" name="soil_permeability" min={0} max={1} step={0.01} register={register} watch={watch} />

                <AnimatePresence>
                  {expandFeatures && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <Slider label="NDVI (Vegetation)" name="ndvi_value" min={-1} max={1} step={0.01} register={register} watch={watch} />
                      <Slider label="Distance to Stream" name="distance_to_stream_m" min={10} max={5000} step={50} unit=" m" register={register} watch={watch} />
                      <div>
                        <label className="label">Land Use</label>
                        <select {...register('land_use_code')} className="input text-sm">
                          {LAND_USES.map((l) => <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Geology Type</label>
                        <select {...register('geology_type')} className="input text-sm">
                          {GEOLOGY_OPTS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setExpandFeatures(!expandFeatures)}
                  className="text-xs text-ocean-600 flex items-center gap-1 hover:underline"
                >
                  {expandFeatures ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expandFeatures ? 'Fewer' : 'More'} options
                </button>
              </form>

              <button
                form="analysis-form"
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary w-full btn-lg mt-4"
              >
                {mutation.isPending ? (
                  <><RefreshCw size={16} className="animate-spin" /> Analysing…</>
                ) : (
                  <><Zap size={16} /> Run AI Analysis</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Result panel ─────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {showBatchTab && batchResults ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* Batch results header */}
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-gray-900 mb-1">✅ Batch Analysis Complete</h3>
                    <p className="text-sm text-gray-600">All springs in the selected village have been analyzed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary-600">{batchResults.analyzed}</p>
                    <p className="text-xs text-gray-600 mt-1">Springs Analyzed</p>
                  </div>
                </div>
              </div>

              {/* Results table */}
              {batchResults.results && batchResults.results.length > 0 ? (
                <div className="card">
                  <h4 className="font-semibold text-gray-900 mb-3">📊 Analysis Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-semibold text-gray-600 pb-2 pr-4">Spring ID</th>
                          <th className="text-left text-xs font-semibold text-gray-600 pb-2 pr-4">Score</th>
                          <th className="text-left text-xs font-semibold text-gray-600 pb-2 pr-4">Confidence</th>
                          <th className="text-left text-xs font-semibold text-gray-600 pb-2 pr-4">Risk Level</th>
                          <th className="text-left text-xs font-semibold text-gray-600 pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {batchResults.results?.map((r, idx) => {
                          if (r.error) {
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2.5 pr-4 text-gray-700">Spring #{r.spring_id?.slice(-4)}</td>
                                <td colSpan="4" className="py-2.5 text-sm text-red-600">⚠️ Error: {r.error}</td>
                              </tr>
                            );
                          }
                          const rc = getRiskConfig(r.risk_level);
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2.5 pr-4 text-gray-700 font-medium text-xs">{r.spring_id?.slice(-6) || '—'}</td>
                              <td className="py-2.5 pr-4">
                                <span className="font-bold" style={{ color: getScoreColor(r.recharge_score) }}>
                                  {parseFloat(r.recharge_score || 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-gray-600">{parseFloat(r.confidence_score || 0).toFixed(1)}%</td>
                              <td className="py-2.5 pr-4"><span className={rc.badge}>{rc.label}</span></td>
                              <td className="py-2.5 text-green-600 font-medium">✅ Saved</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-500">No results to display</p>
                </div>
              )}
            </motion.div>
          ) : !showBatchTab && result ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* Score header */}
              <div className="card" style={{ background: rc.bg, borderColor: rc.color + '40' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-gray-900 mb-1">Analysis Complete</h3>
                    <span className={`${rc.badge} text-sm px-3 py-1`}>{rc.label}</span>
                  </div>
                  <ScoreGauge score={parseFloat(result.recharge_score)} size={130} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">{parseFloat(result.confidence_score).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Model Version</p>
                    <p className="text-sm font-bold text-gray-900">{result.model_version}</p>
                  </div>
                </div>
              </div>

              {/* Recommended interventions */}
              <div className="card">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={15} className="text-primary-600" /> Recommended Interventions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(result.interventions || []).map((i) => (
                    <span key={i} className="badge-green text-sm px-3 py-1">{interventionLabel(i)}</span>
                  ))}
                  {!result.interventions?.length && <p className="text-sm text-gray-400">None recommended</p>}
                </div>
              </div>

              {/* Feature importance */}
              {result.details?.top_features?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp size={15} className="text-ocean-600" /> Feature Importance
                  </h4>
                  <div className="space-y-2.5">
                    {result.details.top_features.map((f) => (
                      <div key={f.feature}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-600 capitalize">{f.feature.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-800">{(f.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.importance * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-ocean-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI explanation */}
              {result.details?.explanation && (
                <div className="card bg-ocean-50 border-ocean-200">
                  <div className="flex gap-3">
                    <Info size={16} className="text-ocean-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ocean-800 leading-relaxed">{result.details.explanation}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-gray-200">
              <Brain size={48} className="text-gray-200 mb-4" />
              <h3 className="font-semibold text-gray-400 mb-1">No Analysis Yet</h3>
              <p className="text-sm text-gray-300">
                {showBatchTab ? 'Select a village to analyze all its springs' : 'Fill in the parameters on the left and click Run AI Analysis'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── History ─────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Analysis History</h3>
            {history?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Village', 'Spring', 'Score', 'Confidence', 'Risk', 'Date'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((a) => {
                      const rc = getRiskConfig(a.risk_level);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-4 text-gray-700">{a.village_name || '—'}</td>
                          <td className="py-2.5 pr-4 text-gray-700">{a.spring_name || '—'}</td>
                          <td className="py-2.5 pr-4 font-bold" style={{ color: getScoreColor(a.recharge_score) }}>
                            {parseFloat(a.recharge_score || 0).toFixed(1)}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600">{parseFloat(a.confidence_score || 0).toFixed(1)}%</td>
                          <td className="py-2.5 pr-4"><span className={rc.badge}>{rc.label}</span></td>
                          <td className="py-2.5 text-gray-400">{formatDate(a.analyzed_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400 py-4">No analysis history</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline icon helpers (no extra import needed)
const CloudRainIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
  </svg>
);
const MountainIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20l9-9 9 9M3 20h18"/><path d="M14 11l3-3 3 3"/>
  </svg>
);
const MapPin = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const getScoreColor = (s) => s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : s >= 25 ? '#ef4444' : '#b91c1c';
