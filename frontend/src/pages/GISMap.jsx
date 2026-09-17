import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  Layers, Search, Filter, X, Eye, EyeOff,
  Droplets, AlertTriangle, MapPin, ChevronRight, RefreshCw,
} from 'lucide-react';
import api from '@/services/api';
import { getRiskConfig, getStatusConfig, getScoreColor, interventionLabel, formatNumber } from '@/utils/helpers';
import ScoreGauge from '@/components/ui/ScoreGauge';

// ── Custom Leaflet icons ───────────────────────────────────────────────────────
const makeIcon = (color, size = 28) => L.divIcon({
  className: '',
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size],
  html: `<div style="
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
    background:${color};border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    transform:rotate(-45deg);
  "></div>`,
});

const SPRING_ICONS = {
  low:      makeIcon('#22c55e'),
  medium:   makeIcon('#f59e0b'),
  high:     makeIcon('#ef4444'),
  critical: makeIcon('#b91c1c'),
  default:  makeIcon('#6b7280', 22),
};

// ── Fly-to helper ──────────────────────────────────────────────────────────────
function FlyToLocation({ lat, lng, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], zoom, { duration: 1.5 });
  }, [lat, lng, zoom, map]);
  return null;
}

// ── Layer toggles ──────────────────────────────────────────────────────────────
const TILE_LAYERS = {
  streets:   { name: 'Streets',   url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
               attr: '© OpenStreetMap contributors' },
  topo:      { name: 'Topo',      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
               attr: '© OpenTopoMap contributors' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
               attr: '© Esri' },
};

export default function GISMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const flyLat  = parseFloat(searchParams.get('lat'))     || null;
  const flyLng  = parseFloat(searchParams.get('lng'))     || null;
  const villageId = searchParams.get('village') || null;

  const [baseLayer,    setBaseLayer]    = useState('streets');
  const [showHeatmap,  setShowHeatmap]  = useState(true);
  const [showWater,    setShowWater]    = useState(false);
  const [filterRisk,   setFilterRisk]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [selectedSpring, setSelectedSpring] = useState(null);
  const [mapCenter]    = useState([13.4162, 75.2558]); // Sringeri default

  // Fetch springs for map
  const { data: springs = [], isLoading, refetch } = useQuery({
    queryKey: ['map-springs', villageId, filterRisk, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: 500 });
      if (villageId)      params.set('village_id', villageId);
      if (filterRisk !== 'all') params.set('risk_level', filterRisk);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const { data } = await api.get(`/springs?${params}`);
      return data.springs || [];
    },
  });

  // Fetch heatmap data
  const { data: heatmap = [] } = useQuery({
    queryKey: ['heatmap', villageId],
    queryFn: () => api.get(`/analysis/heatmap${villageId ? `?village_id=${villageId}` : ''}`).then((r) => r.data.heatmap),
    enabled: showHeatmap,
  });

  const filteredSprings = springs.filter((s) => {
    if (filterRisk !== 'all'   && s.risk_level !== filterRisk)   return false;
    if (filterStatus !== 'all' && s.status     !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex gap-0 h-[calc(100vh-3.5rem-3rem)] -mx-4 md:-mx-6 -mt-4 md:-mt-6 overflow-hidden rounded-none">

      {/* ── Left Sidebar ──────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white border-r border-gray-200 flex flex-col z-10 overflow-hidden flex-shrink-0"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={16} className="text-primary-600" /> Map Controls
                </h2>
                <button onClick={() => setSidebarOpen(false)} className="btn-ghost btn-icon">
                  <X size={16} />
                </button>
              </div>

              {/* Base layer */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Base Map</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(TILE_LAYERS).map(([key, val]) => (
                    <button
                      key={`baselayer-${key}`}
                      onClick={() => setBaseLayer(key)}
                      className={`text-xs py-1.5 rounded-lg border font-medium transition-all ${
                        baseLayer === key
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {val.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay toggles */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Overlays</p>
                {[
                  { key: 'heatmap', label: 'AI Recharge Heatmap', state: showHeatmap, setter: setShowHeatmap, color: 'text-green-600' },
                  { key: 'water',   label: 'Water Bodies (OSM)',   state: showWater,   setter: setShowWater,   color: 'text-ocean-600' },
                ].map(({ key, label, state, setter, color }) => (
                  <button
                    key={`overlay-${key}`}
                    onClick={() => setter(!state)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                      state ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`font-medium ${state ? color : 'text-gray-500'}`}>{label}</span>
                    {state ? <Eye size={14} className={color} /> : <EyeOff size={14} className="text-gray-400" />}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filters</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Risk Level</label>
                    <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="input text-sm py-1.5">
                      <option value="all">All Risks</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Spring Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input text-sm py-1.5">
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="dry">Dry</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Spring list */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              <div className="p-3 sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600">
                  {filteredSprings.length} spring{filteredSprings.length !== 1 ? 's' : ''}
                </p>
                <button onClick={() => refetch()} className="btn-ghost btn-icon p-1">
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {filteredSprings.map((s) => {
                  const rc = getRiskConfig(s.risk_level);
                  const sc = getStatusConfig(s.status);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSpring(s)}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {s.name || 'Unnamed Spring'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{s.village_name}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {s.recharge_score != null && (
                            <p className="text-sm font-bold" style={{ color: getScoreColor(s.recharge_score) }}>
                              {parseFloat(s.recharge_score).toFixed(0)}
                            </p>
                          )}
                          <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ background: sc.dot }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!isLoading && filteredSprings.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-8">No springs found</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map ────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Toggle sidebar btn */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-[500] bg-white shadow-card-hover rounded-lg p-2 border border-gray-200 hover:bg-gray-50"
          >
            <Layers size={18} className="text-gray-700" />
          </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-3 z-[500] bg-white rounded-xl shadow-card border border-gray-200 p-3 text-xs">
          <p className="font-semibold text-gray-700 mb-1.5">Risk Level</p>
          {[['low','#22c55e','Low'],['medium','#f59e0b','Medium'],['high','#ef4444','High'],['critical','#b91c1c','Critical']].map(([k,c,l]) => (
            <div key={`legend-${k}`} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: c }} />
              <span className="text-gray-600">{l}</span>
            </div>
          ))}
        </div>

        <MapContainer
          center={mapCenter} zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {flyLat && flyLng && <FlyToLocation lat={flyLat} lng={flyLng} />}

          {/* Base tile layer */}
          <TileLayer
            url={TILE_LAYERS[baseLayer].url}
            attribution={TILE_LAYERS[baseLayer].attr}
            maxZoom={19}
          />

          {/* Heatmap circles (simulated heatmap via circles) */}
          {showHeatmap && heatmap.map(([lat, lng, intensity], i) => (
            <Circle
              key={`heat-${lat}-${lng}-${i}`}
              center={[lat, lng]}
              radius={800}
              pathOptions={{
                fillColor: getScoreColor(intensity * 100),
                fillOpacity: 0.15,
                color: 'transparent',
              }}
            />
          ))}

          {/* Spring markers */}
          {filteredSprings.map((s) => {
            if (!s.latitude || !s.longitude) return null;
            const icon = SPRING_ICONS[s.risk_level] || SPRING_ICONS.default;
            return (
              <Marker
                key={s.id}
                position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                icon={icon}
                eventHandlers={{ click: () => setSelectedSpring(s) }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-bold text-gray-900 mb-0.5">{s.name || 'Unnamed Spring'}</p>
                    <p className="text-xs text-gray-500 mb-2">{s.village_name}</p>
                    {s.recharge_score != null && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${s.recharge_score}%`,
                            background: getScoreColor(s.recharge_score)
                          }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: getScoreColor(s.recharge_score) }}>
                          {parseFloat(s.recharge_score).toFixed(0)}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/springs/${s.id}`)}
                      className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                    >
                      View details <ChevronRight size={11} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── Spring detail panel ───────────────────────── */}
      <AnimatePresence>
        {selectedSpring && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white border-l border-gray-200 overflow-y-auto custom-scroll flex-shrink-0"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {selectedSpring.name || 'Unnamed Spring'}
                </h3>
                <button onClick={() => setSelectedSpring(null)} className="btn-ghost btn-icon p-1 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <MapPin size={11} /> {selectedSpring.village_name}, {selectedSpring.district}
              </p>

              {/* Score gauge */}
              {selectedSpring.recharge_score != null && (
                <div className="flex justify-center mb-4">
                  <ScoreGauge score={parseFloat(selectedSpring.recharge_score)} size={100} />
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Status',    val: getStatusConfig(selectedSpring.status).label },
                  { label: 'Type',      val: selectedSpring.spring_type || '—' },
                  { label: 'Elevation', val: selectedSpring.elevation_m ? `${selectedSpring.elevation_m}m` : '—' },
                  { label: 'Discharge', val: selectedSpring.discharge_lpm ? `${selectedSpring.discharge_lpm} LPM` : '—' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {/* Interventions */}
              {selectedSpring.interventions?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Recommended Interventions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpring.interventions.map((i) => (
                      <span key={i} className="badge-green text-[10px]">{interventionLabel(i)}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/springs/${selectedSpring.id}`)}
                className="btn-primary w-full btn-sm"
              >
                Full Details <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
