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
    const [selectedCollegeId, setSelectedCollegeId] = useState('all');

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

    // Get unique colleges with pending hall counts for the dropdown
    const collegesWithPending = React.useMemo(() => {
        const counts = {};
        halls.forEach(h => {
            counts[h.college_id] = {
                name: h.college_name,
                count: (counts[h.college_id]?.count || 0) + 1
            };
        });
        return Object.entries(counts).map(([id, data]) => ({
            id,
            name: data.name,
            count: data.count
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [halls]);

    const filteredHalls = halls.filter(h => {
        const matchesSearch = h.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            h.hall_code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCollege = selectedCollegeId === 'all' || String(h.college_id) === String(selectedCollegeId);
        return matchesSearch && matchesCollege;
    });

    // Grouping logic for the consolidated view
    const groupedHalls = React.useMemo(() => {
        return Object.values(filteredHalls.reduce((acc, hall) => {
            if (!acc[hall.college_id]) {
                acc[hall.college_id] = {
                    college_id: hall.college_id,
                    college_name: hall.college_name,
                    college_approved_capacity: Number(hall.college_approved_capacity || 0),
                    total_required: Number(hall.total_required || 0),
                    approved_halls_details: hall.approved_halls_details,
                    halls: []
                };
            }
            acc[hall.college_id].halls.push(hall);
            return acc;
        }, {}));
    }, [filteredHalls]);

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
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* College Filter Dropdown */}
                    <div className="relative w-full sm:w-64">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={selectedCollegeId}
                            onChange={(e) => setSelectedCollegeId(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all shadow-sm appearance-none cursor-pointer hover:border-slate-300"
                        >
                            <option value="all">All Colleges ({halls.length})</option>
                            {collegesWithPending.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.count})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search college or hall..."
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all shadow-sm"
                        />
                    </div>
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
                <div className={selectedCollegeId === 'all' ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                    {selectedCollegeId === 'all' ? (
                        // CONSOLIDATED VIEW: One card per college
                        groupedHalls.map((college) => {
                            const pct = getCapacityPct(college.college_approved_capacity, college.total_required);
                            const isFulfilled = college.college_approved_capacity >= college.total_required;
                            
                            return (
                                <div key={college.college_id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl group border-t-8 border-t-purple-500">
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                                    <Building2 size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-800 leading-tight">{college.college_name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">ID: {college.college_id}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">Pending: {college.halls.filter(h => h.status === 'Pending').length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-[1.25rem] text-center shadow-lg shadow-slate-900/20">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{isFulfilled ? 'Allotted' : 'Required'}</div>
                                                <div className="text-xl font-black leading-none">{college.total_required}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                            <div className="md:col-span-3 space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Zap size={14} className="text-amber-500" /> Infrastructure Queue
                                                    </h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {college.halls.map((hall) => (
                                                        <div key={hall.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50 transition-all hover:bg-white hover:border-purple-200 hover:shadow-lg group/hall">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{hall.hall_code}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Cap.</span>
                                                                    <span className="text-xs font-black text-slate-900">{hall.total_capacity}</span>
                                                                </div>
                                                                {hall.status !== 'Pending' && (
                                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${hall.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                        {hall.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={() => setSelectedCollegeId(String(college.college_id))}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-[9px] font-black text-purple-600 rounded-lg uppercase tracking-widest hover:bg-purple-50 hover:border-purple-200 transition-all"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 space-y-6">
                                                <div className="bg-slate-50/80 rounded-[1.75rem] p-6 border border-slate-100 h-full flex flex-col relative overflow-hidden group/status">
                                                    {/* Goal/Target Label */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Readiness Status</span>
                                                        <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                                                            isFulfilled ? 'bg-emerald-100 text-emerald-600' : 
                                                            (Number(college.college_approved_capacity) + college.halls.reduce((sum, h) => h.status === 'Pending' ? sum + Number(h.total_capacity) : sum, 0) >= Number(college.total_required)) 
                                                                ? 'bg-amber-100 text-amber-600' 
                                                                : 'bg-rose-100 text-rose-600'
                                                        }`}>
                                                            {isFulfilled ? '✓ Verified' : '⟳ In Progress'}
                                                        </div>
                                                    </div>

                                                    {/* Large Ratio Display */}
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-3xl font-black text-slate-900 leading-none">{college.college_approved_capacity}</span>
                                                        <span className="text-sm font-bold text-slate-300">/ {college.total_required}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Seeds Validated</div>

                                                    {/* Progress Visual */}
                                                    <div className="relative h-4 w-full bg-white rounded-xl p-1 border border-slate-200 overflow-hidden shadow-inner mb-6">
                                                        <div 
                                                            className={`h-full rounded-lg transition-all duration-1000 ${
                                                                isFulfilled ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                                            }`}
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>

                                                    {/* Descriptive State */}
                                                    <div className="space-y-4">
                                                        {isFulfilled ? (
                                                            <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-tight">Success: Fully Seated</span>
                                                                    <span className="text-[9px] font-bold text-emerald-600 leading-tight mt-0.5">This college has enough approved infrastructure for all {college.total_required} students.</span>
                                                                </div>
                                                            </div>
                                                        ) : (Number(college.college_approved_capacity) + college.halls.reduce((sum, h) => h.status === 'Pending' ? sum + Number(h.total_capacity) : sum, 0) >= Number(college.total_required)) ? (
                                                            <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 animate-in fade-in slide-in-from-bottom-2">
                                                                <Clock className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-amber-700 uppercase tracking-tight">Review Pending</span>
                                                                    <span className="text-[9px] font-bold text-amber-600 leading-tight mt-0.5">Verify the pending halls to cover the remaining {Number(college.total_required) - Number(college.college_approved_capacity)} students.</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-start gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100 animate-in shake">
                                                                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-rose-700 uppercase tracking-tight">Action: Capacity Gap</span>
                                                                    <span className="text-[9px] font-bold text-rose-600 leading-tight mt-0.5">Alert! Total infrastructure is short by {Number(college.total_required) - (Number(college.college_approved_capacity) + college.halls.reduce((sum, h) => h.status === 'Pending' ? sum + Number(h.total_capacity) : sum, 0))} seats.</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mt-auto pt-6 border-t border-slate-200">
                                                        <button 
                                                            onClick={() => setSelectedCollegeId(String(college.college_id))}
                                                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            Inspect Institution <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // INDIVIDUAL VIEW: Separate cards for each hall
                        filteredHalls.map((hall) => {
                            const pct = getCapacityPct(hall.college_approved_capacity, hall.total_required);
                            const isFulfilled = hall.college_approved_capacity >= hall.total_required;
                            const isProcessed = hall.status !== 'Pending';

                            return (
                                <div key={hall.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-200 border-t-8 border-t-purple-500">
                                    <div className="p-6 space-y-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">
                                                    {hall.hall_code}
                                                </div>
                                                <h3 className="text-sm font-black text-slate-800 leading-tight line-clamp-2 mt-2" title={hall.college_name}>
                                                    {hall.college_name}
                                                </h3>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg border mt-0.5 ${
                                                    hall.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    hall.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                    'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                    {hall.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100/50">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</div>
                                                <div className="text-lg font-black text-slate-900 tabular-nums">{hall.total_capacity}</div>
                                                <div className="text-[8px] font-black text-purple-600 uppercase tracking-tighter mt-0.5">{hall.rows}×{hall.seats_per_row}</div>
                                            </div>
                                            {(() => {
                                                const utilizationPct = hall.total_capacity > 0 
                                                    ? Math.round(((hall.hall_allocated_count || 0) / hall.total_capacity) * 100) 
                                                    : 0;
                                                return (
                                                    <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100/50 relative overflow-hidden">
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Load Status</div>
                                                        <div className="text-lg font-black text-indigo-700 tabular-nums">{utilizationPct}%</div>
                                                        <div className="w-full h-1 bg-indigo-100 rounded-full mt-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${utilizationPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(utilizationPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Allocated Seats</span>
                                                <span className="text-[10px] font-black text-slate-700">{hall.hall_allocated_count || 0} Students</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Remaining Seats</span>
                                                <span className={`text-[10px] font-black ${(hall.total_capacity - (hall.hall_allocated_count || 0)) > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {(hall.total_capacity - (hall.hall_allocated_count || 0))} Available
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            {!isProcessed ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button 
                                                        onClick={() => handleAction(hall.id, 'Approved')}
                                                        className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(hall.id, 'Rejected')}
                                                        className="py-3 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                                    hall.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {hall.status === 'Approved' ? <ShieldCheck size={14} /> : <XCircle size={14} />}
                                                    {hall.status === 'Approved' ? 'Validation Complete' : 'Registration Rejected'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
