import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentPortalOverview, StudentReceipt } from '@keydso/shared-types';
import {
  GraduationCap,
  DollarSign,
  Receipt,
  Users,
  Megaphone,
  MessageSquarePlus,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { useNavigate } from 'react-router-dom';

export const StudentPortalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentPortalOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<StudentReceipt | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPortalOverview();
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (isLoading || !data) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading Student Portal...</div>;
  }

  const { student, total_expected, total_paid, total_remaining, campaigns, recent_receipts, representatives, announcements } = data;

  return (
    <div className="space-y-6">
      {/* Student Profile Header Card */}
      <div className="bg-gradient-to-r from-navy-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-xl shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{student.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student.enrollment_status}
                </span>
              </div>
              <p className="text-xs text-sky-300 font-mono mt-0.5">
                ID: {student.student_id_number} • {student.faculty_name} ({student.department_name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Submit Issue to Reps</span>
            </button>
            <button
              onClick={() => navigate('/portal/transparency')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Spending Transparency</span>
            </button>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Obligations</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">${total_expected.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">Assessed semester contributions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Verified Collections</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">${total_paid.toFixed(2)}</div>
          <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Officially verified by Finance</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Remaining Balance</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">${total_remaining.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">
            {total_remaining === 0 ? 'All dues up to date' : 'Outstanding contribution obligation'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Contributions & Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-sky-600" />
                <span>My Active Contribution Campaigns</span>
              </h3>
              <button
                onClick={() => navigate('/portal/contributions')}
                className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Full Breakdown</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {campaigns.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No active campaigns applicable at this time.</p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div key={camp.campaign_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{camp.campaign_title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{camp.campaign_purpose}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          camp.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400">Assessed:</span>
                        <div className="font-bold text-slate-800">${camp.expected_amount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Paid:</span>
                        <div className="font-bold text-emerald-600">${camp.verified_paid_amount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Remaining:</span>
                        <div className="font-bold text-amber-600">${camp.remaining_balance.toFixed(2)}</div>
                      </div>
                    </div>

                    {camp.payments.length > 0 && (
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Latest Payment: {camp.payments[0].transaction_reference}
                        </span>
                        {camp.payments[0].receipt_number && (
                          <button
                            onClick={async () => {
                              const rec = await api.getReceipt(camp.payments[0].receipt_number!);
                              setSelectedReceipt(rec);
                            }}
                            className="text-sky-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt #{camp.payments[0].receipt_number}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <span>Official Student Council Announcements</span>
            </h3>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 font-mono">{ann.category}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ann.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{ann.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Representative Directory Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>My Representatives</span>
              </h3>
              <button
                onClick={() => navigate('/portal/representatives')}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {representatives.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{rep.full_name}</h4>
                    <p className="text-xs font-semibold text-sky-700">{rep.role_title}</p>
                    <p className="text-xs text-slate-500 mt-1">{rep.bio || 'Available for student advocacy'}</p>
                    {rep.office_hours && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{rep.office_hours}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200">
                    {rep.contact_number && (
                      <a
                        href={`tel:${rep.contact_number}`}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 flex items-center gap-1 shadow-sm"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>Call</span>
                      </a>
                    )}

                    {rep.email && (
                      <a
                        href={`mailto:${rep.email}`}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 flex items-center gap-1 shadow-sm"
                      >
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>Email</span>
                      </a>
                    )}

                    {rep.whatsapp_number && (
                      <a
                        href={`https://wa.me/${rep.whatsapp_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />

      {/* Student Feedback Modal */}
      <StudentFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitted={() => {
          setNotificationMsg('Your concern was submitted to the representative council and recorded in the audit trail.');
          setTimeout(() => setNotificationMsg(null), 6000);
        }}
      />
    </div>
  );
};
