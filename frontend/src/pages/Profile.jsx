import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Lock, Save, Shield, Phone, MapPin, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getInitials, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const profileForm = useForm({
    defaultValues: {
      name:     user?.name || '',
      phone:    user?.phone || '',
      district: user?.district || '',
      state:    user?.state || '',
    },
  });

  const pwForm = useForm();

  const profileMutation = useMutation({
    mutationFn: (data) => api.put(`/users/${user.id}`, data),
    onSuccess: (res) => {
      updateUser(res.data.user);
      toast.success('Profile updated!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Update failed'),
  });

  const pwMutation = useMutation({
    mutationFn: (data) => api.patch(`/users/${user.id}/password`, data),
    onSuccess: () => { toast.success('Password changed!'); pwForm.reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Password change failed'),
  });

  const roleColors = { admin: 'badge-red', officer: 'badge-blue', surveyor: 'badge-green' };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <User size={22} className="text-primary-600" /> My Profile
        </h1>
        <p className="page-subtitle">Manage your account details and security</p>
      </div>

      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-gov-blue to-[#1a4a6b] text-white"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center text-2xl font-display font-bold shadow-lg flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">{user?.name}</h2>
            <p className="text-gray-300 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge ${roleColors[user?.role] || 'badge-gray'} capitalize`}>
                <Shield size={10} /> {user?.role}
              </span>
              {user?.district && (
                <span className="flex items-center gap-1 text-xs text-gray-300">
                  <MapPin size={11} /> {user.district}, {user.state}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={11} /> Joined {formatDate(user?.created_at)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'profile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={14} /> Profile Info
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'security' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock size={14} /> Security
        </button>
      </div>

      {/* Profile form */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Personal Information</h3>
          <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input {...profileForm.register('name')} className="input" />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Phone size={12} /> Phone</label>
                <input {...profileForm.register('phone')} className="input" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">District</label>
                <input {...profileForm.register('district')} className="input" placeholder="Chikkamagaluru" />
              </div>
              <div>
                <label className="label">State</label>
                <select {...profileForm.register('state')} className="input">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="label">Email (cannot change)</label>
                <input value={user?.email || ''} disabled className="input" />
              </div>
              <div>
                <label className="label">Role (assigned by admin)</label>
                <input value={user?.role || ''} disabled className="input capitalize" />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="btn-primary btn-lg"
            >
              <Save size={16} />
              {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Security form */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Change Password</h3>
          <form onSubmit={pwForm.handleSubmit((d) => pwMutation.mutate(d))} className="space-y-4 max-w-md">
            <div>
              <label className="label">Current Password</label>
              <input {...pwForm.register('currentPassword', { required: true })}
                type="password" className="input" placeholder="••••••••" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input {...pwForm.register('newPassword', { required: true, minLength: 8 })}
                type="password" className="input" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input {...pwForm.register('confirmPassword', {
                validate: (v) => v === pwForm.watch('newPassword') || 'Passwords must match'
              })} type="password" className="input" placeholder="Repeat new password" />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {pwForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pwMutation.isPending}
              className="btn-primary btn-lg"
            >
              <Lock size={16} />
              {pwMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          {/* Session info */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Session Info</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="font-medium text-gray-800 mt-0.5">{formatDate(user?.last_login) || 'First login'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Account Status</p>
                <span className="badge-green mt-0.5">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
