import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Building2, Save, Pencil, Trash2, X, Search, Layers, Users, SendHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { TableSearch } from '../../components/TableControls';

const ExaminationHalls = () => {
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalRooms, setTotalRooms] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [hostingSources, setHostingSources] = useState([]);
    const [shortageRequests, setShortageRequests] = useState([]);
    const [isEditingRooms, setIsEditingRooms] = useState(false);


    const [newHall, setNewHall] = useState({
        hall_code: '',
        rows: '',
        seats_per_row: ''
    });

    const [editingHall, setEditingHall] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const apiBase = 'http://localhost:8080/api/examination-halls';

    const filteredHalls = useMemo(() => {
        if (!searchQuery.trim()) return halls;
        const query = searchQuery.toLowerCase();
        return halls.filter(hall =>
            hall.hall_code.toLowerCase().includes(query)
        );
    }, [halls, searchQuery]);

    const capacityStats = useMemo(() => {
        const stats = halls.reduce((acc, hall) => {
            const cap = parseInt(hall.total_capacity) || ((parseInt(hall.rows) || 0) * (parseInt(hall.seats_per_row) || 0));
            if (hall.status === 'Approved') acc.approved += cap;
            else if (hall.status === 'Pending') acc.pending += cap;
            return acc;
        }, { approved: 0, pending: 0 });

        // Calculate total physical load (Students actually staying in this building)
        const buildingLoad = hostingSources.reduce((sum, src) => sum + (parseInt(src.count) || 0), 0);
        
        // Calculate guest students (non-institutional)
        const guests = hostingSources
            .filter(src => src.is_internal !== true)
            .reduce((sum, src) => sum + (parseInt(src.count) || 0), 0);

        return {
            approved: stats.approved,
            pending: stats.pending,
            allocated: guests,
            totalLoad: buildingLoad
        };
    }, [halls, hostingSources]);

    const { approved: approvedCapacity, pending: pendingCapacity, totalLoad } = capacityStats;

    useEffect(() => {
        fetchHalls();
        fetchTotalRooms();
        fetchStudentCount();
        fetchShortageRequests();
    }, []);

    const fetchStudentCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/seating-requirement`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTotalStudents(parseInt(data.total_required) || 0);
                setHostingSources(data.hosting_sources || []);
            }
        } catch (err) {
            console.error("Failed to fetch seating requirement", err);
        }
    };

    const fetchShortageRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/examination-halls/shortage', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShortageRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch shortage requests", err);
        }
    };

    const fetchTotalRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/college-admin/total-rooms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTotalRooms(data.total_rooms || 0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTotalRooms = async () => {
        setIsEditingRooms(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/college-admin/total-rooms', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ total_rooms: totalRooms })
            });

            if (res.ok) {
                toast.success("Total college rooms updated");
            } else {
                toast.error("Failed to update total rooms");
                fetchTotalRooms(); // revert
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const fetchHalls = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(apiBase, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHalls(data);
            } else {
                toast.error('Failed to fetch examination halls');
            }
        } catch (err) {
            toast.error('An error occurred while fetching halls');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHall = async (e) => {
        e.preventDefault();
        if (!newHall.hall_code || !newHall.rows || !newHall.seats_per_row) {
            return toast.warning("Please fill in all fields");
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newHall)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Examination hall added as Draft");
                setNewHall({ hall_code: '', rows: '', seats_per_row: '' });
                fetchHalls();
            } else {
                toast.error(data.error || "Failed to add hall");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleUpdateHall = async () => {
        if (!editingHall.hall_code || !editingHall.rows || !editingHall.seats_per_row) {
            return toast.warning("Please fill in all fields");
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/${editingHall.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editingHall)
            });

            if (res.ok) {
                toast.success("Hall updated successfully");
                setShowEditModal(false);
                fetchHalls();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update hall");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleSubmitHall = async (hallId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/${hallId}/submit`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("Hall submitted for approval");
                fetchHalls();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to submit hall");
            }
        } catch (err) {
            toast.error("An error occurred during submission");
        }
    };

    const handleReportShortage = async () => {
        try {
            const token = localStorage.getItem('token');
            const shortage = totalStudents - capacityStats.approved;
            if (shortage <= 0) return toast.info("No shortage to report");

            const res = await fetch(`${apiBase}/shortage-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_count: totalStudents,
                    available_capacity: capacityStats.approved,
                    shortage: shortage
                })
            });

            if (res.ok) {
                toast.success("Shortage report sent to University Admin. Awaiting external center allotment.");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to send shortage report");
            }
        } catch (err) {
            toast.error("An error occurred while reporting shortage");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Hall deleted successfully");
                fetchHalls();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete hall");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock size={14} className="text-amber-500 animate-pulse" />;
            case 'Approved': return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'Rejected': return <XCircle size={14} className="text-rose-500" />;
            default: return <Pencil size={14} className="text-slate-400" />;
        }
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const isEditable = (status) => ['Draft', 'Rejected'].includes(status);

    if (loading && halls.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Examination Halls</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 uppercase">Configure physical hall infrastructure and manage approvals.</p>
                    </div>
                </div>
            </div>

            {/* Total Structural Rooms Configuration */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                        <Layers size={28} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Total Campus Rooms Configuration</h2>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Define the absolute limit of physical rooms available in your institution</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isEditingRooms ? (
                        <>
                            <input
                                type="number"
                                min="0"
                                value={totalRooms}
                                onChange={e => setTotalRooms(e.target.value)}
                                className="w-28 p-4 bg-slate-50 border border-indigo-200 rounded-2xl text-center text-xl font-black text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                autoFocus
                            />
                            <button
                                onClick={handleUpdateTotalRooms}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                            >
                                Save Limit
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-28 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black text-slate-700">
                                {totalRooms}
                            </div>
                            <button
                                onClick={() => setIsEditingRooms(true)}
                                className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-widest text-xs"
                            >
                                Edit Limit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Capacity Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-200 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Total Students</span>
                            <span className="text-[9px] font-bold text-slate-400 lowercase group-hover:text-indigo-300 italic">(Internal)</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <span className="text-4xl font-black text-slate-900">{totalStudents}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Approved Capacity (Seats)</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 transition-colors">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <span className="text-4xl font-black text-emerald-600">{approvedCapacity}</span>
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md ${approvedCapacity < totalLoad
                        ? 'bg-rose-50 border-rose-100'
                        : 'bg-white border-blue-100'
                    }`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-16 -translate-y-16 pointer-events-none ${approvedCapacity < totalLoad ? 'bg-rose-100/50' : 'bg-blue-50'
                        }`} />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${approvedCapacity < totalLoad ? 'text-rose-600' : 'text-blue-500'
                            }`}>
                            {approvedCapacity < totalLoad ? 'Shortage' : 'Surplus Capacity'}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${approvedCapacity < totalLoad ? 'bg-rose-100 text-rose-500' : 'bg-blue-50 text-blue-500'
                            }`}>
                            {approvedCapacity < totalLoad ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${approvedCapacity < totalLoad ? 'text-rose-700' : 'text-blue-600'
                                }`}>
                                {Math.abs(totalLoad - approvedCapacity)}
                            </span>
                            <span className={`text-xs font-black uppercase tracking-widest ml-1 ${approvedCapacity < totalLoad ? 'text-rose-400' : 'text-blue-400'
                                }`}>Seats</span>
                        </div>
                        {approvedCapacity < totalLoad && (
                            <button
                                onClick={handleReportShortage}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                            >
                                <SendHorizontal size={14} />
                                Report
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">Awaiting Verification</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 transition-colors">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <span className="text-4xl font-black text-amber-600">{pendingCapacity}</span>
                    </div>
                </div>
            </div>


            {/* Add Hall Form */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden mb-12 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3 mb-8 ml-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <Layers size={18} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Add New Infrastructure</h3>
                </div>
                {totalRooms < 1 && (
                    <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[2px] z-20 flex items-center justify-center p-6">
                        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xl max-w-sm flex items-start gap-4">
                            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex-shrink-0 flex items-center justify-center">
                                <Clock size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Configuration Required</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Please set your <strong>Total Campus Rooms Configuration</strong> above to at least 1 before adding or editing examination halls.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleCreateHall} className={`grid grid-cols-1 md:grid-cols-6 gap-6 items-end ${totalRooms < 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                    <div className="space-y-3 col-span-1 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Hall Code</label>
                        <input
                            type="text"
                            disabled={totalRooms < 1}
                            value={newHall.hall_code}
                            onChange={(e) => setNewHall({ ...newHall, hall_code: e.target.value.toUpperCase() })}
                            placeholder="HALL-A"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Rows</label>
                        <input
                            type="number"
                            min="1"
                            disabled={totalRooms < 1}
                            value={newHall.rows}
                            onChange={(e) => setNewHall({ ...newHall, rows: e.target.value })}
                            placeholder="10"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Seats/Row</label>
                        <input
                            type="number"
                            min="1"
                            disabled={totalRooms < 1}
                            value={newHall.seats_per_row}
                            onChange={(e) => setNewHall({ ...newHall, seats_per_row: e.target.value })}
                            placeholder="8"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="bg-indigo-50/50 p-4 rounded-[1.25rem] border border-indigo-100 flex flex-col items-center justify-center min-h-[58px]">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 text-center leading-tight">Total Capacity</span>
                        <span className="text-xl font-black text-indigo-600 leading-none">
                            {(parseInt(newHall.rows) || 0) * (parseInt(newHall.seats_per_row) || 0)}
                        </span>
                    </div>
                    <button
                        type="submit"
                        disabled={totalRooms < 1}
                        className="inline-flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-[10px] disabled:bg-slate-300 disabled:shadow-none disabled:grayscale disabled:scale-100 w-full min-h-[58px]"
                    >
                        <Save size={16} />
                        <span className="leading-tight">Add Draft</span>
                    </button>
                </form>
            </div>

            {/* Halls Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mt-8 transition-all hover:shadow-lg">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Hall Infrastructure Mapping</h2>
                        <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-wide">Review, edit, and submit halls for validation</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter by hall code..."
                                className="pl-11 pr-4 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all w-full md:w-64"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100/60">
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hall Details</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Layout Configuration</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Net Capacity</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Approval Status</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredHalls.length > 0 ? (
                                filteredHalls.map((hall) => (
                                    <tr key={hall.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                                                    <Building2 size={24} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{hall.hall_code}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {String(hall.id).slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <div className="flex items-center justify-center gap-6 text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 leading-none">{hall.rows}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Rows</span>
                                                </div>
                                                <div className="w-px h-8 bg-slate-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 leading-none">{hall.seats_per_row}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">S/Row</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <div className="inline-flex flex-col items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-black shadow-sm h-12 justify-center min-w-[90px]">
                                                <span className="text-base">{hall.total_capacity}</span>
                                                <span className="text-[9px] uppercase tracking-widest opacity-60">Units</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${getStatusClasses(hall.status)}`}>
                                                {getStatusIcon(hall.status)}
                                                {hall.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(hall.status === 'Draft' || hall.status === 'Rejected') && (
                                                    <button
                                                        disabled={totalRooms < 1}
                                                        onClick={() => handleSubmitHall(hall.id)}
                                                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                                        title={totalRooms < 1 ? "Set room limit first" : "Submit for Approval"}
                                                    >
                                                        <SendHorizontal size={14} />
                                                        <span>Send</span>
                                                    </button>
                                                )}

                                                <button
                                                    disabled={!isEditable(hall.status) || totalRooms < 1}
                                                    onClick={() => {
                                                        setEditingHall(hall);
                                                        setShowEditModal(true);
                                                    }}
                                                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border ${isEditable(hall.status) && totalRooms >= 1
                                                            ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200'
                                                            : 'text-slate-200 border-slate-100 cursor-not-allowed opacity-50'
                                                        }`}
                                                    title={totalRooms < 1 ? "Set room limit first" : isEditable(hall.status) ? "Edit Hall" : "Editing Locked"}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    disabled={(!isEditable(hall.status) && hall.status !== 'Pending') || totalRooms < 1}
                                                    onClick={() => {
                                                        setDeleteTarget(hall);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border ${(isEditable(hall.status) || hall.status === 'Pending') && totalRooms >= 1
                                                            ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-slate-200 hover:border-red-200'
                                                            : 'text-slate-200 border-slate-100 cursor-not-allowed opacity-50'
                                                        }`}
                                                    title={hall.status === 'Pending' ? "Delete Pending Request" : "Delete Hall"}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-20 px-8 text-center bg-slate-50/50">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center text-slate-200 shadow-sm">
                                                <Building2 size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    Zero Infrastructure Detected
                                                </p>
                                                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
                                                    Start by adding your first examination hall above
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Institutional Breakdown and Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Seating Requirement Source</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Breakdown of internal & guest institutions</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {hostingSources.length > 0 ? (
                            hostingSources.map((src, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                        <span className="text-sm font-black text-slate-800">{src.name}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-black text-indigo-600">
                                        {src.count} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Students</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <Users size={32} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-sm font-bold text-slate-400 italic">No students assigned to this center yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white">Seating Governance</h3>
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-1">Real-time capacity distribution</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-white">
                                    {totalStudents > 0 ? (((capacityStats.approved + capacityStats.allocated) / totalStudents) * 100).toFixed(1) : 0}%
                                </span>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 text-right">Total Coverage</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 border border-white/5 flex">
                                <div
                                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                    style={{ width: `${totalStudents > 0 ? Math.min(100, (capacityStats.approved / totalStudents) * 100) : 0}%` }}
                                />
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000 border-l border-white/30"
                                    style={{ width: `${totalStudents > 0 ? Math.min(100 - (capacityStats.approved / totalStudents) * 100, (capacityStats.allocated / totalStudents) * 100) : 0}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Internal</span>
                                    </div>
                                    <p className="text-sm font-black text-white">{capacityStats.approved}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full ring-4 ring-blue-500/20" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">External</span>
                                    </div>
                                    <p className="text-sm font-black text-white">{capacityStats.allocated}</p>
                                </div>
                                <div className="flex flex-col gap-1 border-l border-white/10 pl-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full ring-4 ring-amber-500/20" />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Target</span>
                                    </div>
                                    <p className="text-sm font-black text-white">{totalStudents}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingHall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Modify Hall</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Status: {editingHall.status}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5 text-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Capacity Forecast</span>
                                <div className="text-2xl font-black text-indigo-600 mt-1">
                                    {(parseInt(editingHall.rows) || 0) * (parseInt(editingHall.seats_per_row) || 0)}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hall Code</label>
                                <input
                                    type="text"
                                    value={editingHall.hall_code}
                                    onChange={(e) => setEditingHall({ ...editingHall, hall_code: e.target.value.toUpperCase() })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rows</label>
                                    <input
                                        type="number"
                                        value={editingHall.rows}
                                        onChange={(e) => setEditingHall({ ...editingHall, rows: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seats/Row</label>
                                    <input
                                        type="number"
                                        value={editingHall.seats_per_row}
                                        onChange={(e) => setEditingHall({ ...editingHall, seats_per_row: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-xs font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Cancel</button>
                            <button onClick={handleUpdateHall} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 uppercase tracking-widest">Apply Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner ring-8 ring-rose-50 border border-rose-100">
                                <Trash2 size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Hall?</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 px-4">
                                This will permanently remove <span className="font-black text-slate-900">{deleteTarget?.hall_code}</span> and its infrastructure mapping from the university records.
                            </p>
                            <div className="flex gap-4 w-full">
                                <button
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-2xl transition-all uppercase tracking-widest"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Abort
                                </button>
                                <button
                                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-rose-500/20 transition-all uppercase tracking-widest"
                                    onClick={handleDeleteConfirm}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExaminationHalls;
