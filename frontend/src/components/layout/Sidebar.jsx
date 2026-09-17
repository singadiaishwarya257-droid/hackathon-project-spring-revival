import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, Droplets, Brain,
  ClipboardList, BarChart3, Settings, User,
  LogOut, X, ChevronRight, Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/utils/helpers';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map',       icon: Map,             label: 'GIS Map' },
  { to: '/analysis',  icon: Brain,           label: 'AI Analysis' },
  { to: '/survey',    icon: ClipboardList,   label: 'Field Survey' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gov-blue text-white w-64">
      {/* Logo */}
      <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
          <Droplets size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm leading-tight">Spring Revival</p>
          <p className="text-xs text-gray-300 truncate">AI Recharge Planning</p>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onClose(); }}
          className="ml-auto lg:hidden p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </Link>

      {/* Gov badge */}
      <div className="mx-3 mt-3 mb-1 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
        <p className="text-[10px] font-semibold text-gov-gold uppercase tracking-wider">Ministry of Tribal Affairs</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Government of India • SIH 2026</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scroll">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mt-1">
          Main Menu
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'nav-item-active' : 'nav-item-inactive'
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mt-3">
              Administration
            </p>
            {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            isActive ? 'nav-item-active' : 'nav-item-inactive'
          }
        >
          <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
          </div>
          <ChevronRight size={14} className="flex-shrink-0 opacity-50" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-item-inactive w-full text-left"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full z-40 lg:hidden flex"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
