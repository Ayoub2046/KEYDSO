import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentPortalOverview, StudentReceipt } from '@keydso/shared-types';
import { DollarSign, Receipt, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

export const StudentContributionsPage: React.FC = () => {
  const [data, setData] = useState<StudentPortalOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<StudentReceipt | null>(null);

  useEffect(() => {
    api.getPortalOverview().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !data) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading contribution records...</div>;
  }

  const { campaigns, total_expected, total_paid, total_remaining } = data;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-sky-600" />
          <span>My Financial Contribution Obligations & Receipts</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Detailed statement of campaigns assessed to your cohort, payments recorded, and official digital receipts.
        </p>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Assessed</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">${total_expected.toFixed(2)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Verified Paid</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">${total_paid.toFixed(2)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Remaining Liability</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">${total_remaining.toFixed(2)}</div>
        </div>
      </div>

      {/* Campaigns and line-item breakdown */}
      <div className="space-y-6">
        {campaigns.map((camp) => (
          <div key={camp.campaign_id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-sky-700">{camp.campaign_type}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{camp.campaign_title}</h3>
                <p className="text-xs text-slate-500">{camp.campaign_purpose}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  camp.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {camp.status}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pb-4 border-b border-slate-100">
                <div>
                  <span className="text-slate-400">Assessed Dues:</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">${camp.expected_amount.toFixed(2)}</div>
                </div>

                <div>
                  <span className="text-slate-400">Verified Paid:</span>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">${camp.verified_paid_amount.toFixed(2)}</div>
                </div>

                <div>
                  <span className="text-slate-400">Waivers / Sponsorships:</span>
                  <div className="text-base font-bold text-slate-700 mt-0.5">
                    ${(camp.waived_amount + camp.sponsored_amount).toFixed(2)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Remaining Due:</span>
                  <div className="text-base font-bold text-amber-600 mt-0.5">${camp.remaining_balance.toFixed(2)}</div>
                </div>
              </div>

              {/* Transactions Table for this campaign */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Transaction & Payment History
                </h4>

                {camp.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No payments recorded yet for this campaign.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Reference</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Verification Status</th>
                          <th className="p-3 text-right">Official Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {camp.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-3 font-mono font-semibold text-slate-800">{p.transaction_reference}</td>
                            <td className="p-3 text-slate-600">{p.payment_method}</td>
                            <td className="p-3 text-slate-600">{p.payment_date}</td>
                            <td className="p-3 font-bold text-slate-900">${p.amount.toFixed(2)}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {p.receipt_number ? (
                                <button
                                  onClick={async () => {
                                    const rec = await api.getReceipt(p.receipt_number!);
                                    setSelectedReceipt(rec);
                                  }}
                                  className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded text-xs font-semibold hover:bg-sky-100 inline-flex items-center gap-1"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Pending verification</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
};
