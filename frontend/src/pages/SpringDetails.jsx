import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Droplets, Mountain, CloudRain,
  Calendar, User, CheckCircle, AlertTriangle, Camera,
  Activity, TrendingUp, ClipboardList,
} from 'lucide-react';
import L from 'leaflet';
import api from '@/services/api';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { getRiskConfig, getStatusConfig, formatDate, formatNumber, interventionLabel } from '@/utils/helpers';

const makeIcon = (color) => L.divIcon({
  className: '',
  iconAnchor: [14, 28], popupAnchor: [0, -28],
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg)"></div>`,
});

export default function SpringDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['spring', id],
    queryFn: () => api.get(`/springs/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 skeleton w-64 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
      </div>
      <div className="h-64 skeleton rounded-xl" />
    </div>
  );

  if (error || !data?.spring) return (
    <div className="text-center py-20">
      <AlertTriangle size={48} className="mx-auto text-amber-400 mb-3" />
      <p className="text-gray-500">Spring not found</p>
      <button onClick={() => navigate(-1)} className="btn-secondary btn-sm mt-4">Go Back</button>
    </div>
  );

  const { spring, analysis, verifications = [], photos = [] } = data;
  const rc = getRiskConfig(analysis?.risk_level);
  const sc = getStatusConfig(spring.status);
  const lat = parseFloat(spring.latitude);
  const lng = parseFloat(spring.longitude);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Breadcrumb ────────────── */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm flex items-center gap-1.5 -ml-2">
          <ArrowLeft size={15} /> Back
        </button>
        <span className="text-gray-300">/</span>
        <Link to="/map" className="text-sm text-gray-500 hover:text-primary-600">Map</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium truncate">{spring.name || 'Spring Details'}</span>
      </div>

      {/* ── Header ───────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets size={20} className="text-primary-600" />
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {spring.name || 'Unnamed Spring'}
              </h1>
              <span className={sc.badge}>{sc.label}</span>
            </div>
            <p className="text-gray-500 flex items-center gap-1.5">
              <MapPin size={14} />
              {spring.village_name}, {spring.district}, {spring.state}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {lat?.toFixed(5)}°N, {lng?.toFixed(5)}°E
            </p>
          </div>
          {analysis && (
            <div className="flex items-center gap-6">
              <ScoreGauge score={parseFloat(analysis.recharge_score)} size={110} />
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <span className={rc.badge}>{rc.label}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="font-bold text-gray-900">{parseFloat(analysis.confidence_score || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats row ─────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Mountain,   label: 'Elevation',     val: spring.elevation_m  ? `${spring.elevation_m} m` : '—' },
          { icon: Droplets,   label: 'Discharge',     val: spring.discharge_lpm ? `${spring.discharge_lpm} LPM` : '—' },
          { icon: CloudRain,  label: 'Annual Rainfall', val: analysis?.annual_rainfall_mm ? `${formatNumber(analysis.annual_rainfall_mm)} mm` : '—' },
          { icon: Activity,   label: 'Slope',          val: analysis?.slope_deg ? `${analysis.slope_deg}°` : '—' },
        ].map(({ icon: Icon, label, val }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card text-center"
          >
            <Icon size={20} className="text-primary-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-bold text-gray-900 mt-0.5">{val}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Map + Analysis ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Mini map */}
        <div className="lg:col-span-3 map-container h-72">
          {lat && lng ? (
            <MapContainer center={[lat, lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[lat, lng]} icon={makeIcon(rc.color || '#22c55e')} />
              <Circle center={[lat, lng]} radius={500}
                pathOptions={{ fillColor: rc.color, fillOpacity: 0.08, color: rc.color, weight: 1 }} />
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
              <p className="text-sm text-gray-400">Location not available</p>
            </div>
          )}
        </div>

        {/* AI Analysis details */}
        <div className="lg:col-span-2 card space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-ocean-600" /> AI Analysis
          </h3>
          {analysis ? (
            <>
              {/* Feature bars */}
              {analysis.analysis_details?.top_features?.map((f) => (
                <div key={f.feature}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600 capitalize">{f.feature.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-800">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-ocean-500"
                      style={{ width: `${f.importance * 100}%` }} />
                  </div>
                </div>
              ))}
              {/* Explanation */}
              {analysis.analysis_details?.explanation && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 leading-relaxed">
                  {analysis.analysis_details.explanation}
                </p>
              )}
              {/* Interventions */}
              {analysis.interventions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Recommended Interventions</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.interventions.map((i) => (
                      <span key={i} className="badge-green text-xs">{interventionLabel(i)}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <TrendingUp size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No AI analysis yet</p>
              <Link to="/analysis" className="btn-ocean btn-sm mt-3 inline-flex">Run Analysis</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Field Verifications ──── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList size={16} className="text-earth-600" /> Field Surveys ({verifications.length})
          </h3>
          <Link to={`/survey?spring=${id}`} className="btn-secondary btn-sm">+ New Survey</Link>
        </div>
        {verifications.length > 0 ? (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <CheckCircle size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{v.surveyor_name}</p>
                    <span className={getStatusConfig(v.status).badge}>{getStatusConfig(v.status).label}</span>
                    <span className="text-xs text-gray-400">{formatDate(v.survey_date)}</span>
                  </div>
                  {v.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.notes}</p>}
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                    {v.discharge_observed_lpm && <span>Flow: {v.discharge_observed_lpm} LPM</span>}
                    {v.ph_value && <span>pH: {v.ph_value}</span>}
                    {v.condition_rating && <span>Rating: {'⭐'.repeat(v.condition_rating)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No surveys recorded</p>
        )}
      </div>

      {/* ── Photos ───────────────── */}
      {photos.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Camera size={16} className="text-purple-600" /> Site Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={p.url} alt={p.caption || 'Spring photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {p.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
