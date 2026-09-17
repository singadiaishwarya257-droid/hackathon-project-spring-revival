import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Droplets, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Password required'),
});

export default function Login() {
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gov-blue to-[#0f3d2e] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Droplets size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-3">Spring Revival</h1>
          <p className="text-primary-200 text-lg mb-2">AI Recharge Planning Platform</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Smart India Hackathon 2026<br />Ministry of Tribal Affairs, GoI
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {['Admin · admin@springrevival.gov', 'Officer · officer1@springrevival.gov', 'Surveyor · surveyor1@springrevival.gov']
              .map((hint) => (
                <div key={hint} className="bg-white/10 rounded-lg px-4 py-2 text-xs text-gray-300 border border-white/10">
                  🔑 {hint}
                </div>
              ))}
            <p className="text-xs text-gray-500 text-center mt-1">Demo passwords: Admin@123456 / Officer@123456 / Surveyor@123456</p>
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Droplets size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">Spring Revival</span>
          </div>

          <div className="card shadow-lg">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the platform</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@springrevival.gov.in"
                  className={errors.email ? 'input-error' : 'input'}
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${errors.password ? 'input-error' : 'input'} pr-10`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <><LogIn size={18} /> Sign In</>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">Register here</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Protected by JWT authentication • Role-based access control
          </p>
        </motion.div>
      </div>
    </div>
  );
}
