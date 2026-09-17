import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, Brain, Map, BarChart3, Shield,
  ChevronRight, Leaf, Mountain, CloudRain, Users,
} from 'lucide-react';

const FEATURES = [
  { icon: Brain,     title: 'AI Suitability Scoring',   desc: 'ML-powered recharge scores (0–100) with confidence levels for every spring location.' },
  { icon: Map,       title: 'Interactive GIS Map',      desc: 'Leaflet maps with rainfall, elevation, slope, and heatmap layers for tribal areas.' },
  { icon: CloudRain, title: 'Real-time Weather Data',   desc: 'Live rainfall and weather from Open-Meteo API integrated into analysis pipeline.' },
  { icon: Mountain,  title: 'Terrain Analysis',         desc: 'SRTM elevation, slope, and aspect data from OpenTopoData for precise site assessment.' },
  { icon: Shield,    title: 'Field Survey Module',      desc: 'GPS-tagged field surveys with photo upload, water quality data, and Before/After comparison.' },
  { icon: BarChart3, title: 'PDF & CSV Reports',        desc: 'Export professional government reports for district officers and ministry review.' },
];

const STATS = [
  { val: '500+', label: 'Springs Mapped' },
  { val: '48',   label: 'Tribal Districts' },
  { val: '94%',  label: 'Model Accuracy' },
  { val: '12',   label: 'Indian States' },
];

const INTERVENTIONS = [
  { emoji: '🏞', label: 'Check Dams' },
  { emoji: '⛏', label: 'Recharge Pits' },
  { emoji: '〰', label: 'Contour Trenches' },
  { emoji: '💧', label: 'Percolation Tanks' },
  { emoji: '🌿', label: 'Spring Protection' },
  { emoji: '🪨', label: 'Gabion Structures' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-sm leading-tight">Spring Revival</p>
              <p className="text-[10px] text-gray-500">SIH 2026 • MoTA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 bg-gradient-to-br from-gov-blue via-[#1a4a6b] to-[#0f3d2e] overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-ocean-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Gov badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold
                       px-4 py-1.5 rounded-full border border-white/20 mb-6"
          >
            🇮🇳 Ministry of Tribal Affairs, Government of India
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-display font-bold text-white leading-tight mb-4 max-w-4xl mx-auto"
          >
            AI-Based Spring Revival &
            <span className="text-primary-400"> Recharge Planning</span>
            <br />for Tribal Areas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8"
          >
            An AI-powered GIS platform to identify, analyse, and prioritise spring recharge
            locations in tribal regions using rainfall, terrain, geology, and hydrology data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/register" className="btn-primary btn-lg">
              Start Mapping <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 btn-lg">
              Sign In
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mt-14"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-display font-bold text-primary-400">{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900">
              Complete GIS & AI Toolkit
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              Everything field officers and district planners need to revive tribal spring ecosystems.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-hover group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center mb-3
                                group-hover:bg-primary-600 transition-colors">
                  <f.icon size={20} className="text-primary-700 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interventions ───────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            AI-Recommended Interventions
          </h2>
          <p className="text-gray-500 mb-10">
            The model suggests the most suitable recharge structure based on terrain and hydrology.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {INTERVENTIONS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full
                           px-5 py-2.5 text-sm font-medium text-primary-800"
              >
                <span>{item.emoji}</span> {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-ocean-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Users size={40} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-display font-bold mb-3">
            Ready to Revive Your Springs?
          </h2>
          <p className="text-primary-100 mb-6">
            Join district officers, surveyors, and tribal welfare planners using AI-powered GIS
            to restore water security in tribal India.
          </p>
          <Link to="/register" className="btn bg-white text-primary-700 hover:bg-gray-100 font-semibold btn-lg shadow-lg">
            Create Free Account <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="bg-gov-blue text-gray-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf size={16} className="text-primary-500" />
          <span className="text-white font-semibold">Spring Revival</span>
        </div>
        <p>Smart India Hackathon 2026 · Ministry of Tribal Affairs, GoI</p>
        <p className="mt-1 text-xs text-gray-600">
          Open data: OpenStreetMap · Open-Meteo · OpenTopoData · Overpass API
        </p>
      </footer>
    </div>
  );
}
