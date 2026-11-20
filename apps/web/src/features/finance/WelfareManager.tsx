import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WelfareCase, Student } from '@keydso/shared-types';
import {
  HeartHandshake,
  Plus,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  User,
} from 'lucide-react';

export const WelfareManager: React.FC = () => {
  const [cases, setCases] = useState<WelfareCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Case Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [requestedAmount, setRequestedAmount] = useState(25);
  const [confidentialReason, setConfidentialReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWelfareCases();
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load welfare cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.getStudents({ search: searchQuery.trim(), page_size: 5 });
      setSearchResults(res.items);
    } catch (err: any) {
      setError(err.message || 'Student search failed');
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please search and select a student');
      return;
    }
    if (!confidentialReason.trim() || confidentialReason.trim().length < 10) {
      setError('Confidential justification must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createWelfareCase({
        student_id: selectedStudent.id,
        confidential_reason: confidentialReason.trim(),
        requested_amount: Number(requestedAmount),
      });

      setSuccessMsg(`Welfare case ${res.case_number} recorded in SUBMITTED status.`);
      setIsModalOpen(false);
      setSelectedStudent(null);
      setSearchQuery('');
      setSearchResults([]);
      setConfidentialReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit welfare case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-sky-600" />
            Student Welfare & Hardship Cases
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Confidential hardship assistance, waiver approvals, and emergency student council support.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Submit Welfare Case
        </button>
      </div>

      {/* Confidentiality Privacy Banner */}
      <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl flex items-start gap-3 text-xs">
        <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-sm font-semibold text-purple-900 block">Strict Privacy & Non-Disclosure Charter</strong>
          Hardship, bereavement, and medical welfare records contain sensitive personal data.
          Per council data privacy mandates, these records are restricted strictly to authorized executive officers and are permanently omitted from all public transparency feeds.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 p-8">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No active welfare cases</h3>
            <p className="text-sm text-slate-500 mt-1">
              Submit a case when a student experiences financial hardship requiring council support.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Case #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Requested Support</th>
                  <th className="py-3 px-4">Confidential Justification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                      {c.case_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.student_name || 'Student'}</div>
                      <div className="text-xs font-mono text-slate-500">{c.student_id_number}</div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      ${c.requested_amount}
                      {c.approved_amount > 0 && (
                        <div className="text-xs text-emerald-600 font-semibold">
                          Approved: ${c.approved_amount}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 max-w-sm truncate">
                      {c.confidential_reason}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {c.reviewer_name || 'Pending assignment'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-sky-600" />
              Register Hardship Case
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              All information recorded here is treated as confidential student welfare record.
            </p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              {!selectedStudent ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Search Student *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Student ID or Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Find
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {searchResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setSearchResults([]);
                          }}
                          className="p-2 text-xs hover:bg-sky-50 cursor-pointer flex justify-between"
                        >
                          <span className="font-semibold text-slate-900">{s.full_name}</span>
                          <span className="font-mono text-slate-500">{s.student_id_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900 block">{selectedStudent.full_name}</strong>
                    <span className="font-mono text-slate-600">{selectedStudent.student_id_number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Support ($) *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidential Hardship Justification * (min 10 characters)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the circumstances justifying financial assistance, waiver, or council sponsorship..."
                  value={confidentialReason}
                  onChange={(e) => setConfidentialReason(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedStudent}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register Welfare Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
