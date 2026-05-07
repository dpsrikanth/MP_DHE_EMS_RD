import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Building2, Save, Pencil, Trash2, X, Search, Layers, Users, SendHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { collegeAdminApi } from '../../api/collegeAdminApi';

ChartJS.register(ArcElement, Tooltip);

const ExaminationHalls = () => {
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalRooms, setTotalRooms] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [hostingSources, setHostingSources] = useState([]);
    const [examBreakdown, setExamBreakdown] = useState([]);
    const [shortageRequests, setShortageRequests] = useState([]);
    const [isEditingRooms, setIsEditingRooms] = useState(false);


    const [newHall, setNewHall] = useState({
        hall_code: '',
        rows: '',
        seats_per_row: '',
        exam_id: ''
    });
    const [exams, setExams] = useState([]);

    const [editingHall, setEditingHall] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);



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
        fetchExams();
    }, []);

    // Re-fetch student count when exam changes
    useEffect(() => {
        fetchStudentCount(newHall.exam_id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newHall.exam_id]);

    const fetchExams = async () => {
        try {
            const data = await collegeAdminApi.getExams();
            if (data) {
                const published = data.filter(e => e.status === true || e.is_published === true);
                // Deduplicate by program + semester + exam name to avoid repeated entries
                const seen = new Set();
                const unique = published.filter(e => {
                    const key = `${e.program_name}|${e.semester_name}|${e.exam_name}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setExams(unique);
                // Auto-select the first exam on page load so stats are always contextual
                if (unique.length > 0) {
                    setNewHall(prev => prev.exam_id ? prev : { ...prev, exam_id: String(unique[0].id) });
                }
            }
        } catch (err) {
            console.error("Failed to fetch exams", err);
        }
    };

    const fetchStudentCount = async (examId = null) => {
        try {
            const data = await collegeAdminApi.getSeatingRequirement(examId);
            if (data) {
                setTotalStudents(parseInt(data.total_required) || 0);
                setHostingSources(data.hosting_sources || []);
                setExamBreakdown(data.exam_breakdown || []);
            }
        } catch (err) {
            console.error("Failed to fetch seating requirement", err);
        }
    };

    const fetchShortageRequests = async () => {
        try {
            const data = await collegeAdminApi.getShortages();
            if (data) {
                setShortageRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch shortage requests", err);
        }
    };

    const fetchTotalRooms = async () => {
        try {
            const data = await collegeAdminApi.getTotalRooms();
            if (data) {
                setTotalRooms(data.total_rooms || 0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTotalRooms = async () => {
        setIsEditingRooms(false);
        try {
            await collegeAdminApi.updateTotalRooms({ total_rooms: totalRooms });
            toast.success("Total college rooms updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update total rooms");
            fetchTotalRooms(); // revert
        }
    };

    const fetchHalls = async () => {
        try {
            setLoading(true);
            const data = await collegeAdminApi.getHalls();
            if (data) {
                setHalls(data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred while fetching halls');
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
            await collegeAdminApi.createHallMapping(newHall);
            toast.success("Examination hall added as Draft");
            setNewHall({ hall_code: '', rows: '', seats_per_row: '', exam_id: '' });
            fetchHalls();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to add hall");
        }
    };

    const handleUpdateHall = async () => {
        if (!editingHall.hall_code || !editingHall.rows || !editingHall.seats_per_row) {
            return toast.warning("Please fill in all fields");
        }

        try {
            await collegeAdminApi.updateHallMapping(editingHall.id, editingHall);
            toast.success("Hall updated successfully");
            setShowEditModal(false);
            fetchHalls();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update hall");
        }
    };

    const handleSubmitHall = async (hallId) => {
        try {
            await collegeAdminApi.submitHallMapping(hallId);
            toast.success("Hall submitted for approval");
            fetchHalls();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to submit hall");
        }
    };

    const handleReportShortage = async () => {
        try {
            const shortage = totalStudents - capacityStats.approved;
            if (shortage <= 0) return toast.info("No shortage to report");

            await collegeAdminApi.requestShortage({
                student_count: totalStudents,
                available_capacity: capacityStats.approved,
                shortage: shortage
            });

            toast.success("Shortage report sent to University Admin. Awaiting external center allotment.");
            // Refresh shortage request state so card updates immediately
            fetchShortageRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to send shortage report");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await collegeAdminApi.deleteHallMapping(deleteTarget.id);
            toast.success("Hall deleted successfully");
            fetchHalls();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to delete hall");
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock size={14} className="text-indigo-600 animate-pulse" />;
            case 'Approved': return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'Rejected': return <XCircle size={14} className="text-rose-500" />;
            default: return <Pencil size={14} className="text-slate-400" />;
        }
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Pending': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
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
            {/* Header with Exam Selector on right */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Examination Halls</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 ">Configure physical hall infrastructure and manage approvals.</p>
                    </div>
                </div>
                {/* Global Exam Context Selector */}
                <div className="flex flex-col gap-1 min-w-[280px]">
                    <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1">Active Exam Context</label>
                    <select
                        value={newHall.exam_id}
                        onChange={(e) => setNewHall({ ...newHall, exam_id: e.target.value })}
                        className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-[11px] font-black text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="">— Select Exam to Filter Stats —</option>
                        {exams.map(exam => {
                            const date = exam.exam_date ? formatDate(exam.exam_date) : '';
                            const time = (exam.start_time && exam.end_time) ? ` | ${exam.start_time} – ${exam.end_time}` : '';
                            const label = `${exam.program_name || ''} • ${exam.semester_name || ''} — ${exam.exam_name}${date ? ` [${date}${time}]` : ''}`;
                            return <option key={exam.id} value={exam.id}>{label.toUpperCase()}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Total Structural Rooms Configuration */}
            <div className={`bg-white rounded-[2rem] shadow-sm border p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md ${
                newHall.exam_id && totalRooms < 1 ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'
            }`}>
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                        newHall.exam_id && totalRooms < 1 ? 'bg-rose-100 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                    }`}>
                        <Layers size={28} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Total Campus Rooms Configuration</h2>
                        <p className="text-[13px] font-bold text-slate-500 mt-1  tracking-wider">Define the absolute limit of physical rooms available in your institution</p>
                        {/* Context badge — only shows when an exam is chosen */}
                        {newHall.exam_id && (
                            totalRooms > 0 ? (
                                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-black rounded-full  tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> {totalRooms} Rooms Configured for this Exam
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-[12px] font-black rounded-full  tracking-widest animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"/> Set Room Limit Before Adding Halls
                                </span>
                            )
                        )}
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
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95  tracking-widest text-[13px]"
                            >
                                Save Limit
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={`w-28 p-4 rounded-2xl text-center text-xl font-black border ${
                                totalRooms < 1 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                {totalRooms < 1 ? '—' : totalRooms}
                            </div>
                            <button
                                onClick={() => setIsEditingRooms(true)}
                                className={`px-8 py-4 font-black rounded-2xl shadow-sm transition-all active:scale-95  tracking-widest text-[13px] border ${
                                    newHall.exam_id && totalRooms < 1
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-rose-200 animate-pulse'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                {totalRooms < 1 ? 'Set Limit' : 'Edit Limit'}
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
                            <span className="text-[12px] font-black text-slate-400  tracking-widest group-hover:text-indigo-400">Total Students</span>
                            {newHall.exam_id ? (
                                <span className="text-[9px] font-bold text-indigo-500 lowercase italic mt-0.5">
                                    {exams.find(e => String(e.id) === String(newHall.exam_id))?.program_name || ''} - {exams.find(e => String(e.id) === String(newHall.exam_id))?.semester_name || ''}
                                </span>
                            ) : (
                                <span className="text-[9px] font-bold text-slate-400 lowercase italic">All Exams (Global)</span>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <span className="text-4xl font-black text-slate-900">{totalStudents}</span>
                        {newHall.exam_id && <span className="text-[13px] font-bold text-indigo-400 ml-2">for selected exam</span>}
                    </div>
                </div>


                <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[12px] font-black text-emerald-600/70  tracking-widest">Approved Capacity (Seats)</span>
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
                        : 'bg-indigo-50 border-indigo-100'
                    }`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full translate-x-16 -translate-y-16 pointer-events-none ${approvedCapacity < totalLoad ? 'bg-rose-100/50' : 'bg-indigo-100/50'
                        }`} />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className={`text-[12px] font-black  tracking-widest ${approvedCapacity < totalLoad ? 'text-rose-600' : 'text-indigo-600'
                            }`}>
                            {approvedCapacity < totalLoad ? 'Shortage' : 'Surplus Capacity'}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${approvedCapacity < totalLoad ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            {approvedCapacity < totalLoad ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${approvedCapacity < totalLoad ? 'text-rose-700' : 'text-indigo-600'
                                }`}>
                                {Math.abs(totalLoad - approvedCapacity)}
                            </span>
                            <span className={`text-[13px] font-black  tracking-widest ml-1 ${approvedCapacity < totalLoad ? 'text-rose-400' : 'text-indigo-400'
                                }`}>Seats</span>
                        </div>
                        {approvedCapacity < totalLoad && (() => {
                            // Check if a shortage report is already pending or allocated
                            const pendingReport = shortageRequests.find(r => r.status === 'Pending');
                            const allocatedReport = shortageRequests.find(r => r.status === 'Allocated');
                            if (allocatedReport) {
                                return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[12px] font-black  tracking-widest">
                                        <CheckCircle2 size={12} />
                                        Center Assigned
                                    </span>
                                );
                            }
                            if (pendingReport) {
                                return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[12px] font-black  tracking-widest animate-pulse">
                                        <Clock size={12} />
                                        Reported · Awaiting
                                    </span>
                                );
                            }
                            return (
                                <button
                                    onClick={handleReportShortage}
                                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black  tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    <SendHorizontal size={14} />
                                    Report
                                </button>
                            );
                        })()}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[12px] font-black text-indigo-600/70  tracking-widest">Awaiting Verification</span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="relative z-10 space-y-1">
                        <span className="text-4xl font-black text-indigo-600">
                            {pendingCapacity + shortageRequests.filter(r => r.status === 'Pending').length}
                        </span>
                        {shortageRequests.some(r => r.status === 'Pending') && (
                            <p className="text-[12px] font-bold text-indigo-400  tracking-widest">
                                Incl. shortage report pending
                            </p>
                        )}
                    </div>
                </div>
            </div>


            {/* Add Hall Form */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden mb-12 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3 mb-8 ml-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <Layers size={18} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800  tracking-widest">Add New Infrastructure</h3>
                </div>
                {totalRooms < 1 && (
                    <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[2px] z-20 flex items-center justify-center p-6">
                        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-xl max-w-sm flex items-start gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center">
                                <Clock size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Configuration Required</h4>
                                <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                                    Please set your <strong>Total Campus Rooms Configuration</strong> above to at least 1 before adding or editing examination halls.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleCreateHall} className={`space-y-6 ${totalRooms < 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                    {/* Selected Exam Display (read-only, driven by top-level selector) */}
                    {newHall.exam_id && exams.find(e => String(e.id) === String(newHall.exam_id)) && (() => {
                        const ctx = exams.find(e => String(e.id) === String(newHall.exam_id));
                        return (
                            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="text-[12px] font-black text-indigo-400  tracking-widest">Linked Exam:</span>
                                <span className="text-[13px] font-black text-indigo-700">{ctx.program_name} • {ctx.semester_name} – {ctx.exam_name}</span>
                            </div>
                        );
                    })()}
                    {!newHall.exam_id && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <span className="text-[12px] font-black text-amber-600  tracking-widest">⚠ Select an Active Exam Context from the top-right dropdown first.</span>
                        </div>
                    )}
                    {/* Inline fields row */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                    <div className="space-y-3 col-span-1 md:col-span-2">
                        <label className="text-[13px] font-black text-slate-400  tracking-widest ml-4">Hall Code</label>
                        <input
                            type="text"
                            disabled={totalRooms < 1}
                            value={newHall.hall_code}
                            onChange={(e) => setNewHall({ ...newHall, hall_code: e.target.value.toUpperCase() })}
                            placeholder="HALL-A"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all  placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[13px] font-black text-slate-400  tracking-widest ml-4">Rows</label>
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
                        <label className="text-[13px] font-black text-slate-400  tracking-widest ml-4">Seats/Row</label>
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
                        <span className="text-[12px] font-black text-indigo-400  tracking-widest mb-1 text-center leading-tight">Total Capacity</span>
                        <span className="text-xl font-black text-indigo-600 leading-none">
                            {(parseInt(newHall.rows) || 0) * (parseInt(newHall.seats_per_row) || 0)}
                        </span>
                    </div>
                    <button
                        type="submit"
                        disabled={totalRooms < 1}
                        className="inline-flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95  tracking-widest text-[12px] disabled:bg-slate-300 disabled:shadow-none disabled:grayscale disabled:scale-100 w-full min-h-[58px]"
                    >
                        <Save size={16} />
                        <span className="leading-tight">Add Draft</span>
                    </button>
                    </div>
                </form>
            </div>

            {/* Halls Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mt-8 transition-all hover:shadow-lg">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Hall Infrastructure Mapping</h2>
                        <p className="text-sm text-slate-500 mt-1 font-bold  tracking-wide">Review, edit, and submit halls for validation</p>
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
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest">Hall Details</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-center">Layout Configuration</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-center">Net Capacity</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-center">Approval Status</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-right">Actions</th>
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
                                                    <span className="text-sm font-black text-slate-800  tracking-tight">{hall.hall_code}</span>
                                                    <span className="text-[12px] font-bold text-slate-400  tracking-widest mt-0.5">ID: {String(hall.id).slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <div className="flex items-center justify-center gap-6 text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 leading-none">{hall.rows}</span>
                                                    <span className="text-[9px] font-black text-slate-400  tracking-widest mt-1">Rows</span>
                                                </div>
                                                <div className="w-px h-8 bg-slate-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-slate-900 leading-none">{hall.seats_per_row}</span>
                                                    <span className="text-[9px] font-black text-slate-400  tracking-widest mt-1">S/Row</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <div className="inline-flex flex-col items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-black shadow-sm h-12 justify-center min-w-[90px]">
                                                <span className="text-base">{hall.total_capacity}</span>
                                                <span className="text-[9px]  tracking-widest opacity-60">Units</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-black  tracking-widest border transition-all shadow-sm ${getStatusClasses(hall.status)}`}>
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
                                                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-black text-[12px]  tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
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
                                                <p className="text-sm font-black text-slate-400  tracking-[0.2em]">
                                                    Zero Infrastructure Detected
                                                </p>
                                                <p className="text-[13px] text-slate-300 font-bold  tracking-widest">
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
                            <p className="text-sm text-slate-500 font-bold  tracking-wider">Breakdown of internal & guest institutions</p>
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
                                        {src.count} <span className="text-[12px] text-slate-400 font-bold ml-1 ">Students</span>
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
                    
                    {examBreakdown.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-[12px] font-black text-slate-400 mb-4  tracking-widest">Active Exam Details</h4>
                            <div className="flex flex-col gap-3">
                                {examBreakdown.map((exam, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-indigo-100 text-indigo-500 flex items-center justify-center font-black text-[13px] shadow-sm">
                                                E{idx + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800  tracking-tight">
                                                    {exam.program_name || 'Unknown Program'} - {exam.semester || 'N/A'}
                                                </span>
                                                <span className="text-[12px] font-bold text-slate-500  tracking-widest truncate max-w-[200px]">
                                                    {exam.exam_name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white border border-indigo-100 rounded-lg shadow-sm">
                                            <span className="text-sm font-black text-indigo-600">{exam.student_count}</span>
                                            <span className="text-[12px] text-slate-400 font-bold ml-1 ">Students</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-white">Seating Governance</h3>
                                <p className="text-emerald-400 text-[12px] font-black  tracking-widest mt-1">Real-time capacity distribution</p>
                            </div>
                        </div>

                        {/* Doughnut Chart */}
                        <div className="flex justify-center items-center my-2" style={{ height: 160 }}>
                            <div style={{ position: 'relative', width: 160, height: 160 }}>
                                <Doughnut
                                    data={{
                                        labels: ['Occupied', 'Vacant', 'External'],
                                        datasets: [{
                                            data: [
                                                capacityStats.approved,
                                                Math.max(0, capacityStats.approved - totalStudents),
                                                capacityStats.allocated
                                            ],
                                            backgroundColor: ['#10b981', '#334155', '#3b82f6'],
                                            borderWidth: 0,
                                            hoverOffset: 4
                                        }]
                                    }}
                                    options={{
                                        cutout: '72%',
                                        plugins: { legend: { display: false }, tooltip: { enabled: true } },
                                        maintainAspectRatio: false
                                    }}
                                />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <span style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                                        {totalStudents > 0 ? (((capacityStats.approved + capacityStats.allocated) / totalStudents) * 100).toFixed(0) : 0}%
                                    </span>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: '', letterSpacing: 2, marginTop: 4 }}>Coverage</span>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20" />
                                    <span className="text-[9px] font-black text-white/40  tracking-widest">Internal</span>
                                </div>
                                <p className="text-sm font-black text-white">{capacityStats.approved}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo- rounded-full ring-4 -indigo-/20" />
                                    <span className="text-[9px] font-black text-white/40  tracking-widest">External</span>
                                </div>
                                <p className="text-sm font-black text-white">{capacityStats.allocated}</p>
                            </div>
                            <div className="flex flex-col gap-1 border-l border-white/10 pl-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo- rounded-full ring-4 -indigo-/20" />
                                    <span className="text-[9px] font-black text-white/40  tracking-widest">Target</span>
                                </div>
                                <p className="text-sm font-black text-white">{totalStudents}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingHall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Modify Hall</h3>
                                <p className="text-[12px] text-slate-500 font-black  tracking-widest mt-0.5">Status: {editingHall.status}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5 text-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                <span className="text-[12px] font-black text-indigo-400  tracking-widest">Capacity Forecast</span>
                                <div className="text-2xl font-black text-indigo-600 mt-1">
                                    {(parseInt(editingHall.rows) || 0) * (parseInt(editingHall.seats_per_row) || 0)}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1">Hall Code</label>
                                <input
                                    type="text"
                                    value={editingHall.hall_code}
                                    onChange={(e) => setEditingHall({ ...editingHall, hall_code: e.target.value.toUpperCase() })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 "
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1">Rows</label>
                                    <input
                                        type="number"
                                        value={editingHall.rows}
                                        onChange={(e) => setEditingHall({ ...editingHall, rows: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1">Seats/Row</label>
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
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-[13px] font-black text-slate-500 hover:text-slate-800 transition-colors  tracking-widest">Cancel</button>
                            <button onClick={handleUpdateHall} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95  tracking-widest">Apply Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
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
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[13px] font-black rounded-2xl transition-all  tracking-widest"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Abort
                                </button>
                                <button
                                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-black rounded-2xl shadow-lg shadow-rose-500/20 transition-all  tracking-widest"
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
