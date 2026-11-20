import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment, ContributionCampaign, RoleName } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Receipt,
  RotateCcw,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const PaymentVerificationQueue: React.FC = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'REVERSED'>('PENDING');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsRes, campRes] = await Promise.all([
        api.getPayments({
          status: statusFilter,
          campaign_id: selectedCampaignId || undefined,
        }),
        api.getCampaigns(),
      ]);
      setPayments(paymentsRes);
      setCampaigns(campRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedCampaignId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingPayment) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await api.verifyPayment(verifyingPayment.id, {
        verification_note: verificationNote.trim() || undefined,
      });

      setSuccessMsg(
        `Payment verified! Official Receipt ${res.receipt.receipt_number} generated with cryptographic signature: ${res.receipt.signature_hash.substring(0, 16)}...`
      );
      setVerifyingPayment(null);
      setVerificationNote('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 5) {
      setError('A comprehensive auditable reason is required for payment reversal (min 5 characters).');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await api.reversePayment(reversingPayment.id, {
        reversal_reason: reversalReason.trim(),
      });

      setSuccessMsg(`Payment ${reversingPayment.transaction_reference} reversed. Compensating DEBIT ledger entry created.`);
      setReversingPayment(null);
      setReversalReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Payment reversal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.transaction_reference.toLowerCase().includes(q) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.student_id_number && p.student_id_number.toLowerCase().includes(q)) ||
      (p.receipt_number && p.receipt_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            Payment Verification Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct independent secondary review to verify intake, issue cryptographically signed receipts, and credit treasury funds.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'PENDING'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'VERIFIED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified History
          </button>
          <button
            onClick={() => setStatusFilter('REVERSED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              statusFilter === 'REVERSED'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reversed
          </button>
        </div>
      </div>

      {/* Four-Eyes Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block text-amber-900 text-sm">Separation of Duties Rule (Four-Eyes Principle)</strong>
          Per the Financial Regulations of the Student Representative Council, a financial officer who records a payment cannot verify it.
          Verification must be conducted by another authorized officer who confirms the receipt voucher or transaction slip before an official receipt is issued.
        </div>
      </div>

      {/* Notifications */}
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

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by transaction reference, student ID, student name, or receipt #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 p-8">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No {statusFilter.toLowerCase()} payments found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {statusFilter === 'PENDING'
                ? 'All student contribution intakes have been verified. Great job!'
                : `No records in ${statusFilter.toLowerCase()} status.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isSelfRecorded = p.recorded_by === user?.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                        {p.payment_date}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.student_name || 'Student'}</div>
                        <div className="text-xs font-mono text-slate-500">{p.student_id_number}</div>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-slate-700 max-w-xs truncate">
                        {p.campaign_title || 'General Campaign'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">${p.amount}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">{p.payment_method}</div>
                        <div className="text-xs font-mono text-slate-500">{p.transaction_reference}</div>
                        {p.receipt_number && (
                          <div className="text-xs font-mono text-emerald-600 font-bold mt-0.5">
                            {p.receipt_number}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{p.recorded_by_name || 'Finance Officer'}</div>
                        {isSelfRecorded && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded text-[10px]">
                            You recorded this
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setVerifyingPayment(p);
                                setVerificationNote('');
                              }}
                              disabled={isSelfRecorded}
                              title={isSelfRecorded ? 'Separation of Duties: You cannot verify a payment you recorded' : 'Verify & issue receipt'}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify
                            </button>

                            <button
                              onClick={() => {
                                setReversingPayment(p);
                                setReversalReason('');
                              }}
                              className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold border border-rose-200 transition"
                            >
                              Void
                            </button>
                          </div>
                        ) : p.status === 'VERIFIED' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verified
                            </span>
                            <button
                              onClick={() => {
                                setReversingPayment(p);
                                setReversalReason('');
                              }}
                              title="Reverse payment & create debit ledger adjustment"
                              className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition"
                            >
                              Reverse
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 justify-end">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reversed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Verify Payment & Issue Receipt
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Confirm physical receipt of funds. This action will issue an official digitally-signed receipt and post an immutable CREDIT entry to the fund ledger.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-900">{verifyingPayment.student_name} ({verifyingPayment.student_id_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campaign:</span>
                <span className="font-semibold text-slate-900">{verifyingPayment.campaign_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-700 text-sm">${verifyingPayment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-800">{verifyingPayment.transaction_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded By:</span>
                <span className="text-slate-700">{verifyingPayment.recorded_by_name}</span>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Note / Physical Audit Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank slip #9802 physically inspected and stamped"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyingPayment(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? 'Verifying...' : 'Confirm Verification & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-rose-900 mb-1 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              Reverse / Void Payment
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Reversing a payment writes an auditable compensating DEBIT entry to the general ledger and rolls back the student's contribution obligation balance.
            </p>

            <form onSubmit={handleReverse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auditable Reason for Reversal * (min 5 characters)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this payment is being reversed (e.g. duplicate transaction recorded in error, bounced cheque, counter-error)..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || reversalReason.trim().length < 5}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Reversing...' : 'Execute Payment Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
