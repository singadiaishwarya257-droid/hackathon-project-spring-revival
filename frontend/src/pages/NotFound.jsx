import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gov-blue flex flex-col items-center justify-center text-white text-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6">
          <Droplets size={36} />
        </div>
        <h1 className="text-8xl font-display font-bold text-primary-400 mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          This spring seems to have dried up. The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20">
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/dashboard" className="btn-primary">
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
