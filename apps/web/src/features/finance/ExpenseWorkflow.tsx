import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Expense,
  ContributionCampaign,
  Fund,
  RoleName,
  ExpenseStatus,
} from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Building,
  Upload,
  Send,
  Eye,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const ExpenseWorkflow: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPresident = roles.includes(RoleName.GENERAL_PRESIDENT) || roles.includes(RoleName.SYSTEM_ADMIN);
  const isFinance = roles.includes(RoleName.FINANCE_OFFICER) || roles.includes(RoleName.SYSTEM_ADMIN);
  const canRequest =
    roles.includes(RoleName.FACULTY_PRESIDENT) ||
    roles.includes(RoleName.FINANCE_OFFICER) ||
    roles.includes(RoleName.SECRETARY) ||
    roles.includes(RoleName.COMMITTEE_CHAIR) ||
    roles.includes(RoleName.SYSTEM_ADMIN);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [statusTab, setStatusTab] = useState<'ALL' | ExpenseStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [approvingExpense, setApprovingExpense] = useState<Expense | null>(null);
  const [reconcilingExpense, setReconcilingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    title: '',
    purpose: '',
    description: '',
    campaign_id: '',
    fund_id: '',
    requested_amount: 100,
    vendor_name: '',
    vendor_contact: '',
  });

  // Approval Form State
  const [approvalAmount, setApprovalAmount] = useState<number>(0);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Reconcile Form State
  const [reconcileInvoiceNo, setReconcileInvoiceNo] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceFilePath, setEvidenceFilePath] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expRes, campRes, fundsRes] = await Promise.all([
        api.getExpenses(),
        api.getCampaigns(),
        api.getFunds(),
      ]);
      setExpenses(expRes);
      setCampaigns(campRes);
      setFunds(fundsRes);

      if (campRes.length > 0 && !requestForm.campaign_id) {
        setRequestForm((prev) => ({
          ...prev,
          campaign_id: campRes[0].id,
          fund_id: fundsRes[0]?.id || '',
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expense workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createExpenseRequest({
        ...requestForm,
        requested_amount: Number(requestForm.requested_amount),
      });
      setSuccessMsg('Expense procurement request submitted for presidential review!');
      setIsRequestModalOpen(false);
      setRequestForm({
        title: '',
        purpose: '',
        description: '',
        campaign_id: campaigns[0]?.id || '',
        fund_id: funds[0]?.id || '',
        requested_amount: 100,
        vendor_name: '',
        vendor_contact: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit expense request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingExpense) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.approveExpense(approvingExpense.id, {
        approved_amount: Number(approvalAmount),
        remarks: approvalRemarks.trim() || undefined,
      });
      setSuccessMsg(`Expense "${approvingExpense.title}" approved for $${approvalAmount}. Ready for disbursement.`);
      setApprovingExpense(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburse = async (expense: Expense) => {
    if (!confirm(`Confirm disbursement of $${expense.approved_amount} to ${expense.vendor_name}?\nThis will deduct the fund balance and create an immutable general ledger DEBIT entry.`)) {
      return;
    }
    try {
      setError(null);
      await api.disburseExpense(expense.id);
      setSuccessMsg(`Funds disbursed to ${expense.vendor_name}. General ledger debited $${expense.approved_amount}.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to disburse funds');
    }
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingExpense) return;

    try {
      setSubmitting(true);
      setError(null);
      const evidence = [
        {
          file_name: evidenceFileName || `Invoice_${reconcileInvoiceNo || 'INV'}.pdf`,
          file_path: evidenceFilePath || `expenses/invoices/${reconcileInvoiceNo || 'INV'}.pdf`,
          file_size_bytes: 256000,
          mime_type: 'application/pdf',
          is_public: true,
        },
      ];

      await api.reconcileExpense(reconcilingExpense.id, {
        evidence_files: evidence,
        invoice_number: reconcileInvoiceNo.trim() || undefined,
      });

      setSuccessMsg(
        `Expense reconciled! Evidence verified and automatically published to the Student Public Transparency Feed.`
      );
      setReconcilingExpense(null);
      setReconcileInvoiceNo('');
      setEvidenceFileName('');
      setEvidenceFilePath('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reconcile expense');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (statusTab === 'ALL') return true;
    return e.status === statusTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-sky-600" />
            Expenditure & Procurement Workflow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditable lifecycle: Request → Presidential Approval → Disbursement → Evidence Reconciliation & Public Transparency.
          </p>
        </div>

        {canRequest && (
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Request Expenditure
          </button>
        )}
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

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'REQUESTED', 'APPROVED', 'DISBURSED', 'RECONCILED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab === 'ALL' ? 'All Expenditures' : tab}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No expenditures found</h3>
          <p className="text-sm text-slate-500 mt-1">
            No records found in {statusTab === 'ALL' ? 'the system' : `${statusTab.toLowerCase()} status`}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExpenses.map((exp) => {
            const isRequested = exp.status === 'REQUESTED';
            const isApproved = exp.status === 'APPROVED';
            const isDisbursed = exp.status === 'DISBURSED';
            const isReconciled = exp.status === 'RECONCILED';

            return (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isReconciled
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDisbursed
                          ? 'bg-indigo-100 text-indigo-800'
                          : isApproved
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {exp.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {exp.id.substring(0, 8)}...
                    </span>
                    {exp.is_public_summary_published && (
                      <span className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-800 font-semibold rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Live in Student Feed
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{exp.title}</h3>
                  <p className="text-sm text-slate-600">{exp.purpose}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      Vendor: <strong className="text-slate-800">{exp.vendor_name}</strong>
                    </span>
                    <span>
                      Campaign: <strong className="text-slate-800">{exp.campaign_title || 'General'}</strong>
                    </span>
                    <span>
                      Fund: <strong className="text-slate-800">{exp.fund_name || 'Treasury'}</strong>
                    </span>
                    {exp.requesting_officer_name && (
                      <span>
                        Requested by: <strong className="text-slate-800">{exp.requesting_officer_name}</strong>
                      </span>
                    )}
                  </div>

                  {exp.evidence_files && exp.evidence_files.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 text-xs text-sky-700">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>
                        {exp.evidence_files.length} Verified Evidence Document(s) Attached
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      {isApproved || isDisbursed || isReconciled ? 'Approved Amount' : 'Requested Amount'}
                    </div>
                    <div className="text-xl font-extrabold text-slate-900">
                      ${exp.approved_amount || exp.requested_amount}
                    </div>
                    {exp.approved_amount && exp.approved_amount !== exp.requested_amount && (
                      <div className="text-[11px] text-slate-400">
                        (Requested: ${exp.requested_amount})
                      </div>
                    )}
                  </div>

                  {/* Actions per state */}
                  <div className="flex items-center gap-2">
                    {isRequested && isPresident && (
                      <button
                        onClick={() => {
                          setApprovingExpense(exp);
                          setApprovalAmount(exp.requested_amount);
                          setApprovalRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Presidential Review & Approval
                      </button>
                    )}

                    {isApproved && isFinance && (
                      <button
                        onClick={() => handleDisburse(exp)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Disburse Funds
                      </button>
                    )}

                    {isDisbursed && isFinance && (
                      <button
                        onClick={() => {
                          setReconcilingExpense(exp);
                          setReconcileInvoiceNo('');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Attach Invoice & Reconcile
                      </button>
                    )}

                    {isReconciled && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Reconciliation Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Request Council Expenditure</h2>
            <p className="text-xs text-slate-500 mb-4">
              Submit an expenditure request. Expenditures must be formally approved by the General President before any disbursement takes place.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT Lab Gigabit Switch Replacement"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Justification * (min 5 chars)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replace burned out hardware switches in computing lab"
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign *</label>
                  <select
                    value={requestForm.campaign_id}
                    onChange={(e) => setRequestForm({ ...requestForm, campaign_id: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fund Pool *</label>
                  <select
                    value={requestForm.fund_id}
                    onChange={(e) => setRequestForm({ ...requestForm, fund_id: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (${f.current_balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Amount ($) *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={requestForm.requested_amount}
                    onChange={(e) => setRequestForm({ ...requestForm, requested_amount: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechZone Supplies Ltd"
                    value={requestForm.vendor_name}
                    onChange={(e) => setRequestForm({ ...requestForm, vendor_name: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Contact (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +252 61 5554321 / sales@techzone.so"
                  value={requestForm.vendor_contact}
                  onChange={(e) => setRequestForm({ ...requestForm, vendor_contact: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approvingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-600" />
              Presidential Review & Sign-Off
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Review procurement request and verify fund solvency before granting executive authorization.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 mb-4">
              <div><strong>Expense:</strong> {approvingExpense.title}</div>
              <div><strong>Vendor:</strong> {approvingExpense.vendor_name}</div>
              <div><strong>Fund:</strong> {approvingExpense.fund_name}</div>
              <div><strong>Requested:</strong> ${approvingExpense.requested_amount}</div>
            </div>

            {approvalAmount > 500 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-start gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dual Sign-Off Threshold:</strong> Expenditures over $500 require executive General President confirmation per constitutional financial guidelines.
                </span>
              </div>
            )}

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Amount ($) *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={approvalAmount}
                  onChange={(e) => setApprovalAmount(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Remarks / Conditions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Approved subject to physical inspection upon delivery"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovingExpense(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Approving...' : 'Approve Expenditure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcilingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Reconcile Expense & Publish to Transparency Feed
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Attach verified vendor receipts, invoices, or delivery notes. Once reconciled, this expenditure is automatically published to the Student Transparency Feed.
            </p>

            <form onSubmit={handleReconcile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Invoice / Receipt Voucher # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-00892"
                  value={reconcileInvoiceNo}
                  onChange={(e) => setReconcileInvoiceNo(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechZone_Stamped_Receipt.pdf"
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Storage Path / URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. expenses/invoices/INV-2026-00892.pdf"
                  value={evidenceFilePath}
                  onChange={(e) => setEvidenceFilePath(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReconcilingExpense(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reconcileInvoiceNo || !evidenceFileName}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Reconciling...' : 'Complete Reconciliation & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
