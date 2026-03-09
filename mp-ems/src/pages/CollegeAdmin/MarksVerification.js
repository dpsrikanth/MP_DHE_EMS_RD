import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MarksVerification = () => {
    const [trackingData, setTrackingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrackingData();
    }, []);

    const fetchTrackingData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const collegeId = userStr ? JSON.parse(userStr).college_id : 1;

            const res = await fetch(`http://localhost:8080/api/college-admin/marks-tracking?college_id=${collegeId}`, {
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

    const handleReviewClick = (subjectId, section) => {
        navigate(`/admin/marks-review/${subjectId}/${section}`);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Submitted': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'Ready for Review' };
            case 'Locked': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: 'Locked & Verified' };
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
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : trackingData.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">No marks tracking entries found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trackingData.map((item) => {
                        const statusConfig = getStatusConfig(item.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${statusConfig.bg}`}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                                        <StatusIcon size={14} />
                                        {statusConfig.label}
                                    </span>
                                    {item.status === 'Submitted' && (
                                        <button 
                                            onClick={() => handleReviewClick(item.subject_id, item.section)}
                                            className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-xl transition-colors"
                                            title="Review & Lock"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    )}
                                     {item.status === 'Locked' && (
                                        <button 
                                            className="text-emerald-600 bg-emerald-50 p-2 rounded-xl cursor-default"
                                            title="Already Locked"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1 mt-2">
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.subject_name}</h3>
                                    <p className="text-sm font-medium text-slate-500">Section: {item.section}</p>
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
