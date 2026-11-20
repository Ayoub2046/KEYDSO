import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PublicExpenseSummary } from '@keydso/shared-types';
import { ShieldCheck, FileText, CheckCircle2, Building, DollarSign } from 'lucide-react';

export const TransparencyFeedPage: React.FC = () => {
  const [items, setItems] = useState<PublicExpenseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getTransparencyFeed().then((feed) => {
      setItems(feed);
      setIsLoading(false);
    });
  }, []);

  const totalSpent = items.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          <span>Expenditure Transparency & Procurement Audit</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Every purchase made using university student contributions is documented here with approved vendor invoices and verified delivery evidence.
        </p>
      </div>

      {/* Overview Stat */}
      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total Verified Purchases Made for Students
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1">${totalSpent.toFixed(2)}</div>
        </div>
        <div className="text-xs text-emerald-800 max-w-md">
          "Every dollar collected from university students is accounted for. Expenditures require dual council approvals and attached vendor receipts before release."
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading transparency feed...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No expenditures published yet for this semester.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-sky-700 font-mono">{item.campaign_title}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.expense_title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-900">${item.amount.toFixed(2)}</div>
                  <span className="text-[11px] text-slate-400">
                    Disbursed: {new Date(item.disbursed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Purpose & Justification:</span>
                  <p className="text-slate-700 mt-0.5 font-medium leading-relaxed">{item.purpose}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Vendor / Supplier:</span>
                  <div className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.vendor_name}</span>
                  </div>
                </div>
              </div>

              {/* Evidence Files */}
              {item.evidence_files && item.evidence_files.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Verified Purchase Proof & Receipts ({item.evidence_files.length})
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.evidence_files.map((file, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span>{file.file_name}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
