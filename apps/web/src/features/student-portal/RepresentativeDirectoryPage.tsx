import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RepresentativeInfo } from '@keydso/shared-types';
import { Users, Phone, Mail, Clock, MessageSquarePlus, ShieldCheck } from 'lucide-react';
import { StudentFeedbackModal } from './StudentFeedbackModal';

export const RepresentativeDirectoryPage: React.FC = () => {
  const [representatives, setRepresentatives] = useState<RepresentativeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    api.getRepresentatives().then((reps) => {
      setRepresentatives(reps);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-600" />
            <span>Student Representative Directory</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Verified leadership and faculty representatives elected to represent student interests.
          </p>
        </div>

        <button
          onClick={() => setShowFeedbackModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Submit Issue or Feedback</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading representative directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {representatives.map((rep) => (
            <div key={rep.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{rep.full_name}</h3>
                  <span className="text-xs font-semibold text-sky-700 font-mono">{rep.role_title}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">
                  {rep.full_name.charAt(0)}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                {rep.bio || 'Official Student Representative Council representative.'}
              </p>

              {rep.office_hours && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Office Availability: {rep.office_hours}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {rep.contact_number && (
                  <a
                    href={`tel:${rep.contact_number}`}
                    className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Call</span>
                  </a>
                )}

                {rep.email && (
                  <a
                    href={`mailto:${rep.email}`}
                    className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email</span>
                  </a>
                )}

                {rep.whatsapp_number && (
                  <a
                    href={`https://wa.me/${rep.whatsapp_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitted={() => alert('Your concern was submitted successfully!')}
      />
    </div>
  );
};
