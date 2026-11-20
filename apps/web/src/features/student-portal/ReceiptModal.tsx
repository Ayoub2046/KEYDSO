import React from 'react';
import { StudentReceipt } from '@keydso/shared-types';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  receipt: StudentReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="bg-navy-950 text-white p-6 relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-sky-600 flex items-center justify-center font-bold text-xs text-white">
                KM
              </span>
              <span className="font-bold tracking-wide text-sm">KEYDSO MAANTA</span>
            </div>
            <h3 className="text-xl font-bold mt-2">Official Payment Receipt</h3>
            <p className="text-xs text-slate-400">Student Representative Council Treasury</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Receipt Number</span>
              <div className="font-mono font-bold text-base text-sky-700">{receipt.receipt_number}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Issue Date</span>
              <div className="text-xs font-medium text-slate-700">{new Date(receipt.issued_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Student Name:</span>
              <div className="font-semibold text-slate-900 text-sm mt-0.5">{receipt.student_name}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">University Student ID:</span>
              <div className="font-mono font-semibold text-slate-900 text-sm mt-0.5">{receipt.student_id_number}</div>
            </div>
          </div>

          {/* Campaign & Amount */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500 font-medium">Campaign Purpose:</span>
              <span className="font-semibold text-slate-900 text-right">{receipt.campaign_title}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Payment Method:</span>
              <span className="font-mono font-semibold text-slate-800">{receipt.payment_method}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Total Verified Paid:</span>
              <span className="font-bold text-xl text-emerald-600">${receipt.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Verification Badge & Signature */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-800">
              <span className="font-bold">Verified & Ratified Transaction</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Authorized by {receipt.issued_by_name} under Council Accounting Ledger rules.
              </p>
            </div>
          </div>

          {/* Cryptographic Signature Hash */}
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>HMAC Cryptographic Integrity Seal:</span>
            </div>
            <div className="font-mono break-all bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">
              {receipt.signature_hash}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
