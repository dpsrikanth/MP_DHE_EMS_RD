import React, { useEffect, useState } from 'react';
import { masterDataApi } from '../api/masterDataApi';
import { X, User, Clock, Tag, ArrowRight, Activity, Search, Shield, RefreshCw, ChevronDown, ChevronUp, FileText } from 'lucide-react';

// --- Helpers ---

const formatAction = (action) => {
  if (!action) return '—';
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const FIELD_LABELS = {
  first_name: 'First Name', last_name: 'Last Name', dob: 'Date of Birth',
  joining_date: 'Joining Date', department_id: 'Department', email: 'Email',
  phone: 'Phone', designation: 'Designation', status: 'Status', name: 'Name',
  subject_code: 'Subject Code', max_marks: 'Max Marks', section: 'Section',
  college_id: 'College', semester_id: 'Semester',
};

const friendlyKey = (key) =>
  FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (val) => {
  if (val === null || val === undefined || val === '')
    return <span className="italic text-slate-300">empty</span>;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    try {
      return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return val; }
  }
  return String(val);
};

const ACTION_META = {
  UPDATE:  { color: 'bg-amber-500/15 text-amber-700 border-amber-300',  dot: 'bg-amber-400' },
  EDIT:    { color: 'bg-amber-500/15 text-amber-700 border-amber-300',  dot: 'bg-amber-400' },
  CREATE:  { color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300', dot: 'bg-emerald-400' },
  ADD:     { color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300', dot: 'bg-emerald-400' },
  DELETE:  { color: 'bg-red-500/15 text-red-700 border-red-300',       dot: 'bg-red-400' },
  REMOVE:  { color: 'bg-red-500/15 text-red-700 border-red-300',       dot: 'bg-red-400' },
  LOGIN:   { color: 'bg-blue-500/15 text-blue-700 border-blue-300',    dot: 'bg-blue-400' },
  SUBMIT:  { color: 'bg-indigo-500/15 text-indigo-700 border-indigo-300', dot: 'bg-indigo-400' },
  APPROVE: { color: 'bg-purple-500/15 text-purple-700 border-purple-300', dot: 'bg-purple-400' },
  BULK:    { color: 'bg-orange-500/15 text-orange-700 border-orange-300', dot: 'bg-orange-400' },
};

const getActionMeta = (action) => {
  if (!action) return { color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' };
  for (const [key, meta] of Object.entries(ACTION_META)) {
    if (action.toUpperCase().includes(key)) return meta;
  }
  return { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
};

const parseDetails = (log) => {
  try {
    if (typeof log.details === 'string') return JSON.parse(log.details);
    if (typeof log.details === 'object' && log.details !== null) return log.details;
    return log;
  } catch { return log; }
};

// Change Diff Table
const ChangeDiff = ({ oldVals, newVals }) => {
  const allKeys = Array.from(new Set([
    ...Object.keys(oldVals || {}),
    ...Object.keys(newVals || {}),
  ])).filter(k => !['id', 'action', 'entity_type', 'entity_id', 'user_name', 'user_email'].includes(k));

  const changedKeys = allKeys.filter(k => String(oldVals?.[k] ?? '') !== String(newVals?.[k] ?? ''));
  if (changedKeys.length === 0)
    return <p className="text-xs text-slate-400 italic mt-1">No field changes detected.</p>;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-3 py-2 font-black text-slate-400 tracking-wider uppercase text-[10px] w-1/4">Field</th>
            <th className="text-left px-3 py-2 font-black text-slate-400 tracking-wider uppercase text-[10px]">Before</th>
            <th className="px-2 py-2 w-8 text-center" />
            <th className="text-left px-3 py-2 font-black text-slate-400 tracking-wider uppercase text-[10px]">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {changedKeys.map((key) => (
            <tr key={key}>
              <td className="px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{friendlyKey(key)}</td>
              <td className="px-3 py-2.5">
                <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium border border-red-100 max-w-[160px] truncate" title={String(oldVals?.[key] ?? '')}>
                  {formatValue(oldVals?.[key])}
                </span>
              </td>
              <td className="px-2 py-2.5 text-center text-slate-300">
                <ArrowRight size={12} />
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100 max-w-[160px] truncate" title={String(newVals?.[key] ?? '')}>
                  {formatValue(newVals?.[key])}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Detail Pills
const DetailPills = ({ details }) => {
  const skip = ['id', 'action', 'entity_type', 'entity_id', 'user_name', 'user_email', 'old_values', 'new_values'];
  const entries = Object.entries(details || {}).filter(([k]) => !skip.includes(k));
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entries.map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-600 font-medium">
          <span className="text-slate-400">{friendlyKey(key)}:</span>
          <span className="text-slate-700">{formatValue(val)}</span>
        </span>
      ))}
    </div>
  );
};

// Single Log Card
const LogCard = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const details = parseDetails(log);
  const hasChanges = details.old_values || details.new_values;
  const meta = getActionMeta(log.action);
  const userName = log.user_name || details.user_name || 'System';
  const userEmail = log.user_email || details.user_email;
  const entityType = log.entity_type || details.entity_type;
  const entityId = log.entity_id || details.entity_id;

  const timeStr = log.created_at
    ? new Date(log.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '—';

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md mt-1 flex-shrink-0 ${meta.dot}`} />
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden">
          {/* Card header */}
          <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Action badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border tracking-wide ${meta.color}`}>
                <Tag size={9} />
                {formatAction(log.action)}
              </span>
              {/* User */}
              <span className="flex items-center gap-1.5 text-[12px] text-slate-600 font-semibold">
                <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">
                  <User size={11} className="text-indigo-500" />
                </span>
                {userName}
                {userEmail && (
                  <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">({userEmail})</span>
                )}
              </span>
            </div>
            {/* Time */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium whitespace-nowrap">
              <Clock size={11} />
              {timeStr}
            </div>
          </div>

          {/* Entity chip */}
          {entityType && (
            <div className="px-4 pb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                <FileText size={9} />
                {entityType.replace(/_/g, ' ')}
                {entityId ? ` #${entityId}` : ''}
              </span>
            </div>
          )}

          {/* Expand / collapse */}
          {(hasChanges || Object.keys(details).length > 0) && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] font-black text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors tracking-widest"
              >
                <span>{expanded ? 'HIDE DETAILS' : 'VIEW DETAILS'}</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expanded && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  {hasChanges ? (
                    <ChangeDiff oldVals={details.old_values} newVals={details.new_values} />
                  ) : (
                    <DetailPills details={details} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await masterDataApi.getTeacherAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  // Derive unique action types for the filter dropdown
  const uniqueActions = ['All', ...Array.from(new Set(logs.map(l => l.action).filter(Boolean)))];

  const filtered = logs.filter(log => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.user_name || '').toLowerCase().includes(q) ||
      (log.user_email || '').toLowerCase().includes(q);
    const matchAction = actionFilter === 'All' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Audit Log</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Full history of all staff record changes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50 flex-shrink-0">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by user or action..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all cursor-pointer"
          >
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a === 'All' ? 'All Actions' : formatAction(a)}</option>
            ))}
          </select>
          {/* Count chip */}
          <span className="text-xs font-black text-slate-400 tracking-widest whitespace-nowrap">
            {filtered.length} RECORD{filtered.length !== 1 ? 'S' : ''}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-2" style={{ scrollbarWidth: 'thin' }}>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Loading audit history...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-sm font-bold text-red-500">{error}</p>
              <button onClick={fetchLogs} className="mt-3 text-xs text-indigo-500 font-bold hover:underline">Try Again</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Activity size={28} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No audit records found</p>
              {search && (
                <button onClick={() => { setSearch(''); setActionFilter('All'); }} className="text-xs text-indigo-500 font-bold hover:underline">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Timeline */}
          {!loading && !error && filtered.length > 0 && (
            <div className="pb-4">
              {filtered.map(log => <LogCard key={log.id} log={log} />)}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Showing <span className="font-black text-slate-700">{filtered.length}</span> of <span className="font-black text-slate-700">{logs.length}</span> total records
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-black rounded-xl tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/10"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogModal;
