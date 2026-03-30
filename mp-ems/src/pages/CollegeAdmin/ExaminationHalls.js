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
        return halls.reduce((acc, hall) => {
            const cap = parseInt(hall.total_capacity) || ((parseInt(hall.rows) || 0) * (parseInt(hall.seats_per_row) || 0));
            if (hall.status === 'Approved') acc.approved += cap;
            else if (hall.status === 'Pending') acc.pending += cap;
            else acc.draft += cap;
            acc.total += cap;
            return acc;
        }, { approved: 0, pending: 0, draft: 0, total: 0 });
    }, [halls]);


    useEffect(() => {
        fetchHalls();
        fetchTotalRooms();
        fetchStudentCount();
    }, []);

    const fetchStudentCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTotalStudents(data.length || 0);
            }
        } catch (err) {
            console.error("Failed to fetch students", err);
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

    const isEditable = (status) => ['Draft', 'Rejected', 'Approved'].includes(status);

    if (loading && halls.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Building2 size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Examination Halls</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Configure physical hall infrastructure and manage approvals.</p>
                </div>
            </div>

            {/* Total Structural Rooms Configuration */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Campus Rooms Configuration</h2>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Define the absolute limit of physical rooms available in your institution</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEditingRooms ? (
                        <>
                            <input 
                                type="number" 
                                min="0"
                                value={totalRooms} 
                                onChange={e => setTotalRooms(e.target.value)}
                                className="w-24 p-3 bg-slate-50 border border-indigo-200 rounded-xl text-center text-lg font-black text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/20"
                                autoFocus
                            />
                            <button 
                                onClick={handleUpdateTotalRooms}
                                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm"
                            >
                                Save Limit
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black text-slate-700">
                                {totalRooms}
                            </div>
                            <button 
                                onClick={() => setIsEditingRooms(true)}
                                className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all text-sm"
                            >
                                Edit Limit
                            </button>
                        </>
                    )}
                </div>
            </div>


            {/* Capacity Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Population (Students)</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <Users size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-slate-800">{totalStudents}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="text-xs font-black text-emerald-600/70 uppercase tracking-widest">Approved Capacity (Seats)</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <span className="text-3xl font-black text-emerald-600">{capacityStats.approved}</span>
                    </div>
                </div>

                {/* Shortage indicator */}
                <div className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                    capacityStats.approved < totalStudents 
                    ? 'bg-rose-50 border-rose-100' 
                    : 'bg-white border-blue-100'
                }`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-16 -translate-y-16 pointer-events-none ${
                        capacityStats.approved < totalStudents ? 'bg-rose-100/50' : 'bg-blue-50'
                    }`} />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className={`text-xs font-black uppercase tracking-widest ${
                            capacityStats.approved < totalStudents ? 'text-rose-600' : 'text-blue-500'
                        }`}>
                            {capacityStats.approved < totalStudents ? 'Shortage' : 'Surplus Capacity'}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                             capacityStats.approved < totalStudents ? 'bg-rose-100 text-rose-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                            {capacityStats.approved < totalStudents ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black ${
                                capacityStats.approved < totalStudents ? 'text-rose-700' : 'text-blue-600'
                            }`}>
                                {Math.abs(totalStudents - capacityStats.approved)}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                capacityStats.approved < totalStudents ? 'text-rose-400' : 'text-blue-400'
                            }`}>Seats</span>
                        </div>
                        {capacityStats.approved < totalStudents && (
                            <button 
                                onClick={handleReportShortage}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1"
                            >
                                <SendHorizontal size={12} />
                                Report
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="text-xs font-black text-amber-600/70 uppercase tracking-widest">Awaiting Verification</span>
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <span className="text-3xl font-black text-amber-600">{capacityStats.pending}</span>
                    </div>
                </div>
            </div>


                        {/* Capacity Utilization Progress */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Campus Capacity Utilization</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Approved capacity vs required student seating</p>
                    </div>
                    <div className="text-right text-xs font-black uppercase tracking-widest">
                        {totalStudents > 0 ? ((capacityStats.approved / totalStudents) * 100).toFixed(1) : 0}% Coverage
                    </div>
                </div>

                <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/50">
                    {/* Approved Progress */}
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-700 relative group"
                        style={{ width: `${totalStudents > 0 ? Math.min(100, (capacityStats.approved / totalStudents) * 100) : 0}%` }}
                    >
                        <div className="absolute inset-y-0 right-0 w-px bg-white/20" />
                    </div>
                    {/* Pending Progress (Potential) */}
                    <div 
                        className="h-full bg-amber-400/50 transition-all duration-700 relative border-l border-white/30 border-dashed"
                        style={{ width: `${totalStudents > 0 ? Math.min(100 - (capacityStats.approved / totalStudents) * 100, (capacityStats.pending / totalStudents) * 100) : 0}%` }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Approved Seats ({capacityStats.approved})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending Validation ({capacityStats.pending})</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Target Requirement: {totalStudents} Seats</span>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <form onSubmit={handleCreateHall} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="space-y-2 col-span-1 md:col-span-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">Hall Code</label>
                        <input 
                            type="text"
                            value={newHall.hall_code}
                            onChange={(e) => setNewHall({...newHall, hall_code: e.target.value.toUpperCase()})}
                            placeholder="HALL-A"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Rows</label>
                        <input 
                            type="number"
                            min="1"
                            value={newHall.rows}
                            onChange={(e) => setNewHall({...newHall, rows: e.target.value})}
                            placeholder="10"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Seats/Row</label>
                        <input 
                            type="number"
                            min="1"
                            value={newHall.seats_per_row}
                            onChange={(e) => setNewHall({...newHall, seats_per_row: e.target.value})}
                            placeholder="8"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Total Capacity</span>
                        <span className="text-lg font-black text-indigo-600">
                            {(parseInt(newHall.rows) || 0) * (parseInt(newHall.seats_per_row) || 0)}
                        </span>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Save size={18} />
                        <span>Add as Draft</span>
                    </button>
                </form>
            </div>

            {/* Halls Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Hall Infrastructure</h2>
                        <p className="text-sm text-slate-500 mt-1">Review, edit, and submit halls for validation by university.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by hall code..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100/60">
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Hall Details</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Layout Configuration</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Net Capacity</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Approval Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredHalls.length > 0 ? (
                                filteredHalls.map((hall) => (
                                    <tr key={hall.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{hall.hall_code}</span>
                                                    <span className="text-[10px] font-medium text-slate-400">Created: {new Date(hall.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-4 text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-900">{hall.rows}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase">Rows</span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-900">{hall.seats_per_row}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase">Seats/Row</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex flex-col items-center p-2 min-w-[80px]">
                                                <span className="text-sm font-black text-indigo-600">{hall.total_capacity}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Units</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${getStatusClasses(hall.status)}`}>
                                                {getStatusIcon(hall.status)}
                                                {hall.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {hall.status === 'Draft' || hall.status === 'Rejected' ? (
                                                    <button 
                                                        onClick={() => handleSubmitHall(hall.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-bold text-xs"
                                                        title="Submit for Approval"
                                                    >
                                                        <SendHorizontal size={14} />
                                                        <span>Submit</span>
                                                    </button>
                                                ) : null}
                                                
                                                <button 
                                                    disabled={!isEditable(hall.status)}
                                                    onClick={() => {
                                                        setEditingHall(hall);
                                                        setShowEditModal(true);
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        isEditable(hall.status) 
                                                        ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50' 
                                                        : 'text-slate-200 cursor-not-allowed'
                                                    }`}
                                                    title={isEditable(hall.status) ? "Edit Hall" : "Editing Locked"}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    disabled={!isEditable(hall.status)}
                                                    onClick={() => {
                                                        setDeleteTarget(hall);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        isEditable(hall.status) 
                                                        ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' 
                                                        : 'text-slate-200 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 size={32} className="text-slate-200" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                No halls configured yet
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingHall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto border border-white/20">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Modify Hall</h3>
                                <p className="text-xs text-slate-500 font-medium tracking-tight">Status: {editingHall.status}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-white hover:bg-slate-200 text-slate-400 rounded-xl transition-colors border border-slate-200">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-1.5 text-center p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">New Capacity Preview</span>
                                <div className="text-2xl font-black text-indigo-600">
                                    {(parseInt(editingHall.rows) || 0) * (parseInt(editingHall.seats_per_row) || 0)}
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Hall Identification</label>
                                <input 
                                    type="text"
                                    value={editingHall.hall_code}
                                    onChange={(e) => setEditingHall({...editingHall, hall_code: e.target.value.toUpperCase()})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Rows</label>
                                    <input 
                                        type="number"
                                        value={editingHall.rows}
                                        onChange={(e) => setEditingHall({...editingHall, rows: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Seats/Row</label>
                                    <input 
                                        type="number"
                                        value={editingHall.seats_per_row}
                                        onChange={(e) => setEditingHall({...editingHall, seats_per_row: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-tight">Cancel</button>
                            <button onClick={handleUpdateHall} className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all uppercase tracking-tight">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Configuration?</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                                This will permanently remove <span className="font-bold text-slate-700">{deleteTarget?.hall_code}</span> and its infrastructure mapping.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Abort
                                </button>
                                <button 
                                    className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all font-bold"
                                    onClick={handleDeleteConfirm}
                                >
                                    Confirm Delete
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
