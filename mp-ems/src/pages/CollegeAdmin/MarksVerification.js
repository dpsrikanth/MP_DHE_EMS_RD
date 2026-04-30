import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, ShieldAlert, FileText, ChevronRight, Lock, Building, Search, X, Send, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { getApiUrl } from '../../config';

const MarksVerification = () => {
    const [trackingData, setTrackingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Audit Log Modal States
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [selectedLogItem, setSelectedLogItem] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role?.toLowerCase() === 'admin' || user.role === 'college_admin';


    useEffect(() => {
        fetchTrackingData();
    }, []);

    const fetchTrackingData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const collegeId = user.college_id;

            let url = getApiUrl('/college-admin/marks-tracking?exclude_pending=true');
            if (collegeId) {
                url += `&college_id=${collegeId}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTrackingData(data);
            }
        } catch (err) {
            toast.error("Failed to load tracking data");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return trackingData;
        
        const query = searchQuery.toLowerCase();
        return trackingData.filter(item => 
            (item.subject_name?.toLowerCase().includes(query)) ||
            (item.semester?.toLowerCase().includes(query)) ||
            (item.program_name?.toLowerCase().includes(query))
        );
    }, [trackingData, searchQuery]);

    const handleReviewClick = (item) => {
        navigate(`/admin/marks-review/${item.subject_id}/${item.section}`, {
            state: {
                semester_id: item.semester_id,
                academic_year_id: item.academic_year_id
            }
        });
    };

    const handleUnlockMarks = async (item) => {
        toast.info(`Unlocking marks for ${item.subject_name} (Section ${item.section})...`);

        setIsUnlocking(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/college-admin/unlock-marks'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: item.subject_id,
                    section: item.section,
                    college_id: item.college_id,
                    semester_id: item.semester_id,
                    academic_year_id: item.academic_year_id
                })
            });

            if (res.ok) {
                toast.success("Marks successfully unlocked!");
                fetchTrackingData(); // Refresh list
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to unlock marks");
            }
        } catch (error) {
            toast.error("Error unlocking marks");
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleSendBackToCollege = async (item) => {
        if (!window.confirm(`Send correction request for ${item.subject_name} (Section ${item.section}) back to College Admin for review?`)) return;
        setIsUnlocking(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/college-admin/send-back-correction'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: item.subject_id,
                    section: item.section,
                    college_id: item.college_id,
                    semester_id: item.semester_id,
                    academic_year_id: item.academic_year_id
                })
            });
            if (res.ok) {
                toast.success("Correction request sent to College Admin!");
                fetchTrackingData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to send back to college");
            }
        } catch (error) {
            toast.error("Error sending correction to college");
        } finally {
            setIsUnlocking(false);
        }
    };


    const handleViewLog = async (item) => {
        setSelectedLogItem(item);
        setLogModalOpen(true);
        setLoadingLogs(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/college-admin/marks-audit-log?subject_id=${item.subject_id}&workflow_id=${item.id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data);
            } else {
                toast.error("Failed to load audit logs");
            }
        } catch(err) {
            toast.error("Error fetching logs");
        } finally {
            setLoadingLogs(false);
        }
    };


    const getStatusConfig = (status) => {
        switch (status) {
            case 'Submitted': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'Ready for Review' };
            case 'Rejected': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, label: 'Rejected - Sent Back' };
            case 'Locked': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: 'Locked & Verified' };
            case 'Correction Requested': return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: ShieldAlert, label: 'Correction Requested', pulse: true };
            default: return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: ShieldAlert, label: 'Pending' };
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <FileText size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Marks Verification Tracking</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Monitor faculty internal marks submissions and verify 'Best of 3' automated calculations.</p>
                </div>
                
                <div className="ml-auto">
                    <TableSearch 
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search subject, semester or program..."
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">No results found matching your search.</p>
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-indigo-600 font-bold hover:underline"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((item) => {
                        const statusConfig = getStatusConfig(item.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${statusConfig.bg}`}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} ${statusConfig.pulse ? 'animate-pulse shadow-lg shadow-indigo-500/20' : ''}`}>
                                            <StatusIcon size={14} />
                                            {statusConfig.label}
                                        </span>
                                        <button 
                                            onClick={() => handleViewLog(item)}
                                            className="text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200 shadow-sm"
                                            title="View Action Log"
                                        >
                                            <History size={16} />
                                        </button>
                                    </div>
                                    {['Submitted', 'Rejected', 'Correction Requested'].includes(item.status) && (
                                        <button 
                                            onClick={() => handleReviewClick(item)}
                                            className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-xl transition-colors"
                                            title="Review & Lock"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    )}
                                    {item.status === 'Correction Requested' && (
                                        <div className="flex gap-1.5">
                                            <button 
                                                onClick={() => handleUnlockMarks(item)}
                                                className="text-white hover:bg-indigo-700 bg-indigo-600 p-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3"
                                                title="Approve Correction Request – Unlock for Faculty"
                                            >
                                                <Lock size={14} /> Allow Edit
                                            </button>
                                            <button 
                                                onClick={() => handleSendBackToCollege(item)}
                                                className="text-white hover:bg-amber-700 bg-amber-600 p-2 rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3"
                                                title="Send to College Admin for review (when marks are already approved)"
                                            >
                                                <Send size={14} /> Send to College
                                            </button>
                                        </div>
                                    )}
                                     {item.status === 'Locked' && (
                                        <div className="flex gap-2">
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleUnlockMarks(item)}
                                                    className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-2 rounded-xl transition-colors"
                                                    title="Unlock Marks (Admin Only)"
                                                >
                                                    <Lock size={20} />
                                                </button>
                                            )}
                                            <button 
                                                className="text-emerald-600 bg-emerald-50 p-2 rounded-xl cursor-default"
                                                title="Already Locked"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        </div>
                                    )}

                                </div>

                                <div className="space-y-1 mt-2">
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.subject_name}</h3>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-slate-500">Section: {item.section}</p>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/50 w-fit px-2 py-0.5 rounded-md">
                                            <Building size={12} />
                                            {item.college_name || `College ID: ${item.college_id}`}
                                        </div>
                                    </div>
                                </div>


                                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs font-medium text-slate-500">
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Program</span>
                                        {item.program_name}
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Semester</span>
                                        {item.semester}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {logModalOpen && selectedLogItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <History size={24} className="text-indigo-500" />
                                    Marks Audit Trail
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {selectedLogItem.subject_name} • Section {selectedLogItem.section}
                                </p>
                            </div>
                            <button
                                onClick={() => setLogModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {loadingLogs ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 font-medium">No actions recorded yet.</div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="px-5 py-3">Revision</th>
                                                <th className="px-5 py-3">Action</th>
                                                <th className="px-5 py-3">Performed By</th>
                                                <th className="px-5 py-3">Date & Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {auditLogs.map((log, index) => {
                                                const date = new Date(log.created_at);
                                                const isSubmit = log.action === 'MARKS_SUBMITTED';
                                                const isApproved = log.action === 'STATUS_CHANGED_TO_Approved' || log.action === 'CORRECTION_APPROVED_BY_HOD';
                                                const isLocked = log.action === 'STATUS_CHANGED_TO_Locked' || log.action === 'MARKS_LOCKED';
                                                const isRejected = log.action === 'CORRECTION_REJECTED_BY_COLLEGE' || log.action === 'MARKS_REJECTED' || log.action === 'CORRECTION_SENT_BACK_TO_COLLEGE';
                                                
                                                let badgeColor = "bg-slate-100 text-slate-600";
                                                if (isSubmit) badgeColor = "bg-indigo-50 text-indigo-700 border border-indigo-200";
                                                else if (isApproved || isLocked) badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                                                else if (isRejected) badgeColor = "bg-red-50 text-red-700 border border-red-200";

                                                return (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                {log.revision}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${badgeColor}`}>
                                                                {log.action.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-slate-900">{log.user_name}</span>
                                                                <span className="text-xs text-slate-500">{log.role_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-slate-700 font-medium">{formatDate(date)}</span>
                                                                <span className="text-xs text-slate-400 font-mono">{date.toLocaleTimeString()}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarksVerification;
