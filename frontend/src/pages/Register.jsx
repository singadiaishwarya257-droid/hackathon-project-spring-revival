import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Droplets, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Lakshadweep','Delhi','Puducherry','Ladakh','Jammu & Kashmir',
];

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm:  z.string(),
  role:     z.enum(['surveyor', 'officer']),
  district: z.string().min(2, 'District required'),
  state:    z.string().min(2, 'State required'),
  phone:    z.string().optional(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export default function Register() {
  const [showPw, setShowPw] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'surveyor' },
  });

  const onSubmit = async ({ confirm, ...data }) => {
    try {
      const user = await registerUser(data);
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Droplets size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">Spring Revival</span>
          </div>
          <p className="text-gray-500 text-sm">Create your field officer account</p>
        </div>

        <div className="card shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row: Name + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name *</label>
                <input {...register('name')} className={errors.name ? 'input-error' : 'input'}
                  placeholder="Ravi Kumar" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Role *</label>
                <select {...register('role')} className="input">
                  <option value="surveyor">Field Surveyor</option>
                  <option value="officer">District Officer</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <input {...register('email')} type="email"
                className={errors.email ? 'input-error' : 'input'}
                placeholder="you@gov.in" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input {...register('password')} type={showPw ? 'text' : 'password'}
                    className={`${errors.password ? 'input-error' : 'input'} pr-9`}
                    placeholder="Min 8 chars" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input {...register('confirm')} type="password"
                  className={errors.confirm ? 'input-error' : 'input'}
                  placeholder="Repeat password" />
                {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">District *</label>
                <input {...register('district')}
                  className={errors.district ? 'input-error' : 'input'}
                  placeholder="Chikkamagaluru" />
                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
              </div>
              <div>
                <label className="label">State *</label>
                <select {...register('state')} className={errors.state ? 'input-error' : 'input'}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} className="input" placeholder="+91 98765 43210" />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full btn-lg mt-1">
              {isSubmitting ? 'Creating account…' : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
