import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Building2, CheckCircle2, XCircle, Clock, MapPin, Search, AlertTriangle, ArrowRight, X } from "lucide-react";

const HallApprovals = () => {
    const [halls, setHalls] = useState([]);
    const [shortageRequests, setShortageRequests] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [targetCollegeId, setTargetCollegeId] = useState('');
    const [allocating, setAllocating] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [hallsRes, shortagesRes, collegesRes] = await Promise.all([
                fetch('http://localhost:8080/api/examination-halls/pending', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:8080/api/examination-halls/shortage-requests', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:8080/api/colleges', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            if (hallsRes.ok) {
                const data = await hallsRes.json();
                setHalls(data);
            } else {
                toast.error("Failed to fetch hall requests");
            }

            if (shortagesRes.ok) {
                const sData = await shortagesRes.json();
                setShortageRequests(sData);
            }

            if (collegesRes.ok) {
                const cData = await collegesRes.json();
                setColleges(cData);
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (hallId, actionStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/examination-halls/${hallId}/approve-reject`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ status: actionStatus, comment: 'Reviewed by University' })
            });

            if (res.ok) {
                toast.success(`Hall ${actionStatus} successfully`);
                fetchData();
            } else {
                toast.error(`Failed to ${actionStatus.toLowerCase()} hall`);
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleAllocate = async () => {
        if (!targetCollegeId) return toast.warning("Please select a target college");
        setAllocating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/examination-halls/shortage-requests/${selectedRequest.id}/allocate`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ allocated_college_id: targetCollegeId })
            });

            if (res.ok) {
                toast.success("External center allocated successfully");
                setShowAllocateModal(false);
                setSelectedRequest(null);
                setTargetCollegeId('');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to allocate center");
            }
        } catch (err) {
            toast.error("An error occurred during allocation");
        } finally {
            setAllocating(false);
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const filteredHalls = halls.filter(h => 
        h.college_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        h.hall_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(1));
    };

    const nearbyColleges = selectedRequest ? colleges
        .filter(c => c.id !== selectedRequest.college_id)
        .map(c => ({
            ...c,
            distance: calculateDistance(
                selectedRequest.latitude, selectedRequest.longitude,
                c.latitude, c.longitude
            )
        }))
        .filter(c => c.distance <= 8) // Within 8km
        .sort((a, b) => a.distance - b.distance)
        : [];

    return (
        <div className="p-8 space-y-8 animate-fade-in pb-20">
            {/* Main content... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Infrastructure Validation</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 uppercase">Review physical campus capacities</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search college or hall..." 
                        className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {shortageRequests.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Infrastructure Shortages</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Colleges requiring external center allocation</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shortageRequests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-black text-slate-900">{req.college_name}</span>
                                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded border border-amber-200">Pending</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                                        <div className="text-xs font-bold text-slate-900">{req.student_count}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Students</div>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-2 border border-rose-100">
                                        <div className="text-xs font-black text-rose-600">{req.shortage}</div>
                                        <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Shortage</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSelectedRequest(req);
                                        setShowAllocateModal(true);
                                    }}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    Allocate Center <ArrowRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredHalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Clear Queue!</h3>
                    <p className="text-slate-500 font-medium">No pending infrastructure requests awaiting validation.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHalls.map((hall) => (
                        <div key={hall.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-lg hover:border-purple-200 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(hall.status)}`}>
                                        {hall.status?.toLowerCase() === 'pending' && <Clock size={12} />}
                                        {hall.status?.toLowerCase() === 'approved' && <CheckCircle2 size={12} />}
                                        {hall.status?.toLowerCase() === 'rejected' && <XCircle size={12} />}
                                        {hall.status}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <Building2 size={24} />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-1">{hall.hall_code}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">{hall.college_name}</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-slate-900">{hall.rows} × {hall.seats_per_row}</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Grid Pattern</span>
                                </div>
                                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col items-center justify-center">
                                    <span className="text-lg font-black text-purple-700">{hall.total_capacity}</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 mt-1">Net Capacity</span>
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                                {hall.status?.toLowerCase() === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={() => handleAction(hall.id, 'Rejected')}
                                            className="py-3 bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-sm font-bold rounded-xl transition-all"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction(hall.id, 'Approved')}
                                            className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-sm font-black rounded-xl transition-all"
                                        >
                                            Validate Space
                                        </button>
                                    </>
                                ) : (
                                    <div className="col-span-2 py-3 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-bold rounded-xl text-center">
                                        Action Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Allocation Modal */}
            {showAllocateModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !allocating && setShowAllocateModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">External Allocation</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Assign alternative examination center</p>
                            </div>
                            <button 
                                onClick={() => setShowAllocateModal(false)} 
                                disabled={allocating}
                                className="p-2 hover:bg-slate-200 text-slate-400 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex flex-col gap-1 text-center">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Source Institution</span>
                                <span className="text-sm font-black text-slate-900">{selectedRequest.college_name}</span>
                                <div className="mt-2 text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
                                    <AlertTriangle size={14} /> Shortage: {selectedRequest.shortage} students
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Nearby College</label>
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold whitespace-nowrap">Radius: 8KM</span>
                                </div>
                                
                                {nearbyColleges.length > 0 ? (
                                    <select 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                                        value={targetCollegeId}
                                        onChange={(e) => setTargetCollegeId(e.target.value)}
                                    >
                                        <option value="">Choose a nearby center...</option>
                                        {nearbyColleges.map(college => (
                                            <option key={college.id} value={college.id}>
                                                {college.college_name} — {college.distance} KM away
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                        <p className="text-sm font-bold text-slate-400">No colleges found within 8km radius</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                                <p className="text-[10px] font-bold text-blue-600 leading-relaxed text-center">
                                    Optimized for logistical efficiency based on distance.
                                </p>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setShowAllocateModal(false)}
                                disabled={allocating}
                                className="flex-1 py-3 text-sm font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAllocate}
                                disabled={allocating || !targetCollegeId}
                                className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-black rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                {allocating ? (
                                    <Clock size={16} className="animate-spin" />
                                ) : (
                                    <>Assign Center <CheckCircle2 size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HallApprovals;
