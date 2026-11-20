import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StudentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const StudentFeedbackModal: React.FC<StudentFeedbackModalProps> = ({ isOpen, onClose, onSubmitted }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'ACADEMIC' | 'INFRASTRUCTURE' | 'WELFARE' | 'ADMINISTRATIVE' | 'FINANCIAL' | 'OTHER'>('ACADEMIC');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await api.submitFeedback({
        title,
        category,
        priority,
        description,
      });
      setTitle('');
      setDescription('');
      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Submit Concern or Feedback</h3>
            <p className="text-xs text-slate-400">Directly routed to your faculty and central council representatives</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Issue Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Broken AC in Lecture Hall 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="ACADEMIC">Academic</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="WELFARE">Student Welfare</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="FINANCIAL">Financial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide specific details, room numbers, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Submitting...' : 'Submit to Council'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
