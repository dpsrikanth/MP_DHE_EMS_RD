import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, Building2, Search, CheckCircle2, X, AlertTriangle, ArrowRight, ShieldCheck, UserCheck, Info } from "lucide-react";
import authUtils from "../../utils/authUtils";

const StudentCenterAllocations = () => {
    const [colleges, setColleges] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingColleges, setLoadingColleges] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    const [selectedCollegeId, setSelectedCollegeId] = useState('');
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [targetCenterId, setTargetCenterId] = useState('');
    
    // Selection state
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [allocating, setAllocating] = useState(false);
    // Auth State
    const isUniversityAdmin = authUtils.isUniversityAdmin();

    useEffect(() => {
        fetchColleges();
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    };

    const fetchColleges = async () => {
        try {
            setLoadingColleges(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/colleges', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setColleges(data);
            } else {
                toast.error("Failed to fetch colleges");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoadingColleges(false);
        }
    };

    const fetchStudents = async (collegeId, examId = '') => {
        try {
            setLoadingStudents(true);
            const token = localStorage.getItem('token');
            const url = new URL(`http://localhost:8080/api/university-admin/students-for-allocation/${collegeId}`);
            if (examId) url.searchParams.append('exam_id', examId);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                setSelectedStudentIds(new Set());
                setTargetCenterId('');
            } else {
                toast.error("Failed to fetch students");
            }
        } catch (error) {
            toast.error("Network error fetching students");
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleCollegeChange = (e) => {
        const cId = e.target.value;
        setSelectedCollegeId(cId);
        if (cId && selectedExamId) {
            fetchStudents(cId, selectedExamId);
        } else {
            setStudents([]);
            setSelectedStudentIds(new Set());
        }
    };

    const handleExamChange = (e) => {
        const examId = e.target.value;
        setSelectedExamId(examId);
        if (selectedCollegeId && examId) {
            fetchStudents(selectedCollegeId, examId);
        } else {
            setStudents([]);
            setSelectedStudentIds(new Set());
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudentIds(new Set());
        }
    };

    const handleSelectStudent = (id) => {
        if (isUniversityAdmin) return;
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudentIds(newSet);
    };

    const handleAllocate = async () => {
        if (selectedStudentIds.size === 0) return toast.warning("Select at least one student");
        if (!targetCenterId) return toast.warning("Select a target examination center");

        const targetCollegeObj = colleges.find(c => String(c.id) === String(targetCenterId));
        const targetCenterName = targetCollegeObj ? (targetCollegeObj.name || targetCollegeObj.college_name) : "the selected center";

        setAllocating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/university-admin/allocate-students-center`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    studentIds: Array.from(selectedStudentIds),
                    targetCenterId: targetCenterId === 'HOME_COLLEGE' ? null : targetCenterId
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`${data.allocated_count} students successfully allocated to ${targetCenterId === 'HOME_COLLEGE' ? 'Home College' : targetCenterName}`);
                // Refresh students
                fetchStudents(selectedCollegeId);
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to allocate students");
            }
        } catch (error) {
            toast.error("An error occurred during allocation");
        } finally {
            setAllocating(false);
        }
    };

    // Calculate generic distance - dummy function as actual coordinates might not be reliable
    const getTargetCenters = () => {
        return colleges.filter(c => String(c.id) !== selectedCollegeId)
                       .sort((a, b) => {
                           const nameA = a.name || a.college_name || '';
                           const nameB = b.name || b.college_name || '';
                           return nameA.localeCompare(nameB);
                       });
    };

    const selectedCollegeObj = colleges.find(c => String(c.id) === String(selectedCollegeId));
    const selectedCollegeName = selectedCollegeObj ? (selectedCollegeObj.name || selectedCollegeObj.college_name) : '';

    return (
        <div className="p-8 space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <UserCheck size={26} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Center Allocation</h1>
                        <p className="text-xs text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Map Specific Roll Numbers to Centers</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
                {/* Left Sidebar Filters */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6 sticky top-24">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Source College</label>
                        <select 
                            value={selectedCollegeId}
                            onChange={handleCollegeChange}
                            disabled={loadingColleges}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="">Choose College...</option>
                            {colleges.map(c => (
                                <option key={c.id} value={c.id}>{c.name || c.college_name || `College ${c.id}`}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Examination Context</label>
                        <select 
                            value={selectedExamId}
                            onChange={handleExamChange}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="">Choose Exam...</option>
                            {exams.map(e => (
                                <option key={e.id} value={e.id}>
                                    {`${e.program_name?.toUpperCase() || ''} • ${e.semester_name?.toUpperCase() || ''} — ${e.name?.toUpperCase() || ''} [${new Date(e.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} | ${e.start_time?.toUpperCase() || ''} — ${e.end_time?.toUpperCase() || ''}]`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {!isUniversityAdmin ? (
                        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                <ShieldCheck size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Allocation Panel</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed mb-4">
                                Select students from the list on the right, then choose a target center below and click allocate.
                            </p>
                            
                            <select
                                value={targetCenterId}
                                onChange={(e) => setTargetCenterId(e.target.value)}
                                disabled={selectedStudentIds.size === 0}
                                className="w-full p-3.5 bg-white border border-indigo-200 rounded-2xl text-sm font-bold text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 mb-3 disabled:opacity-50"
                            >
                                <option value="">Select Target Center...</option>
                                <option value="HOME_COLLEGE" className="font-bold text-emerald-600">-- HOME COLLEGE (Reset) --</option>
                                {getTargetCenters().map(c => (
                                    <option key={c.id} value={c.id}>{c.name || c.college_name || `College ${c.id}`}</option>
                                ))}
                            </select>

                            <button 
                                onClick={handleAllocate}
                                disabled={allocating || selectedStudentIds.size === 0 || !targetCenterId}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {allocating ? 'Processing...' : `Assign ${selectedStudentIds.size} Students`} <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                                <Info size={18} />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Read-Only View</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                You are viewing center allocations for this college. To modify bulk mappings, visit the Center Mapping screen.
                            </p>
                        </div>
                    )}

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 text-amber-700">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold leading-relaxed">
                            Personal allocation overrides any bulk college allocations made on the Hall Approvals screen.
                        </p>
                    </div>
                </div>

                {/* Right Area - Students Table */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
                    {!selectedCollegeId || !selectedExamId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <Building2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Select College & Exam</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
                                Choose a source college and an examination context from the sidebar to manage student center allocations.
                            </p>
                        </div>
                    ) : loadingStudents ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent flex items-center justify-center animate-spin rounded-full"></div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                <Users size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Students Found</h3>
                            <p className="text-xs text-slate-500 mt-1">This college currently has no registered students.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{selectedCollegeName}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{students.length} Total Registered Students</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/50 text-slate-400 rounded-lg border border-slate-100">
                                    Finalized Assignments
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {!isUniversityAdmin && (
                                                <th className="px-6 py-4 w-12">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedStudentIds.size === students.length && students.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                                    />
                                                </th>
                                            )}
                                            <th className="px-4 py-4">Roll Number</th>
                                            <th className="px-4 py-4">Student Name</th>
                                            <th className="px-4 py-4">Program & Sem</th>
                                            <th className="px-6 py-4">Current Assigned Center</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((student) => {
                                            const isSelected = selectedStudentIds.has(student.id);
                                            const hasCustomCenter = !!student.sitting_center_id;
                                            
                                            // Provide visual distinction if it's external vs default home
                                            const hasBulkCenter = !!student.college_center_name;
                                            let centerName = student.college_center_name || (selectedCollegeName);
                                            let centerStyle = 'bg-slate-100 text-slate-500 border-slate-200';
                                            
                                            if (hasCustomCenter) {
                                                centerName = student.sitting_center_name;
                                                centerStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                            } else if (hasBulkCenter) {
                                                centerName = student.college_center_name;
                                                centerStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                            } else {
                                                centerName += ' (HOME)';
                                                centerStyle = 'bg-slate-50 text-slate-400 border-slate-100';
                                            }

                                            return (
                                                <tr 
                                                    key={student.id} 
                                                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                                    onClick={() => handleSelectStudent(student.id)}
                                                >
                                                    {!isUniversityAdmin && (
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => {}} // Handled by tr click
                                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-xs font-black text-slate-800 tabular-nums tracking-tight">
                                                        {student.rollnumber}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-sm font-bold text-slate-900">{student.name}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-bold text-slate-500">{student.programName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">{student.semister}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase border ${centerStyle}`}>
                                                            {centerName}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCenterAllocations;
