import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Faculty, Department, IssueReport, MeetingAndTraining, Committee } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  AlertTriangle,
  Calendar,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Plus,
  BookOpen,
} from 'lucide-react';

export const FacultyWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [meetings, setMeetings] = useState<MeetingAndTraining[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [facs, issuesRes, meetingsRes, commsRes] = await Promise.all([
          api.getFaculties(),
          api.getIssues(),
          api.getMeetings(),
          api.getCommittees(),
        ]);

        const assignedFac =
          facs.find((f) => f.id === user?.assigned_faculty_id) || facs[0];
        setFaculty(assignedFac);

        if (assignedFac) {
          const depts = await api.getDepartments(assignedFac.id);
          setDepartments(depts);
          setIssues(issuesRes.filter((i) => i.faculty_id === assignedFac.id));
          setMeetings(meetingsRes.filter((m) => m.faculty_id === assignedFac.id));
          setCommittees(commsRes.filter((c) => c.faculty_id === assignedFac.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              <Building2 className="w-4 h-4" />
              Faculty Representative Workspace
            </div>
            <h1 className="text-2xl font-bold">{faculty?.name || 'Assigned Faculty'}</h1>
            <p className="text-sm text-slate-300 mt-1">
              Representative Office of {user?.full_name} • Faculty President
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/governance/challenges"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Faculty Challenges
            </Link>
            <Link
              to="/governance/meetings"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/20"
            >
              <Calendar className="w-4 h-4" />
              Propose Assembly
            </Link>
          </div>
        </div>
      </div>

      {/* Faculty Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Academic Departments</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Under faculty jurisdiction</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Open Faculty Grievances</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{issues.filter((i) => i.status !== 'RESOLVED').length}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Pending resolution</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Scheduled Assemblies</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{meetings.length}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">Faculty forums & sessions</div>
        </div>
      </div>

      {/* Departments & Issues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            Registered Academic Departments
          </h2>

          <div className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <div key={dept.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{dept.name}</div>
                  <div className="text-xs font-mono text-slate-400">Code: {dept.code}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Active Challenges */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Faculty Challenges in Progress
            </h2>
            <Link to="/governance/challenges" className="text-xs font-semibold text-sky-600 hover:underline">
              View All
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No reported challenges currently active in this faculty.
            </div>
          ) : (
            <div className="space-y-3">
              {issues.slice(0, 4).map((issue) => (
                <div key={issue.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-600">{issue.reference_number}</span>
                    <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                      {issue.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{issue.title}</div>
                  <p className="text-slate-500 mt-0.5 line-clamp-1">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
