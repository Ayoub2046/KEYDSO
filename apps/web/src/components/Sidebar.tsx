import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { RoleName } from '@keydso/shared-types';
import {
  Users,
  Building2,
  Shield,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  DollarSign,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isAdmin = roles.includes(RoleName.SYSTEM_ADMIN);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-sky-600 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-navy-950 border-r border-slate-800 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Student Portal
          </div>
          <nav className="space-y-1">
            <NavLink to="/portal" end className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Portal Dashboard</span>
            </NavLink>

            <NavLink to="/portal/contributions" className={navLinkClass}>
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>My Contributions</span>
            </NavLink>

            <NavLink to="/portal/representatives" className={navLinkClass}>
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>My Representatives</span>
            </NavLink>

            <NavLink to="/portal/transparency" className={navLinkClass}>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Spending Transparency</span>
            </NavLink>
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Directory
          </div>
          <nav className="space-y-1">
            <NavLink to="/students" className={navLinkClass}>
              <Users className="w-4 h-4 text-slate-400" />
              <span>Student Directory</span>
            </NavLink>
          </nav>
        </div>

        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Administration
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin/academic" className={navLinkClass}>
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Academic Hierarchy</span>
              </NavLink>

              <NavLink to="/admin/users" className={navLinkClass}>
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Users & Roles</span>
              </NavLink>

              <NavLink to="/admin/import" className={navLinkClass}>
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span>Bulk Student Import</span>
              </NavLink>

              <NavLink to="/admin/audit" className={navLinkClass}>
                <History className="w-4 h-4 text-cyan-400" />
                <span>Audit Logs</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Keydso Maanta PWA</p>
        <p className="mt-0.5">Phase 2: Student Portal Ready</p>
      </div>
    </aside>
  );
};
