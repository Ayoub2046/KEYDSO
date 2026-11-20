import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LedgerEntry, Fund } from '@keydso/shared-types';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Filter,
  ShieldCheck,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const LedgerViewer: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fundsRes, ledgerRes] = await Promise.all([
        api.getFunds(),
        api.getLedger({
          fund_id: selectedFundId || undefined,
          page,
          page_size: pageSize,
        }),
      ]);
      setFunds(fundsRes);
      setEntries(ledgerRes.items);
      setTotal(ledgerRes.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load general ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFundId, page]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-sky-600" />
            General Fund Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable, double-entry financial audit journal tracking every contribution intake, expenditure, and compensating reversal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFundId}
            onChange={(e) => {
              setSelectedFundId(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Treasury Funds</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Immutability & Audit Guarantee Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-start gap-3 text-xs shadow-sm">
        <Lock className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-sm font-semibold text-sky-300 block">Append-Only Immutability Invariant</strong>
          Financial integrity rule: Records in this ledger are strictly write-once and mathematically immutable.
          Transactions cannot be edited or silently deleted by any user or administrator. Corrective accounting is performed exclusively via auditable compensating reversal entries.
        </div>
      </div>

      {/* Fund Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {funds.map((fund) => (
          <div
            key={fund.id}
            onClick={() => {
              setSelectedFundId(selectedFundId === fund.id ? '' : fund.id);
              setPage(1);
            }}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              selectedFundId === fund.id
                ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-mono font-bold uppercase">{fund.code}</span>
              <span>{fund.ledger_entry_count || 0} entries</span>
            </div>
            <div className="font-bold text-slate-900 text-base">{fund.name}</div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Current Balance</div>
                <div className="text-xl font-extrabold text-slate-900">
                  ${Number(fund.current_balance || 0).toLocaleString()}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +${Number(fund.total_credits || 0).toLocaleString()}
                </div>
                <div className="text-rose-600 font-semibold flex items-center justify-end gap-0.5">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> -${Number(fund.total_debits || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No ledger entries recorded</h3>
            <p className="text-sm text-slate-500 mt-1">
              Treasury entries will appear here as payments are verified or expenditures disbursed.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Fund</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Audit Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => {
                    const isCredit = entry.entry_type === 'CREDIT';

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {entry.fund_name || 'Treasury'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                            {entry.entry_type}
                          </span>
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-bold font-mono whitespace-nowrap ${
                            isCredit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'}${entry.amount.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ${entry.balance_after.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className="font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                            {entry.reference_type}
                          </span>
                          <span className="font-mono text-slate-400 ml-1.5 text-[11px]">
                            {entry.reference_id.substring(0, 8)}...
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-600 max-w-md truncate">
                          {entry.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing entries {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
