import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Users, Layout, Trash2, Play, Search, Building2, ChevronRight, Download, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { TableSearch } from '../../components/TableControls';
import { formatDate } from '../../utils/dateUtils';
import { collegeAdminApi } from '../../api/collegeAdminApi';

const SeatingArrangement = () => {
    const [arrangements, setArrangements] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ totalStudents: 0, approvedCapacity: 0 });
    const [seatingPattern, setSeatingPattern] = useState('sequential');
    const [approvedHalls, setApprovedHalls] = useState([]);
    const [isLocked, setIsLocked] = useState(false);




    useEffect(() => {
        fetchExams();
        fetchStats();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            const exam = exams.find(e => e.id === parseInt(selectedExam));
            setIsLocked(exam?.seating_locked || false);
            fetchArrangements();
            fetchStats(selectedExam); // Fetch stats for the specific exam
        } else {
            setArrangements([]);
            setIsLocked(false);
            fetchStats(); // Reset to global stats if no exam selected
        }
    }, [selectedExam, exams]);


    const fetchExams = async () => {
        try {
            const data = await collegeAdminApi.getExams();
            setExams(data.filter(e => e.status === true || e.is_published === true));
        } catch (err) {
            console.error("Failed to fetch exams", err);
        }
    };

    const fetchStats = async (examId = '') => {
        try {
            // Fetch total capacity
            const halls = await collegeAdminApi.getHalls();
            // Fetch student requirement
            const req = await collegeAdminApi.getSeatingRequirement(examId);
            
            const approved = (halls || []).filter(h => h.status === 'Approved');
            const approvedCap = approved.reduce((sum, h) => sum + (parseInt(h.total_capacity) || ((parseInt(h.rows)||0) * (parseInt(h.seats_per_row)||0))), 0);
            
            setApprovedHalls(approved);
            setStats({
                totalStudents: parseInt(req.total_required) || 0,
                approvedCapacity: approvedCap
            });
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const fetchArrangements = async () => {
        try {
            setLoading(true);
            const data = await collegeAdminApi.getSeatingArrangements({ exam_id: selectedExam });
            setArrangements(data);
            // Also check lock status from the first item if available
            if (data.length > 0 && data[0].seating_locked !== undefined) {
                setIsLocked(data[0].seating_locked);
            }
        } catch (err) {
            toast.error("Failed to fetch seating arrangements");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAllocate = async () => {
        if (!selectedExam) return toast.warning("Please select an exam first");
        
        try {
            setLoading(true);
            const data = await collegeAdminApi.autoAllocateSeats({ exam_id: selectedExam, pattern: seatingPattern });

            toast.success(data.message);
            // Show warning if some students couldn't be seated (no external center)
            if (data.warning) {
                setTimeout(() => toast.warning(data.warning, { autoClose: 8000 }), 800);
            }
            // If external students were allocated show info
            if (data.externalAssigned > 0) {
                setTimeout(() => toast.info(`${data.externalAssigned} student(s) seated at external center: ${data.externalCollegeName}`, { autoClose: 6000 }), 500);
            }
            fetchArrangements();
        } catch (err) {
            toast.error(err.response?.data?.error || "An error occurred during allocation");
        } finally {
            setLoading(false);
        }
    };

    const handleLockSeating = async () => {
        if (!selectedExam) return toast.warning("Please select an exam first");
        if (arrangements.length === 0 && !isLocked) return toast.error("Cannot lock empty seating. Run allocation first.");

        const confirmMsg = isLocked 
            ? "Are you sure you want to UNLOCK the seating for this exam?" 
            : "Finalize and Approve Seating? This will reserve these seats for this exam session.";
        
        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            const data = await collegeAdminApi.lockSeating({ exam_id: selectedExam, locked: !isLocked });

            toast.success(data.message);
            setIsLocked(data.seating_locked);
            // Update exams list to keep it in sync
            setExams(prev => prev.map(e => e.id === parseInt(selectedExam) ? { ...e, seating_locked: data.seating_locked } : e));
        } catch (err) {
            toast.error(err.response?.data?.error || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleClearAssignments = async () => {
        if (!selectedExam) return toast.warning("Please select an exam first");
        if (!window.confirm("Are you sure you want to clear ALL seat assignments for this exam?")) return;

        try {
            setLoading(true);
            await collegeAdminApi.clearSeatingAssignments({ exam_id: selectedExam });
            toast.success("Assignments cleared");
            fetchArrangements();
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };


    const filteredArrangements = useMemo(() => {
        if (!searchQuery.trim()) return arrangements;
        const query = searchQuery.toLowerCase();
        return arrangements.filter(a =>
            a.student_name.toLowerCase().includes(query) ||
            a.rollnumber?.toLowerCase().includes(query) ||
            a.hall_code.toLowerCase().includes(query)
        );
    }, [arrangements, searchQuery]);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Layout size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seat Allocation</h1>
                            {isLocked && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[13px] font-black  tracking-widest animate-pulse">
                                    <Info size={12} />
                                    Finalized & Locked
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 ">Manage student-to-seat mapping for examinations.</p>
                    </div>
                </div>
            </div>


            {/* Quick Stats & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-9 xl:col-span-10 space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-10">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-end gap-6">
                            <div className="flex-[2] min-w-[280px] space-y-3">
                                <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 block">Selected Examination Context</label>
                                <select
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer h-[56px]"
                                >
                                    <option value="">Choose an exam context...</option>
                                    {exams.map(exam => {
                                        const examDate = exam.exam_date ? formatDate(exam.exam_date) : '';
                                        const displayLabel = `${exam.program_name || 'Generic'} • ${exam.semester_name || 'N/A'} • ${exam.subject_name || 'Unknown Subject'} - ${exam.exam_name} (${examDate})`;
                                        return <option key={exam.id} value={exam.id}>{displayLabel}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[180px] space-y-3">
                                <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 block">Seating Pattern</label>
                                <select
                                    value={seatingPattern}
                                    onChange={(e) => setSeatingPattern(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer  h-[56px]"
                                >
                                    <option value="sequential">Sequential Fill</option>
                                    <option value="alternate">Checkerboard</option>
                                    <option value="random">Randomized</option>
                                </select>
                            </div>
                            <div className="flex-1 min-w-[320px] flex items-center gap-2">
                                <button
                                    onClick={handleAutoAllocate}
                                    disabled={loading || !selectedExam || isLocked}
                                    className="flex-[1.5] flex items-center justify-center gap-2 h-[56px] bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95  tracking-widest text-[11px] disabled:opacity-50 disabled:grayscale whitespace-nowrap px-3"
                                >
                                    <Play size={14} fill="currentColor" />
                                    Run Allocation
                                </button>
                                {!isLocked ? (
                                    <button
                                        onClick={handleLockSeating}
                                        disabled={loading || !selectedExam || arrangements.length === 0}
                                        className="flex-1 flex items-center justify-center gap-2 h-[56px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95  tracking-widest text-[11px] disabled:opacity-50 whitespace-nowrap px-3"
                                    >
                                        <CheckCircle2 size={14} />
                                        Approve
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLockSeating}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 h-[56px] bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-2xl transition-all active:scale-95  tracking-widest text-[12px] px-4"
                                    >
                                        <Trash2 size={14} className="text-slate-400" />
                                        Unlock
                                    </button>
                                )}
                                <button
                                    onClick={handleClearAssignments}
                                    disabled={loading || !selectedExam || arrangements.length === 0 || isLocked}
                                    className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-2xl transition-all active:scale-95 disabled:opacity-50 h-[56px] w-[56px] flex items-center justify-center"
                                    title="Clear All"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Capacity Info Card */}
                        <div className="bg-emerald-50 rounded-[2rem] border border-emerald-100 p-8 flex items-center justify-between shadow-sm shadow-emerald-500/5">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                                    <Info size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight">System Ready</h3>
                                    <p className="text-[12px] font-bold text-emerald-700/70 mt-1  tracking-wider">Only Paid students eligible</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-[12px] font-black text-emerald-600/50  tracking-widest mb-1">Eligible</p>
                                    <p className="text-2xl font-black text-emerald-700">{stats.totalStudents}</p>
                                </div>
                                <div className="w-px h-8 bg-emerald-200"></div>
                                <div className="text-center">
                                    <p className="text-[12px] font-black text-emerald-600/50  tracking-widest mb-1">Capacity</p>
                                    <p className="text-2xl font-black text-emerald-700">{stats.approvedCapacity}</p>
                                </div>
                            </div>
                        </div>

                        {/* Selected Halls Card */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
                            <h3 className="text-[13px] font-black text-slate-400  tracking-widest mb-4">Target Approved Halls ({approvedHalls.length})</h3>
                            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar">
                                {approvedHalls.map(hall => (
                                    <div key={hall.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black text-slate-700">
                                        <Building2 size={12} className="text-indigo-500" />
                                        {hall.hall_code}
                                        <span className="text-[9px] text-slate-400 font-bold ml-1">{hall.rows * hall.seats_per_row} Seats</span>
                                    </div>
                                ))}
                                {approvedHalls.length === 0 && (
                                    <p className="text-[13px] font-bold text-slate-400 italic">No approved halls available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className="lg:col-span-3 xl:col-span-2 bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white">Allocation Status</h3>
                        <p className="text-indigo-400 text-[12px] font-black  tracking-widest mt-1">Real-time mapping progress</p>
                    </div>

                    <div className="relative z-10 space-y-4 mt-6">
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black text-white">
                                {stats.totalStudents > 0 ? ((arrangements.length / stats.totalStudents) * 100).toFixed(0) : 0}%
                            </span>
                            <div className="text-right">
                                <p className="text-white/40 text-[10px] font-bold  tracking-widest">Assigned</p>
                                <p className="text-md font-black text-white">{arrangements.length} / {stats.totalStudents}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                style={{ width: `${stats.totalStudents > 0 ? (arrangements.length / stats.totalStudents) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrangements Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mt-8 transition-all hover:shadow-lg">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Seating Chart</h2>
                        <p className="text-sm text-slate-500 mt-1 font-bold  tracking-wide">Live student-to-seat assignments for the selected exam</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find by name, roll, or hall..."
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all w-full md:w-80"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100/60">
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest">Student Details</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest">Program</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-center">Hall Code</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-center">Position</th>
                                <th className="py-5 px-8 text-[13px] font-black text-slate-400  tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredArrangements.length > 0 ? (
                                filteredArrangements.map((a, i) => (
                                    <tr key={a.id} className={`hover:bg-indigo-50/30 transition-colors group ${a.is_external ? 'bg-orange-50/40' : ''}`}>
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 font-black text-[13px] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    {i + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">{a.student_name}</span>
                                                    <span className="text-[12px] font-bold text-slate-400  tracking-widest mt-0.5">{a.rollnumber || 'NO ROLL'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className="text-[13px] font-bold text-slate-500  tracking-wide">{a.programName}</span>
                                        </td>
                                        <td className="py-5 px-8 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-[13px] font-black ">
                                                    <Building2 size={12} />
                                                    {a.hall_code}
                                                </div>
                                                {a.is_external && (
                                                    <span className="text-[9px] font-black text-orange-500  tracking-widest">
                                                        @ {a.seat_college_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <div className="flex items-center justify-center px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100 w-max mx-auto shadow-sm">
                                                <div className="flex flex-col items-center justify-center min-w-[40px] border-r border-indigo-200/50 pr-4 mr-4">
                                                    <span className="text-[8px] font-black text-indigo-400  tracking-widest">Row</span>
                                                    <span className="text-sm font-black text-indigo-700">R-{a.row_no}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[40px]">
                                                    <span className="text-[8px] font-black text-indigo-400  tracking-widest">Seat</span>
                                                    <span className="text-sm font-black text-indigo-700">S-{a.seat_no}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            {a.is_external ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[12px] font-black border border-orange-100  tracking-widest">
                                                    <AlertCircle size={12} />
                                                    External Center
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[12px] font-black border border-emerald-100  tracking-widest">
                                                    <CheckCircle2 size={12} />
                                                    Allocated
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-24 px-8 text-center bg-slate-50/50">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center text-slate-200 shadow-sm">
                                                <Layout size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-400  tracking-[0.2em]">
                                                    {selectedExam ? 'No Assignments for this Exam' : 'Select an Exam to Begin'}
                                                </p>
                                                <p className="text-[13px] text-slate-300 font-bold  tracking-widest">
                                                    {selectedExam ? 'Click "Run Allocation" to map paid students to seats' : 'Please choose an active exam session from the dropdown'}
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
        </div>
    );
};

export default SeatingArrangement;
