import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud, X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';

const BulkImportModal = ({ isOpen, onClose, onUploadSuccess, endpoint, entityName, expectedColumns }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  if (!isOpen) return null;

  // Build a lookup: maps both db keys AND human-readable names (lowercased) → db key
  const buildColumnLookup = () => {
    const lookup = {};
    Object.entries(expectedColumns).forEach(([dbKey, readableName]) => {
      lookup[dbKey.toLowerCase()] = dbKey;
      lookup[readableName.toLowerCase()] = dbKey;
    });
    return lookup;
  };

  // Validate that all required columns are present (accepting both db keys and readable names)
  const validateHeaders = (headers) => {
    const lookup = buildColumnLookup();
    const lowerHeaders = headers.map(h => h.trim().toLowerCase());
    const requiredDbKeys = Object.keys(expectedColumns);
    const missing = [];

    requiredDbKeys.forEach(dbKey => {
      const readableName = expectedColumns[dbKey];
      const found = lowerHeaders.some(h => h === dbKey.toLowerCase() || h === readableName.toLowerCase());
      if (!found) {
        missing.push(readableName);
      }
    });

    return missing;
  };

  // Map row headers to db keys (handles both naming conventions)
  const mapRowToDbKeys = (row) => {
    const lookup = buildColumnLookup();
    const mapped = {};
    Object.entries(row).forEach(([key, value]) => {
      const lowerKey = key.trim().toLowerCase();
      if (lookup[lowerKey]) {
        mapped[lookup[lowerKey]] = value;
      } else {
        mapped[key] = value; // keep unmapped columns as-is
      }
    });
    return mapped;
  };

  const isExcelFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ext === 'xlsx' || ext === 'xls';
  };

  const processData = (rows, headers) => {
    const missingCols = validateHeaders(headers);
    if (missingCols.length > 0) {
      toast.error(`Missing required columns: ${missingCols.join(', ')}`);
      setFile(null);
      setPreview([]);
      setColumns([]);
      return;
    }

    setColumns(headers);
    setPreview(rows.slice(0, 5));
    setValidationErrors([]);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Please upload a valid CSV or Excel (.xlsx, .xls) file.');
      return;
    }

    setFile(selectedFile);

    if (ext === 'csv') {
      parseCSV(selectedFile);
    } else {
      parseExcel(selectedFile);
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        processData(results.data, headers);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          toast.error('The Excel file appears to be empty.');
          setFile(null);
          return;
        }

        const headers = Object.keys(jsonData[0]);
        processData(jsonData, headers);
      } catch (err) {
        toast.error(`Error parsing Excel file: ${err.message}`);
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setValidationErrors([]);

    const submitData = (rows) => {
      const mappedData = rows.map(row => mapRowToDbKeys(row));
      const payload = {};
      payload[entityName] = mappedData;

      const token = localStorage.getItem('token');
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    };

    try {
      let rows;

      if (isExcelFile(file.name)) {
        // Re-read the Excel file for submission
        rows = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              resolve(XLSX.utils.sheet_to_json(worksheet, { defval: '' }));
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      } else {
        // Re-parse CSV
        rows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
          });
        });
      }

      const response = await submitData(rows);
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Import successful!');
        if (data.errors && data.errors.length > 0) {
          setValidationErrors(data.errors);
        } else {
          handleReset();
          onUploadSuccess();
          onClose();
        }
      } else {
        toast.error(data.message || 'Import failed.');
        if (data.errors && data.errors.length > 0) {
          setValidationErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('An error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setColumns([]);
    setValidationErrors([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={handleClose} />
      <div className="relative bg-white rounded-[2xl] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Bulk Import via CSV / Excel</h3>
              <p className="text-sm text-slate-500 font-medium">Upload a CSV or Excel file containing your data records</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!file ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-slate-50 hover:bg-slate-100/50 hover:border-emerald-300 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Drag & Drop your CSV or Excel file here</h4>
              <p className="text-sm text-slate-500 mb-6">Or click to browse your files. Supports .csv, .xlsx, .xls (Max 5MB)</p>
              
              <div className="text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Required columns: <span className="text-slate-700">{Object.values(expectedColumns).join(', ')}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{file.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">Ready for validation and import</p>
                  </div>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Change File
                </button>
              </div>

              {preview.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h5 className="text-sm font-bold text-slate-700">Data Preview (First 5 Rows)</h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white">
                        <tr>
                          {columns.map((col, idx) => (
                            <th key={idx} className="px-4 py-3 font-bold text-slate-600 border-b border-slate-100">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {preview.map((row, idx) => (
                          <tr key={idx} className="bg-white">
                            {columns.map((col, colIdx) => (
                              <td key={colIdx} className="px-4 py-3 text-slate-600">{row[col] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-2xl overflow-hidden">
                  <div className="bg-red-100/50 px-4 py-3 border-b border-red-200 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-500" />
                    <h5 className="text-sm font-bold text-red-700">Validation Errors</h5>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-4 space-y-2">
                    {validationErrors.map((err, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <span className="font-bold text-red-500 min-w-[60px]">Row {err.row}:</span>
                        <span className="text-slate-700">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Process Import</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
