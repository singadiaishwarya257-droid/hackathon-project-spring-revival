import React from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="fixed inset-0 bg-gov-blue flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-6 shadow-glow"
      >
        <Droplets size={32} className="text-white" />
      </motion.div>
      <h2 className="text-white font-display font-bold text-xl mb-1">Spring Revival</h2>
      <p className="text-gray-400 text-sm">{message}</p>
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
