import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AcademicYear, StudentImportResult } from '@keydso/shared-types';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_CSV = `student_id_number,full_name,faculty_code,department_code,class_name,contact_number,email
STU-2026-101,Amina Mohamed Warsame,CSIT,CS,Year 3 CS,+252615111111,amina@student.university.edu
STU-2026-102,Farah Ali Hassan,CSIT,SE,Year 2 SE,+252615222222,farah@student.university.edu
STU-2026-103,Maryam Ahmed Nuur,ENG,CIVIL,Year 4 Civil,+252615333333,maryam@student.university.edu
STU-2026-104,Osman Jama Bile,FBE,ACC,Year 1 Accounting,+252615444444,osman@student.university.edu`;

export const StudentBulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<StudentImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    api.getAcademicYears().then((years) => {
      setAcademicYears(years);
      if (years.length > 0) setSelectedYearId(years[0].id);
    });
  }, []);

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keydso_student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const record: any = {};
      headers.forEach((h, idx) => {
        record[h] = parts[idx] || '';
      });
      records.push(record);
    }
    return records;
  };

  const handleDryRun = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setValidationResult(null);

    const rows = parseCsvText(csvContent);
    if (rows.length === 0) {
      setErrorMsg('No valid rows detected in CSV. Please verify column headers and row entries.');
      setIsLoading(false);
      return;
    }
    setParsedRows(rows);

    try {
      const res = await api.bulkImportStudents({
        academic_year_id: selectedYearId,
        records: rows,
        dry_run: true,
      });
      setValidationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitImport = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.bulkImportStudents({
        academic_year_id: selectedYearId,
        records: parsedRows,
        dry_run: false,
      });
      setValidationResult(res);
      setImportSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Import commit failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-purple-600" />
            <span>Bulk Student Import Wizard</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Safely import student cohorts using validated CSV/XLSX files with mandatory dry-run preflight validation.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {importSuccess && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Import Batch Successfully Committed!</h3>
              <p className="text-sm text-emerald-700">
                {validationResult?.imported_count} student records have been inserted into the university directory with immutable audit records.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/students')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              View in Student Directory
            </button>
            <button
              onClick={() => {
                setImportSuccess(false);
                setValidationResult(null);
              }}
              className="px-4 py-2 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-100"
            >
              Import Another Batch
            </button>
          </div>
        </div>
      )}

      {!importSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration & Input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Target Academic Year
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} ({ay.code}) {ay.is_current ? '— [Current Active]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    CSV Data Stream / Paste
                  </label>
                  <span className="text-xs text-slate-400">Comma-separated with header row</span>
                </div>
                <textarea
                  rows={9}
                  value={csvContent}
                  onChange={(e) => {
                    setCsvContent(e.target.value);
                    setValidationResult(null);
                  }}
                  className="w-full font-mono text-xs p-3.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCsvContent(SAMPLE_CSV)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Sample Data</span>
                </button>

                <button
                  onClick={handleDryRun}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  <span>{isLoading ? 'Validating Batch...' : 'Run Preflight Dry-Run'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Preflight Summary */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>Preflight Inspection</span>
              </h3>

              {!validationResult ? (
                <div className="text-xs text-slate-500 leading-relaxed">
                  Run preflight dry-run to inspect the batch for duplicate student ID numbers, valid faculty and department codes, and format anomalies before writing to the database.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-slate-500">Total Rows</div>
                      <div className="text-lg font-bold text-slate-900 mt-1">{validationResult.total_rows}</div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-emerald-700">Valid Rows</div>
                      <div className="text-lg font-bold text-emerald-800 mt-1">{validationResult.valid_rows}</div>
                    </div>
                  </div>

                  {validationResult.error_count > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                      <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{validationResult.error_count} Errors Encountered</span>
                      </div>
                      <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside max-h-36 overflow-y-auto">
                        {validationResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.row} ({err.student_id_number || 'N/A'}): {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.valid_rows > 0 && validationResult.error_count === 0 && (
                    <div className="pt-2">
                      <button
                        onClick={handleCommitImport}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Commit {validationResult.valid_rows} Students to Database</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
