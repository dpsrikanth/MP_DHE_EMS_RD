import React, { useEffect, useState } from 'react';
import { masterDataApi } from '../api/masterDataApi';
import { X, User, Clock, Tag, ArrowRight, Activity } from 'lucide-react';

// --- Helpers ---

// Convert snake_case/UPPER_CASE action codes to human-readable labels
const formatAction = (action) => {
  if (!action) return '—';
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Map field keys to friendly labels
const FIELD_LABELS = {
  first_name: 'First Name',
  last_name: 'Last Name',
  dob: 'Date of Birth',
  joining_date: 'Joining Date',
  department_id: 'Department',
  email: 'Email',
  phone: 'Phone',
  designation: 'Designation',
  status: 'Status',
  name: 'Name',
  subject_code: 'Subject Code',
  max_marks: 'Max Marks',
  section: 'Section',
  college_id: 'College',
  semester_id: 'Semester',
};

const friendlyKey = (key) => FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Format a single value (dates, booleans, nulls)
const formatValue = (val) => {
  if (val === null || val === undefined || val === '') return <span className="italic text-slate-400">empty</span>;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  // Detect ISO date strings
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    try {
      return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return val; }
  }
  return String(val);
};

// Color-coded action badge
const ACTION_COLORS = {
  UPDATE: 'bg-amber-100 text-amber-800 border-amber-200',
  CREATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ADD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  REMOVE: 'bg-red-100 text-red-800 border-red-200',
  LOGIN: 'bg-blue-100 text-blue-800 border-blue-200',
  SUBMIT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  APPROVE: 'bg-purple-100 text-purple-800 border-purple-200',
  LOCK: 'bg-slate-100 text-slate-700 border-slate-200',
  BULK: 'bg-orange-100 text-orange-800 border-orange-200',
};

const getActionColor = (action) => {
  if (!action) return 'bg-slate-100 text-slate-500 border-slate-200';
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) return cls;
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

// Render old_values vs new_values as a change diff table
const ChangeDiff = ({ oldVals, newVals }) => {
  const allKeys = Array.from(new Set([
    ...Object.keys(oldVals || {}),
    ...Object.keys(newVals || {}),
  ])).filter(k => !['id', 'action', 'entity_type', 'entity_id', 'user_name', 'user_email'].includes(k));

  if (allKeys.length === 0) return null;

  const changedKeys = allKeys.filter(k => {
    const ov = oldVals?.[k];
    const nv = newVals?.[k];
    return String(ov ?? '') !== String(nv ?? '');
  });

  if (changedKeys.length === 0) return <p className="text-xs text-slate-400 italic">No field changes detected.</p>;

  return (
    <table className="w-full text-xs mt-2 border-collapse rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
          <th className="text-left px-3 py-2 font-bold w-1/4">Field</th>
          <th className="text-left px-3 py-2 font-bold w-5/12">Before</th>
          <th className="px-2 py-2 w-4 text-center" />
          <th className="text-left px-3 py-2 font-bold w-5/12">After</th>
        </tr>
      </thead>
      <tbody>
        {changedKeys.map((key) => (
          <tr key={key} className="border-t border-slate-100">
            <td className="px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{friendlyKey(key)}</td>
            <td className="px-3 py-2 text-red-700 bg-red-50 rounded">{formatValue(oldVals?.[key])}</td>
            <td className="px-2 py-2 text-center text-slate-400"><ArrowRight size={12} /></td>
            <td className="px-3 py-2 text-emerald-700 bg-emerald-50 rounded">{formatValue(newVals?.[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Render generic detail key/value pairs (for non-diff logs)
const DetailPills = ({ details }) => {
  const skip = ['id', 'action', 'entity_type', 'entity_id', 'user_name', 'user_email', 'old_values', 'new_values'];
  const entries = Object.entries(details || {}).filter(([k]) => !skip.includes(k));
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entries.map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
          <span className="text-slate-400">{friendlyKey(key)}:</span> {formatValue(val)}
        </span>
      ))}
    </div>
  );
};

// Parse the details field (may be string or object)
const parseDetails = (log) => {
  try {
    if (typeof log.details === 'string') return JSON.parse(log.details);
    if (typeof log.details === 'object' && log.details !== null) return log.details;
    // Fall back to the log itself if no dedicated details field
    return log;
  } catch {
    return log;
  }
};

// --- Main Component ---
const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await masterDataApi.getTeacherAuditLogs();
        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = logs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.user_name || '').toLowerCase().includes(q) ||
      (log.user_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Audit Log</h2>
              <p className="text-xs text-slate-400 font-medium">History of changes made to teacher records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-50">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by action or user..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {loading && (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading audit history...</p>
            </div>
          )}

          {error && (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-400 text-sm">No audit logs found.</p>
            </div>
          )}

          {!loading && !error && filtered.map((log) => {
            const details = parseDetails(log);
            const hasChanges = details.old_values || details.new_values;

            return (
              <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 hover:border-indigo-100 transition-colors">

                {/* Top row: Badge + User + Time */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getActionColor(log.action)}`}>
                      <Tag size={10} />
                      {formatAction(log.action)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <User size={12} className="text-slate-400" />
                      {log.user_name || details.user_name || 'System'}
                      {(log.user_email || details.user_email) && (
                        <span className="text-slate-400 font-normal">({log.user_email || details.user_email})</span>
                      )}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                    <Clock size={11} />
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Change diff (if old_values / new_values present) */}
                {hasChanges && (
                  <ChangeDiff oldVals={details.old_values} newVals={details.new_values} />
                )}

                {/* Other metadata pills */}
                {!hasChanges && <DetailPills details={details} />}

                {/* Entity type chip */}
                {(log.entity_type || details.entity_type) && (
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Entity: {(log.entity_type || details.entity_type || '').replace(/_/g, ' ')}
                    {(log.entity_id || details.entity_id) ? ` #${log.entity_id || details.entity_id}` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-black rounded-xl tracking-widest transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogModal;
