import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, MapPin, CheckCircle, Clock,
  Camera, Waves, Thermometer, X, ChevronRight, Upload,
} from 'lucide-react';
import api from '@/services/api';
import { getStatusConfig, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const schema = z.object({
  spring_id:    z.string().uuid('Select a spring'),
  village_id:   z.string().uuid('Village required'),
  survey_date:  z.string().min(1, 'Date required'),
  gps_latitude:  z.coerce.number().min(8).max(37),
  gps_longitude: z.coerce.number().min(68).max(97),
  discharge_observed_lpm: z.coerce.number().optional(),
  ph_value:     z.coerce.number().min(0).max(14).optional(),
  tds_ppm:      z.coerce.number().min(0).optional(),
  turbidity_ntu: z.coerce.number().min(0).optional(),
  water_color:  z.string().optional(),
  odor:         z.string().optional(),
  soil_type:    z.string().optional(),
  condition_rating: z.coerce.number().min(1).max(5).optional(),
  notes:        z.string().optional(),
  recommendations: z.string().optional(),
});

export default function Survey() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { survey_date: new Date().toISOString().split('T')[0] },
  });

  // Fetch surveys
  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => api.get('/survey?limit=50').then((r) => r.data.surveys),
  });

  // Fetch springs for dropdown
  const { data: springs = [] } = useQuery({
    queryKey: ['springs-select'],
    queryFn: () => api.get('/springs?limit=200').then((r) => r.data.springs),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/survey', data),
    onSuccess: () => {
      toast.success('Survey submitted successfully!');
      qc.invalidateQueries({ queryKey: ['surveys'] });
      reset();
      setShowForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Submission failed'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => api.patch(`/survey/${id}/verify`),
    onSuccess: () => { toast.success('Survey verified!'); qc.invalidateQueries({ queryKey: ['surveys'] }); },
  });

  const captureGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue('gps_latitude',  parseFloat(coords.latitude.toFixed(6)));
        setValue('gps_longitude', parseFloat(coords.longitude.toFixed(6)));
        toast.success(`GPS captured: ${coords.latitude.toFixed(4)}°N`);
        setGpsLoading(false);
      },
      () => { toast.error('GPS access denied'); setGpsLoading(false); }
    );
  };

  const watchSpring = watch('spring_id');
  const selectedSpringData = springs.find((s) => s.id === watchSpring);

  const stats = {
    total:     surveys.length,
    completed: surveys.filter((s) => s.status === 'completed').length,
    pending:   surveys.filter((s) => s.status === 'pending').length,
    verified:  surveys.filter((s) => s.status === 'verified').length,
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList size={22} className="text-earth-600" /> Field Survey
          </h1>
          <p className="page-subtitle">GPS-tagged spring surveys with water quality data</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> New Survey
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     val: stats.total,     color: 'bg-gray-100 text-gray-700' },
          { label: 'Completed', val: stats.completed, color: 'bg-primary-100 text-primary-700' },
          { label: 'Pending',   val: stats.pending,   color: 'bg-amber-100 text-amber-700' },
          { label: 'Verified',  val: stats.verified,  color: 'bg-ocean-100 text-ocean-700' },
        ].map(({ label, val, color }) => (
          <div key={`stat-${label}`} className={`rounded-xl px-4 py-3 ${color}`}>
            <p className="text-2xl font-display font-bold">{val}</p>
            <p className="text-xs font-medium">{label} Surveys</p>
          </div>
        ))}
      </div>

      {/* New survey form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card border-primary-200 border-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">New Field Survey</h3>
                <button onClick={() => setShowForm(false)} className="btn-ghost btn-icon"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
                {/* Spring + Village */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Spring *</label>
                    <select {...register('spring_id')} className={errors.spring_id ? 'input-error' : 'input'}>
                      <option value="">Select spring…</option>
                      {springs.map((s) => (
                        <option key={s.id} value={s.id}
                          onClick={() => setValue('village_id', s.village_id)}>
                          {s.name || 'Unnamed'} — {s.village_name}
                        </option>
                      ))}
                    </select>
                    {errors.spring_id && <p className="text-red-500 text-xs mt-1">{errors.spring_id.message}</p>}
                  </div>
                  <div>
                    <label className="label">Village ID *</label>
                    <input {...register('village_id')} className="input" placeholder="Auto-filled from spring" />
                    {errors.village_id && <p className="text-red-500 text-xs mt-1">{errors.village_id.message}</p>}
                  </div>
                </div>

                {/* Date + GPS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Survey Date *</label>
                    <input {...register('survey_date')} type="date" className="input" />
                  </div>
                  <div>
                    <label className="label">GPS Latitude *</label>
                    <input {...register('gps_latitude')} type="number" step="0.000001" className="input" placeholder="13.4162" />
                  </div>
                  <div>
                    <label className="label">GPS Longitude *</label>
                    <input {...register('gps_longitude')} type="number" step="0.000001" className="input" placeholder="75.2558" />
                  </div>
                </div>
                <button type="button" onClick={captureGPS} disabled={gpsLoading} className="btn-secondary btn-sm">
                  <MapPin size={14} /> {gpsLoading ? 'Capturing…' : 'Capture GPS from Device'}
                </button>

                {/* Water quality */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Waves size={14} /> Water Quality Measurements
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'discharge_observed_lpm', label: 'Discharge (LPM)', step: 0.1 },
                      { name: 'ph_value',               label: 'pH Value',        step: 0.1, min: 0, max: 14 },
                      { name: 'tds_ppm',                label: 'TDS (ppm)',       step: 1 },
                      { name: 'turbidity_ntu',          label: 'Turbidity (NTU)', step: 0.1 },
                    ].map(({ name, label, step, min, max }) => (
                      <div key={`wq-${name}`}>
                        <label className="label">{label}</label>
                        <input {...register(name)} type="number" step={step} min={min} max={max} className="input" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="label">Water Color</label>
                      <input {...register('water_color')} className="input" placeholder="Clear, turbid…" />
                    </div>
                    <div>
                      <label className="label">Odor</label>
                      <input {...register('odor')} className="input" placeholder="None, sulphurous…" />
                    </div>
                    <div>
                      <label className="label">Soil Type</label>
                      <input {...register('soil_type')} className="input" placeholder="Laterite, alluvial…" />
                    </div>
                  </div>
                </div>

                {/* Condition + Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Condition Rating (1–5)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((n) => (
                        <label key={`rating-${n}`} className="cursor-pointer">
                          <input {...register('condition_rating')} type="radio" value={n} className="sr-only" />
                          <span className={`text-2xl ${watch('condition_rating') == n ? 'opacity-100' : 'opacity-30'} hover:opacity-100 transition-opacity`}>
                            ⭐
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Field Notes</label>
                    <textarea {...register('notes')} rows={3} className="input resize-none"
                      placeholder="Observations, surrounding land use, vegetation…" />
                  </div>
                  <div>
                    <label className="label">Recommendations</label>
                    <textarea {...register('recommendations')} rows={3} className="input resize-none"
                      placeholder="Suggested interventions, follow-up actions…" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg">
                    {isSubmitting ? 'Submitting…' : <><CheckCircle size={16} /> Submit Survey</>}
                  </button>
                  <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-secondary btn-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Survey list */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Survey Records</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={`skeleton-${i}`} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : surveys.length ? (
          <div className="space-y-2">
            {surveys.map((s) => {
              const sc = getStatusConfig(s.status);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer"
                  onClick={() => setSelectedSurvey(selectedSurvey?.id === s.id ? null : s)}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {s.spring_name || 'Unnamed Spring'} — {s.village_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.surveyor_name} · {formatDate(s.survey_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={sc.badge}>{sc.label}</span>
                    {s.status !== 'verified' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); verifyMutation.mutate(s.id); }}
                        className="btn-secondary btn-sm"
                      >
                        Verify
                      </button>
                    )}
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No surveys yet. Click <strong>New Survey</strong> to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
