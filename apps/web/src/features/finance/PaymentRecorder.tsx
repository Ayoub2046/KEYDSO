import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ContributionCampaign, Student, PaymentMethod } from '@keydso/shared-types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  User,
  Building,
  Check,
} from 'lucide-react';

export const PaymentRecorder: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedPayment, setRecordedPayment] = useState<any | null>(null);

  const generateIdemp = () => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const [formData, setFormData] = useState({
    campaign_id: '',
    amount: 25,
    payment_method: 'CASH' as PaymentMethod,
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    idempotency_key: generateIdemp(),
    notes: '',
  });

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await api.getCampaigns();
        const activeCamps = data.filter((c) => c.status === 'ACTIVE');
        setCampaigns(activeCamps);
        if (activeCamps.length > 0) {
          setFormData((prev) => ({
            ...prev,
            campaign_id: activeCamps[0].id,
            amount: activeCamps[0].contribution_amount,
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load active campaigns');
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      const res = await api.getStudents({ search: searchQuery.trim(), page_size: 5 });
      setSearchResults(res.items);
      if (res.items.length === 0) {
        setError(`No students found matching "${searchQuery}"`);
      }
    } catch (err: any) {
      setError(err.message || 'Student search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleCampaignChange = (campaignId: string) => {
    const camp = campaigns.find((c) => c.id === campaignId);
    setFormData((prev) => ({
      ...prev,
      campaign_id: campaignId,
      amount: camp ? camp.contribution_amount : prev.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please search and select a student first');
      return;
    }
    if (!formData.transaction_reference.trim()) {
      setError('Transaction reference / Receipt voucher reference is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payment = await api.recordPayment({
        student_id: selectedStudent.id,
        campaign_id: formData.campaign_id,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        transaction_reference: formData.transaction_reference.trim(),
        idempotency_key: formData.idempotency_key,
        notes: formData.notes.trim() || undefined,
      });

      setRecordedPayment(payment);
      // Reset form
      setSelectedStudent(null);
      setSearchQuery('');
      setSearchResults([]);
      setFormData((prev) => ({
        ...prev,
        transaction_reference: '',
        idempotency_key: generateIdemp(),
        notes: '',
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-sky-600" />
          Record Student Contribution Intake
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Record cash, mobile money, or bank transfer contributions received from students.
        </p>

        {/* Four-Eyes Security Notice */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-amber-900">Mandatory Four-Eyes Verification Policy</strong>
            Payments recorded here enter a <span className="font-semibold">PENDING</span> state. In accordance with council financial rules,
            the officer who records an intake cannot verify it. Another authorized finance officer must independently review and verify it to issue the official receipt and credit the fund ledger.
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {recordedPayment && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800 mb-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Payment Successfully Recorded in PENDING Queue!
          </div>
          <p className="text-xs text-emerald-700 mb-3">
            Transaction Reference: <strong className="font-mono">{recordedPayment.transaction_reference}</strong> | Amount: <strong className="font-semibold">${recordedPayment.amount}</strong>
          </p>
          <div className="text-xs bg-white/80 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
            <span className="text-slate-600">
              Assigned Payment ID: <span className="font-mono text-slate-800">{recordedPayment.id}</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">
              Status: PENDING VERIFICATION
            </span>
          </div>
        </div>
      )}

      {/* Main Intake Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* Step 1: Student Lookup */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Step 1: Student Identification
          </label>

          {!selectedStudent ? (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Student ID (e.g. STU-2024-001) or full name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Find Student'}
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {searchResults.map((stu) => (
                    <div
                      key={stu.id}
                      onClick={() => {
                        setSelectedStudent(stu);
                        setSearchResults([]);
                      }}
                      className="p-3 hover:bg-sky-50 cursor-pointer flex items-center justify-between transition text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {stu.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{stu.full_name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {stu.student_id_number} • {stu.faculty_name} ({stu.department_name})
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md hover:bg-sky-200"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {selectedStudent.full_name}
                    <span className="text-xs px-2 py-0.5 bg-sky-200 text-sky-900 rounded font-mono">
                      {selectedStudent.student_id_number}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Faculty of {selectedStudent.faculty_name || 'N/A'} • {selectedStudent.department_name || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-xs text-slate-600 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:border-rose-300 transition"
              >
                Change Student
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Payment Parameters */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Step 2: Transaction Details
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Campaign *</label>
              <select
                value={formData.campaign_id}
                onChange={(e) => handleCampaignChange(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (${c.contribution_amount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($) *</label>
              <input
                type="number"
                min={1}
                step={0.5}
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="CASH">Cash Deposit</option>
                <option value="MOBILE_MONEY">Mobile Money (EVC / Zaad / Sahal)</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="OTHER">Other Form</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Slip # *</label>
              <input
                type="text"
                required
                placeholder="e.g. EVC-25261-TX990"
                value={formData.transaction_reference}
                onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Idempotency Key (Conflict Guard)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, idempotency_key: generateIdemp() })}
                  className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={formData.idempotency_key}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Notes / Audit Memo</label>
              <input
                type="text"
                placeholder="e.g. Received at campus counter window 2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              All transactions are auditable and cryptographically signed upon verification.
            </span>
            <button
              type="submit"
              disabled={submitting || !selectedStudent || !formData.transaction_reference}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment Intake'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
