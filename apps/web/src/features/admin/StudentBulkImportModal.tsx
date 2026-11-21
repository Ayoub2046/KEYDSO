import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { AcademicYear, StudentImportResult } from '@keydso/shared-types';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const SAMPLE_CSV = `full_name,student_id_number,faculty_code,department_code,class_name,contact_number,email
Abdiaziz Mohamed Mohamed,CIS231433,CSIT,CS,Class of 2026,+252615000001,abdiaziz@student.university.edu
Abdifitah abdullahi salah,CIS221714,CSIT,CS,Class of 2026,+252615000002,abdifitah@student.university.edu
Abdifitah Ahmed Mohamed,CIS241382,CSIT,CS,Class of 2026,+252615000003,ahmed@student.university.edu
abdifitah hassan mohamed,CIS231698,CSIT,CS,Class of 2026,+252615000004,hassan@student.university.edu`;

interface ParsedStudentRow {
  student_id_number: string;
  full_name: string;
  faculty_code: string;
  department_code: string;
  class_name: string;
  contact_number?: string;
  email?: string;
}

export const StudentBulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'template'>('upload');

  // Input states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);

  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [validationResult, setValidationResult] = useState<StudentImportResult | null>(null);

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    a.download = 'keydso_students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcelSample = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Full Name': 'Abdiaziz Mohamed Mohamed', 'Student ID': 'CIS231433' },
      { 'Full Name': 'Abdifitah abdullahi salah', 'Student ID': 'CIS221714' },
      { 'Full Name': 'Abdifitah Ahmed Mohamed', 'Student ID': 'CIS241382' },
      { 'Full Name': 'abdifitah hassan mohamed', 'Student ID': 'CIS231698' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'keydso_students_template.xlsx');
  };

  /**
   * Intelligently parses raw 2D array of rows into clean ParsedStudentRow objects
   */
  const processMatrixToStudents = (matrix: any[][]): ParsedStudentRow[] => {
    if (!matrix || matrix.length === 0) return [];

    // Filter out completely empty rows
    const cleanedMatrix = matrix.filter((row) =>
      row && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    if (cleanedMatrix.length === 0) return [];

    const firstRow = cleanedMatrix[0].map((c) => String(c || '').trim());

    // Check if the first row is a header row
    const isHeaderRow = firstRow.some((colStr) =>
      /^(name|full_name|fullname|student_name|id|student_id|studentid|cis|registration)/i.test(colStr)
    );

    let nameColIndex = 0;
    let idColIndex = 1;

    if (isHeaderRow) {
      firstRow.forEach((col, idx) => {
        const c = col.toLowerCase().replace(/[\s_-]+/g, '');
        if (c.includes('name')) nameColIndex = idx;
        if (c.includes('id') || c.includes('cis') || c.includes('code') || c.includes('roll')) idColIndex = idx;
      });
    } else {
      // Auto-detect based on regex content of first non-header row
      const candidateRow = cleanedMatrix[0];
      const p0 = String(candidateRow[0] || '').trim();
      const p1 = String(candidateRow[1] || '').trim();

      if (/^[a-zA-Z]{2,4}\d{4,9}$/i.test(p0)) {
        idColIndex = 0;
        nameColIndex = 1;
      } else if (/^[a-zA-Z]{2,4}\d{4,9}$/i.test(p1)) {
        nameColIndex = 0;
        idColIndex = 1;
      }
    }

    const startIdx = isHeaderRow ? 1 : 0;
    const students: ParsedStudentRow[] = [];

    for (let r = startIdx; r < cleanedMatrix.length; r++) {
      const row = cleanedMatrix[r];
      if (!row || row.length === 0) continue;

      const rawName = String(row[nameColIndex] || '').trim();
      const rawId = String(row[idColIndex] || '').trim();

      if (!rawName && !rawId) continue;

      // Extract ID and Name properly
      let studentId = rawId;
      let fullName = rawName;

      // If ID looks like a name and Name looks like an ID, swap them safely
      if (/^[a-zA-Z]{2,4}\d{4,9}$/i.test(rawName) && !/^[a-zA-Z]{2,4}\d{4,9}$/i.test(rawId)) {
        studentId = rawName;
        fullName = rawId;
      }

      if (studentId && fullName) {
        students.push({
          student_id_number: studentId.toUpperCase(),
          full_name: fullName,
          faculty_code: 'CSIT',
          department_code: 'CS',
          class_name: 'Class of 2026',
          email: `${studentId.toLowerCase()}@student.university.edu`,
        });
      }
    }

    return students;
  };

  /**
   * Handle real Excel file (.xlsx, .xls) and CSV parsing via SheetJS
   */
  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationResult(null);
    setImportSuccess(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      setWorkbookRef(workbook);
      setSheetNames(workbook.SheetNames);
      setUploadedFileName(file.name);

      const firstSheetName = workbook.SheetNames[0];
      setSelectedSheet(firstSheetName);

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const records = processMatrixToStudents(rawData);
      if (records.length === 0) {
        setErrorMsg(`No student records detected in "${file.name}". Please ensure columns contain Name and Student ID.`);
      } else {
        setParsedRows(records);
        setSuccessMsg(`Successfully parsed ${records.length} students from sheet "${firstSheetName}".`);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`Failed to parse file: ${err.message || 'Corrupt or unsupported Excel/CSV format.'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  /**
   * Handle sheet change if an Excel file has multiple sheets
   */
  const handleSheetChange = (sheetName: string) => {
    if (!workbookRef) return;
    setSelectedSheet(sheetName);
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationResult(null);

    const worksheet = workbookRef.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const records = processMatrixToStudents(rawData);

    if (records.length === 0) {
      setErrorMsg(`No student records detected in sheet "${sheetName}".`);
      setParsedRows([]);
    } else {
      setParsedRows(records);
      setSuccessMsg(`Parsed ${records.length} students from sheet "${sheetName}".`);
    }
  };

  /**
   * Handle direct clipboard text (copy-paste from Excel or CSV)
   */
  const handleParsePastedText = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationResult(null);

    if (!pastedText.trim()) {
      setErrorMsg('Please paste student rows or data before parsing.');
      return;
    }

    const lines = pastedText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : ';';
    const matrix = lines.map((l) => l.split(delimiter));

    const records = processMatrixToStudents(matrix);
    if (records.length === 0) {
      setErrorMsg('Could not detect student ID and Name. Format should be: Name [Tab or Comma] StudentID.');
    } else {
      setParsedRows(records);
      setSuccessMsg(`Parsed ${records.length} students from pasted content.`);
    }
  };

  /**
   * Dry-run preflight check with backend
   */
  const handleDryRun = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg('No parsed rows to validate. Please upload an Excel/CSV file or paste student records.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setValidationResult(null);

    try {
      const res = await api.bulkImportStudents({
        academic_year_id: selectedYearId,
        records: parsedRows,
        dry_run: true,
      });
      setValidationResult(res);
      setSuccessMsg(`Preflight dry-run completed: ${res.valid_rows} rows valid, ${res.duplicate_count || 0} existing.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Commit import to database
   */
  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await api.bulkImportStudents({
        academic_year_id: selectedYearId,
        records: parsedRows,
        dry_run: false,
      });
      setValidationResult(res);
      setImportSuccess(true);
      setSuccessMsg(`Success! ${res.valid_rows} student accounts have been created/updated with default password = Student ID.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed to commit.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-excel-fill text-success"></i>
            <span>Bulk Student Import Wizard</span>
          </h3>
          <p className="text-muted small mb-0">
            Upload institutional Excel (.xlsx, .xls) or CSV files to provision student profiles with automatic Student ID passwords.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleDownloadExcelSample}
            className="btn btn-outline-success btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span>Download Excel Sample</span>
          </button>
          <button
            onClick={handleDownloadSample}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-download"></i>
            <span>CSV Template</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 text-danger"></i>
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center rounded-3 p-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill fs-5 me-2 flex-shrink-0 text-success"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Success State */}
      {importSuccess && (
        <div className="card border-0 shadow-sm rounded-4 mb-4 border-start border-4 border-success overflow-hidden">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#10B981' }}
              >
                <i className="bi bi-check-lg fs-2"></i>
              </div>
              <div className="flex-grow-1">
                <h4 className="fw-bold text-dark mb-1">Students Successfully Imported!</h4>
                <p className="text-muted mb-3">
                  All {validationResult?.valid_rows} student records have been saved to the database. Their student portal accounts are immediately active, with passwords initialized to their university <strong>Student ID</strong> (e.g. <code>CIS231433</code>).
                </p>

                <div className="d-flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => navigate('/students')}
                    className="btn btn-success rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-people-fill"></i>
                    <span>Open Student Directory</span>
                  </button>
                  <button
                    onClick={() => {
                      setImportSuccess(false);
                      setValidationResult(null);
                      setParsedRows([]);
                      setUploadedFileName(null);
                    }}
                    className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold"
                  >
                    <span>Import Another Batch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!importSuccess && (
        <div className="row g-4">
          {/* Main Work Area */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-bottom p-3">
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  {/* Tab Selector */}
                  <ul className="nav nav-pills card-header-pills gap-1">
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-pill py-1.5 px-3 small fw-bold d-flex align-items-center gap-1.5 ${
                          activeTab === 'upload' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
                        }`}
                        onClick={() => setActiveTab('upload')}
                      >
                        <i className="bi bi-cloud-arrow-up"></i>
                        <span>Upload Excel (.xlsx / .xls)</span>
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-pill py-1.5 px-3 small fw-bold d-flex align-items-center gap-1.5 ${
                          activeTab === 'paste' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
                        }`}
                        onClick={() => setActiveTab('paste')}
                      >
                        <i className="bi bi-clipboard2-data"></i>
                        <span>Paste from Excel</span>
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link rounded-pill py-1.5 px-3 small fw-bold d-flex align-items-center gap-1.5 ${
                          activeTab === 'template' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
                        }`}
                        onClick={() => setActiveTab('template')}
                      >
                        <i className="bi bi-code-square"></i>
                        <span>CSV Preview</span>
                      </button>
                    </li>
                  </ul>

                  {/* Academic Year Selector */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="text-muted small fw-semibold text-nowrap mb-0">Cohort Year:</label>
                    <select
                      value={selectedYearId}
                      onChange={(e) => setSelectedYearId(e.target.value)}
                      className="form-select form-select-sm bg-light w-auto border-secondary-subtle"
                    >
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.id}>
                          {ay.name} ({ay.code}) {ay.is_current ? '— [Active]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                {/* TAB 1: Real Excel Drag-and-Drop / File Upload */}
                {activeTab === 'upload' && (
                  <div>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`text-center p-5 rounded-4 border-2 border-dashed transition cursor-pointer ${
                        isDragging ? 'bg-primary-subtle border-primary' : 'bg-light border-secondary-subtle'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="d-none"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />

                      {isProcessingFile ? (
                        <div className="py-4">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div className="fw-semibold text-dark">Reading and analyzing Excel workbook...</div>
                        </div>
                      ) : uploadedFileName ? (
                        <div>
                          <i className="bi bi-file-earmark-excel-fill fs-1 text-success mb-2 d-block"></i>
                          <h5 className="fw-bold text-dark mb-1">{uploadedFileName}</h5>
                          <p className="text-muted small mb-3">
                            File loaded successfully. Click or drag another file to replace.
                          </p>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1.5">
                            <i className="bi bi-check-circle me-1"></i> {parsedRows.length} Students Detected
                          </span>
                        </div>
                      ) : (
                        <div>
                          <i className="bi bi-cloud-arrow-up-fill fs-1 text-primary mb-2 d-block"></i>
                          <h5 className="fw-bold text-dark mb-1">Drag and drop your Excel or CSV file here</h5>
                          <p className="text-muted small mb-3">
                            Supports native Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) and standard CSV files.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm"
                            style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
                          >
                            <i className="bi bi-folder2-open me-2"></i> Browse Computer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Multi-sheet selection dropdown if workbook has > 1 sheets */}
                    {sheetNames.length > 1 && (
                      <div className="mt-3 p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div className="small fw-semibold text-dark d-flex align-items-center gap-2">
                          <i className="bi bi-table text-primary"></i>
                          <span>Multiple sheets found in workbook:</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <label className="small text-muted mb-0">Active Sheet:</label>
                          <select
                            value={selectedSheet}
                            onChange={(e) => handleSheetChange(e.target.value)}
                            className="form-select form-select-sm w-auto bg-white"
                          >
                            {sheetNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Direct Paste from Excel Clipboard */}
                {activeTab === 'paste' && (
                  <div>
                    <label className="form-label text-muted small fw-semibold text-uppercase">
                      Paste Excel Grid (Select columns in Excel and hit Ctrl+C &rarr; Ctrl+V)
                    </label>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste columns directly from Excel:&#10;Abdiaziz Mohamed Mohamed	CIS231433&#10;Abdifitah abdullahi salah	CIS221714&#10;Abdifitah Ahmed Mohamed	CIS241382"
                      className="form-control font-monospace small bg-light"
                    />
                    <div className="d-flex justify-content-end mt-2">
                      <button
                        onClick={handleParsePastedText}
                        className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"
                        style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
                      >
                        <i className="bi bi-gear-wide-connected me-1"></i> Parse Pasted Records
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: CSV Template Format */}
                {activeTab === 'template' && (
                  <div>
                    <label className="form-label text-muted small fw-semibold text-uppercase">
                      Standard CSV Template Header &amp; Records
                    </label>
                    <pre className="p-3 bg-dark text-light rounded-3 font-monospace small mb-3">
                      {SAMPLE_CSV}
                    </pre>
                    <button
                      onClick={handleDownloadSample}
                      className="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-sm"
                    >
                      <i className="bi bi-download me-1"></i> Download .CSV Template
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Parsed Records Preview Table */}
            {parsedRows.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-pill px-2.5 py-1">
                      {parsedRows.length} Students
                    </span>
                    <strong className="text-dark small">Batch Preview (Showing first 15 rows)</strong>
                  </div>

                  <span className="badge bg-light text-muted border small">
                    Default Password = Student ID
                  </span>
                </div>

                <div className="table-responsive" style={{ maxHeight: '350px' }}>
                  <table className="table table-hover table-striped align-middle mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th scope="col" className="ps-3 small">#</th>
                        <th scope="col" className="small">Student Name</th>
                        <th scope="col" className="small">Student ID Number</th>
                        <th scope="col" className="small">Faculty &amp; Dept</th>
                        <th scope="col" className="small">Class Cohort</th>
                        <th scope="col" className="pe-3 small text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx}>
                          <td className="ps-3 text-muted small font-monospace">{idx + 1}</td>
                          <td className="fw-semibold text-dark">{row.full_name}</td>
                          <td className="font-monospace fw-bold text-primary">{row.student_id_number}</td>
                          <td className="text-muted small">
                            <span className="badge bg-light text-secondary border me-1">
                              {row.faculty_code}
                            </span>
                            {row.department_code}
                          </td>
                          <td className="text-muted small">{row.class_name}</td>
                          <td className="pe-3 text-center">
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small">
                              Ready
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedRows.length > 15 && (
                  <div className="card-footer bg-light border-top p-2 text-center text-muted small">
                    Showing 15 of <strong>{parsedRows.length}</strong> total records in this batch.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action & Preflight Inspection Panel */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-primary"></i>
                  <span>Preflight &amp; Execution</span>
                </h6>
              </div>

              <div className="card-body p-3 p-md-4">
                {/* Security Policy Notice */}
                <div
                  className="p-3 rounded-3 mb-3 border"
                  style={{ backgroundColor: 'rgba(17, 118, 188, 0.05)', borderColor: 'rgba(17, 118, 188, 0.2)' }}
                >
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-key-fill text-primary mt-0.5"></i>
                    <div className="small text-secondary">
                      <strong className="text-dark d-block">Automatic Student Passwords:</strong>
                      Every student can immediately log in with their Student ID (e.g. <code>CIS231433</code>) as both username and password.
                    </div>
                  </div>
                </div>

                {/* Inspection Summary */}
                {!validationResult ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-clipboard-pulse fs-1 text-secondary opacity-50 mb-2 d-block"></i>
                    <div className="small">
                      Load an Excel file or paste rows, then click <strong>Run Preflight Dry-Run</strong> to inspect the batch before importing.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="row g-2 mb-3 text-center">
                      <div className="col-6">
                        <div className="p-2.5 rounded-3 bg-light border">
                          <span className="text-muted small d-block">Total Rows</span>
                          <strong className="fs-5 text-dark">{validationResult.total_rows}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2.5 rounded-3 bg-success-subtle border border-success-subtle">
                          <span className="text-success small d-block">Valid / New</span>
                          <strong className="fs-5 text-success">{validationResult.valid_rows}</strong>
                        </div>
                      </div>
                    </div>

                    {validationResult.duplicate_count > 0 && (
                      <div className="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-info-circle-fill text-info"></i>
                        <span>{validationResult.duplicate_count} existing students will be refreshed.</span>
                      </div>
                    )}

                    {validationResult.error_count > 0 && (
                      <div className="alert alert-danger p-2.5 rounded-3 mb-3 small">
                        <div className="fw-bold mb-1">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          {validationResult.error_count} Issues Detected:
                        </div>
                        <ul className="mb-0 ps-3">
                          {validationResult.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>
                              Row {err.row}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-grid gap-2 pt-2">
                  <button
                    onClick={handleDryRun}
                    disabled={isLoading || parsedRows.length === 0}
                    className="btn btn-outline-primary rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle"></i>
                        <span>Run Preflight Dry-Run</span>
                      </>
                    )}
                  </button>

                  {validationResult && validationResult.valid_rows > 0 && validationResult.error_count === 0 && (
                    <button
                      onClick={handleCommitImport}
                      disabled={isLoading}
                      className="btn btn-success rounded-pill py-2.5 fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow"
                      style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Importing Records...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle"></i>
                          <span>Commit {validationResult.valid_rows} Students</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
