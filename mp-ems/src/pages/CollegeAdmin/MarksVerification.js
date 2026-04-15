import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, ShieldAlert, FileText, ChevronRight, Lock, Building, Search, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';

const MarksVerification = () => {
    const [trackingData, setTrackingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

            let url = `http://localhost:8080/api/college-admin/marks-tracking`;
            if (collegeId) {
                url += `?college_id=${collegeId}`;
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
            const res = await fetch(`http://localhost:8080/api/college-admin/unlock-marks`, {
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
            const res = await fetch(`http://localhost:8080/api/college-admin/send-back-correction`, {
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
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} ${statusConfig.pulse ? 'animate-pulse shadow-lg shadow-indigo-500/20' : ''}`}>
                                        <StatusIcon size={14} />
                                        {statusConfig.label}
                                    </span>
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
        </div>
    );
};

export default MarksVerification;
