import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { debounce } from '@/utils/helpers';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const doSearch = debounce(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    try {
      const { data } = await api.get(`/villages?search=${encodeURIComponent(q)}&limit=5`);
      setResults(data.villages || []);
      setShowResults(true);
    } catch { setResults([]); }
  }, 350);

  const handleChange = (e) => {
    setQuery(e.target.value);
    doSearch(e.target.value);
  };

  const selectResult = (v) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    navigate(`/map?village=${v.id}&lat=${v.latitude}&lng=${v.longitude}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 flex-shrink-0 z-20 relative">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="btn-ghost btn-icon lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search village, taluk (e.g. Sringeri, Chikkamagaluru)…"
          className="input pl-9 h-9 text-sm"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            {results.map((v) => (
              <button
                key={v.id}
                onMouseDown={() => selectResult(v)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 text-xs font-bold">🗺</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.taluk && `${v.taluk}, `}{v.district}, {v.state}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button className="btn-ghost btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="btn-ghost btn-icon" aria-label="Help">
          <HelpCircle size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
