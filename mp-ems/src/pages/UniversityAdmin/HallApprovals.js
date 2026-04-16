import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Building2, CheckCircle2, XCircle, Clock, MapPin, Search, AlertTriangle, ArrowRight, X, Users, Info, Zap, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

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
    const [expandedHalls, setExpandedHalls] = useState({});

    const toggleExpansion = (id) => {
        setExpandedHalls(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

        // CHECK: If this is the self-college for these students
        const targetCollege = colleges.find(c => String(c.id) === String(targetCollegeId));

        // NEW: Strict Capacity Check
        if (targetCollege && (targetCollege.internal_capacity || 0) === 0) {
            return toast.error(`Cannot allocate to ${targetCollege.college_name} because it has 0 approved seats. Add halls first.`);
        }

        const hostingSources = selectedRequest.hosting_sources
            ? (typeof selectedRequest.hosting_sources === 'string' ? JSON.parse(selectedRequest.hosting_sources) : selectedRequest.hosting_sources)
            : [];
        const isSelfCollege = hostingSources.some(src => src.name.toLowerCase() === targetCollege.college_name.toLowerCase());

        if (isSelfCollege) {
            const proceed = window.confirm(`This is the SELF COLLEGE for these students. Do you want to proceed?`);
            if (!proceed) return;
        }

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
        .filter(c => c.id !== selectedRequest.college_id) // Exclude the host itself
        .map(c => {
            const distance = calculateDistance(
                selectedRequest.latitude, selectedRequest.longitude,
                c.latitude, c.longitude
            );
            const internalCapacity = parseInt(c.internal_capacity) || 0;
            const occupiedSeats = parseInt(c.occupied_seats) || 0;
            const availableSeats = Math.max(0, internalCapacity - occupiedSeats);

            return {
                ...c,
                distance,
                availableSeats,
                isFilled: availableSeats <= 0
            };
        })
        .filter(c => c.distance <= 8) // Within 8km
        .sort((a, b) => a.distance - b.distance)
        : [];

    const getCapacityPct = (approved, required) => {
        if (!required || required === 0) return 0;
        return Math.min(100, Math.round((approved / required) * 100));
    };

    const parseHostingSources = (sources) => {
        if (!sources) return [];
        return typeof sources === 'string' ? JSON.parse(sources) : sources;
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in pb-20">
            {/* Main content... */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                        <ShieldCheck size={26} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Infrastructure Validation</h1>
                        <p className="text-xs text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Review &amp; validate physical campus capacities</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search college or hall..."
                        className="w-full md:w-80 pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Shortage Requests */}
            {shortageRequests.length > 0 && (
                <div className="relative bg-rose-50 rounded-[2rem] p-8 shadow-sm border border-rose-100 overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Infrastructure Shortages</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Colleges requiring external center allocation</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shortageRequests.map(req => (
                                <div key={req.id} className="bg-white p-6 rounded-2xl border border-rose-100/50 shadow-sm flex flex-col gap-5 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-sm font-black text-slate-800 leading-tight">{req.college_name}</span>
                                        <span className="flex-shrink-0 px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-200">Pending</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="text-xl font-black text-slate-800">{req.student_count}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Students</div>
                                        </div>
                                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                                            <div className="text-xl font-black text-rose-600">{req.shortage}</div>
                                            <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1">Shortage</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setSelectedRequest(req); setShowAllocateModal(true); }}
                                        className="w-full py-3.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                                    >
                                        Allocate Center <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
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
                    {filteredHalls.map((hall) => {
                        const pct = getCapacityPct(hall.college_approved_capacity, hall.total_required);
                        const isFull = pct >= 100;
                        const sources = parseHostingSources(hall.hosting_sources);
                        return (
                            <div key={hall.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-200/40 hover:-translate-y-1 group">

                                {/* Card Top Accent */}
                                <div className={`h-1.5 w-full ${hall.status?.toLowerCase() === 'approved' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                        hall.status?.toLowerCase() === 'rejected' ? 'bg-gradient-to-r from-rose-400 to-red-500' :
                                            'bg-gradient-to-r from-amber-400 to-orange-400'
                                    }`} />

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Status + Icon Row */}
                                    <div className="flex justify-between items-center mb-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${hall.status?.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                hall.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {hall.status?.toLowerCase() === 'pending' && <Clock size={11} />}
                                            {hall.status?.toLowerCase() === 'approved' && <CheckCircle2 size={11} />}
                                            {hall.status?.toLowerCase() === 'rejected' && <XCircle size={11} />}
                                            {hall.status}
                                        </span>
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-500 transition-all border border-slate-100">
                                            <Building2 size={20} />
                                        </div>
                                    </div>

                                    {/* Hall Code + College */}
                                    <div className="mb-5">
                                        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl mb-2">
                                            <Zap size={13} className="text-amber-400" />
                                            <span className="text-sm font-black tracking-widest uppercase">{hall.hall_code}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-tight mt-1">{hall.college_name}</p>
                                    </div>

                                    {/* Capacity Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                                            <p className="text-base font-black text-slate-800">{hall.rows} × {hall.seats_per_row}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Grid Pattern</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 text-center shadow-lg shadow-indigo-500/25">
                                            <p className="text-2xl font-black text-white leading-none">{hall.total_capacity}</p>
                                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mt-0.5">Net Capacity</p>
                                        </div>
                                    </div>

                                    {/* Coverage Progress */}
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 space-y-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Existing Infrastructure</span>
                                                <span className="text-xs font-black text-indigo-600 tabular-nums">{hall.college_approved_capacity} seats</span>
                                            </div>

                                            {hall.approved_halls_details && hall.approved_halls_details.length > 0 && (
                                                <div className="space-y-1.5 p-2 bg-white rounded-xl border border-dashed border-slate-200">
                                                    {(expandedHalls[hall.id] ? hall.approved_halls_details : hall.approved_halls_details.slice(0, 3)).map((h, idx) => (
                                                        <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 animate-in fade-in duration-300">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{h.code}</span>
                                                            <span className="text-[11px] font-black text-slate-800 tabular-nums">{h.capacity}</span>
                                                        </div>
                                                    ))}

                                                    {hall.approved_halls_details.length > 3 && (
                                                        <button
                                                            onClick={() => toggleExpansion(hall.id)}
                                                            className="w-full py-1 text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            {expandedHalls[hall.id] ? (
                                                                <>Show Less <ChevronUp size={10} /></>
                                                            ) : (
                                                                <>+ {hall.approved_halls_details.length - 3} More Halls <ChevronDown size={10} /></>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students Required</span>
                                            <span className={`text-xs font-black tabular-nums ${isFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {hall.total_required} students&nbsp;
                                                <span className="text-[9px] opacity-70">({pct}% covered)</span>
                                            </span>
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 shadow-sm ${isFull
                                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-300'
                                                        : pct >= 60
                                                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-amber-300'
                                                            : 'bg-gradient-to-r from-rose-400 to-red-500 shadow-rose-300'
                                                    }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Hosting Institutions Section */}
                                    <div className="mb-5">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                            <Users size={11} /><span>Hosting Institutions</span>
                                        </div>
                                        <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                            {sources && sources.length > 0 ? (
                                                sources.map((src, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-[1.25rem] border border-slate-100/50 group-hover:border-purple-200/50 transition-all hover:bg-white hover:shadow-sm">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0" />
                                                            <span className="text-[11px] font-black text-slate-700 truncate tracking-tight">{src.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 whitespace-nowrap tabular-nums">
                                                                {src.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Guests</p>
                                                    <p className="text-[9px] font-bold text-slate-300 tracking-tight">Dedicated Center</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto pt-5 border-t border-slate-100">
                                        {hall.status?.toLowerCase() === 'pending' ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleAction(hall.id, 'Rejected')}
                                                    className="py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAction(hall.id, 'Approved')}
                                                    className="py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    Validate ✓
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${hall.status?.toLowerCase() === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-500 border border-rose-100'
                                                }`}>
                                                {hall.status?.toLowerCase() === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                {hall.status?.toLowerCase() === 'approved' ? 'Validated' : 'Rejected'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                                    <div className="space-y-3">
                                        <select
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500"
                                            value={targetCollegeId}
                                            onChange={(e) => setTargetCollegeId(e.target.value)}
                                        >
                                            <option value="">Choose a nearby center...</option>
                                            {nearbyColleges.map(college => (
                                                <option key={college.id} value={college.id}>
                                                    {college.college_name} — {college.distance}km ({college.availableSeats} Seats Available)
                                                </option>
                                            ))}
                                        </select>

                                        {targetCollegeId && nearbyColleges.find(c => String(c.id) === String(targetCollegeId))?.isFilled ? (
                                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 animate-in fade-in slide-in-from-top-1">
                                                <XCircle size={20} className="shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-wider">Capacity Error</span>
                                                    <span className="text-[10px] font-bold leading-tight mt-0.5">Seats are already filled select another college</span>
                                                </div>
                                            </div>
                                        ) : targetCollegeId && nearbyColleges.find(c => String(c.id) === String(targetCollegeId))?.internal_capacity === 0 && (
                                            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 animate-in fade-in slide-in-from-top-1">
                                                <AlertTriangle size={20} className="shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-wider">Infrastructure Alert</span>
                                                    <span className="text-[10px] font-bold leading-tight mt-0.5">This college has no approved halls. Please verify infrastructure before assigning students.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                disabled={allocating || !targetCollegeId || nearbyColleges.find(c => String(c.id) === String(targetCollegeId))?.isFilled}
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
