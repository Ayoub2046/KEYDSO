import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-navy-900 border-b border-navy-800 flex items-center justify-between px-6 text-white sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-lg text-white shadow-sm">
          KM
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight tracking-wide text-white">KEYDSO MAANTA</h1>
          <p className="text-xs text-slate-400 hidden sm:block">University Student Representative Council</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-100 flex items-center gap-1.5 justify-end">
                <span>{user.full_name}</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xs text-sky-300">
                {user.roles?.join(' • ') || 'Student'}
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-navy-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-5 h-5 text-slate-300" />
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
