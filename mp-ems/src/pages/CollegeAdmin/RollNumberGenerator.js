import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { KeyRound, Users, GraduationCap, CheckCircle2, Search, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, UserCheck } from "lucide-react";
import { getApiUrl } from '../../config';

const RollNumberGenerator = () => {
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [students, setStudents] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [fetchingPrograms, setFetchingPrograms] = useState(true);
    
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedAdmissionYear, setSelectedAdmissionYear] = useState('');
    const [rollPrefix, setRollPrefix] = useState('');
    
    const [allocating, setAllocating] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setFetchingPrograms(true);
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/masters'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrograms(data.programs || []);
                setSemesters([...Array(8).keys()].map(i => ({ id: i+1, name: `Semester ${i+1}` })));
                // Extract Admission Years (from academic years master)
                if (data.academicYears) {
                    setAcademicYears(data.academicYears);
                }
            }
        } catch (error) {
            toast.error("Network error fetching programs");
        } finally {
            setFetchingPrograms(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedProgram) return toast.warning("Please select a Program");
        if (!selectedSemester) return toast.warning("Please select a Semester");
        if (!selectedAdmissionYear) return toast.warning("Please select an Admission Year");

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const queryParams = new URLSearchParams({
                programName: selectedProgram,
                semister: selectedSemester,
                admission_year: selectedAdmissionYear
            });

            const res = await fetch(getApiUrl(`/college-admin/students-for-roll-generation?${queryParams.toString()}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                if (data.length === 0) {
                    toast.info("No active students found for this combination.");
                }
            } else {
                toast.error("Failed to fetch students");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const generatedMappings = useMemo(() => {
        if (!students || students.length === 0) return [];
        
        // Ensure students are sorted by name A-Z (backend does this, but just to be strictly 100% safe)
        const sortedStudents = [...students].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        return sortedStudents.map((student, index) => {
            const suffixStr = (index + 1).toString().padStart(2, '0');
            return {
                ...student,
                proposed_rollnumber: rollPrefix ? `${rollPrefix}${suffixStr}` : null
            };
        });
    }, [students, rollPrefix]);

    const handleCommit = async () => {
        if (!generatedMappings.length) return toast.error("No roll numbers to assign.");
        if (!rollPrefix) return toast.error("Please enter a valid Roll Number Prefix.");

        const yes = window.confirm(`Are you sure you want to forcibly assign Roll Numbers to these ${generatedMappings.length} students? This cannot be easily undone.`);
        if (!yes) return;

        setAllocating(true);
        try {
            const token = localStorage.getItem('token');
            const dataToCommit = generatedMappings.map(s => ({
                id: s.id,
                rollnumber: s.proposed_rollnumber
            }));

            const res = await fetch(getApiUrl('/college-admin/generate-roll-numbers'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ generatedMappings: dataToCommit })
            });

            if (res.ok) {
                toast.success(`Successfully assigned roll numbers to ${generatedMappings.length} students!`);
                // Clear UI or refresh
                fetchStudents();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to commit roll numbers.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during transaction.");
        } finally {
            setAllocating(false);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <KeyRound size={26} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Roll Number Generator</h1>
                        <p className="text-xs text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Automated Sequential Assignment</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
                
                {/* Configuration Sidebar */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6 sticky top-24">
                    
                    {/* Batch Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <GraduationCap size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Select Parameters</span>
                        </div>
                        
                        <div>
                            <select 
                                value={selectedProgram}
                                onChange={(e) => {
                                    setSelectedProgram(e.target.value);
                                    setStudents([]);
                                }}
                                disabled={fetchingPrograms}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">Select Program...</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <select 
                                value={selectedSemester}
                                onChange={(e) => {
                                    setSelectedSemester(e.target.value);
                                    setStudents([]);
                                }}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">Select Semester...</option>
                                {semesters.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select 
                                value={selectedAdmissionYear}
                                onChange={(e) => {
                                    setSelectedAdmissionYear(e.target.value);
                                    setStudents([]);
                                }}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">Select Admission Year...</option>
                                {academicYears.map(ay => (
                                    <option key={ay.id} value={ay.year_name}>{ay.year_name}</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            onClick={fetchStudents}
                            disabled={loading || !selectedProgram || !selectedSemester || !selectedAdmissionYear}
                            className="w-full py-3 bg-white border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                            Fetch Students
                        </button>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Generator Engine */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/50 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-700">
                            <ShieldCheck size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Generator Engine</span>
                        </div>
                        
                        <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed">
                            Enter the static prefix for this batch. The system will automatically append a 2-digit serial number (01, 02...) based on alphabetical name order.
                        </p>

                        <div>
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block ml-1">Roll Prefix Base</label>
                            <input 
                                type="text"
                                placeholder="e.g. 163B1A05"
                                value={rollPrefix}
                                onChange={e => setRollPrefix(e.target.value.toUpperCase())}
                                disabled={students.length === 0}
                                className="w-full p-3.5 bg-white border border-indigo-200 rounded-2xl text-sm font-bold text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-indigo-200 disabled:opacity-50 uppercase tracking-widest"
                            />
                        </div>

                        <button 
                            onClick={handleCommit}
                            disabled={allocating || !rollPrefix || generatedMappings.length === 0}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2 group"
                        >
                            {allocating ? 'Committing...' : 'Commit Generation'} 
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="bg-amber-50 flex gap-3 p-4 rounded-xl border border-amber-100 text-amber-700">
                         <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                         <p className="text-[10px] font-bold leading-relaxed">
                             Committing this action will permanently overwrite the roll numbers of the {students.length} students currently shown. Double-check your prefix!
                         </p>
                    </div>
                </div>

                {/* Right Area - Students Preview Table */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
                    {!selectedProgram || !selectedSemester ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <Users size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Select Batch Parameters</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
                                Choose a program and semester from the sidebar to fetch eligible students and begin the generation process.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Students Found</h3>
                            <p className="text-xs text-slate-500 mt-1">There are no active students matching this criteria.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{selectedProgram} <span className="text-slate-300 mx-2">•</span> {selectedSemester}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Alphabetically Sorted A-Z</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                                    {students.length} Target Students
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-6 py-4 w-16">Sr.</th>
                                            <th className="px-4 py-4">Student Name</th>
                                            <th className="px-4 py-4">Current Roll No</th>
                                            <th className="px-6 py-4 bg-indigo-50/50 text-indigo-700">Preview Proposed Roll No</th>
                                        </tr>
                                    </thead>
                                    <div className="divide-y divide-slate-50 contents">
                                        {generatedMappings.map((student, index) => {
                                            const isChanging = student.current_rollnumber !== student.proposed_rollnumber;
                                            
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-slate-300 tabular-nums">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                                {(student.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-900">{student.name || 'Unknown Student'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {student.current_rollnumber || <span className="text-slate-300 italic">None Assigned</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 bg-indigo-50/10">
                                                        {!rollPrefix ? (
                                                            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Awaiting Prefix</span>
                                                        ) : (
                                                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black tracking-widest border transition-all ${
                                                                isChanging 
                                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100' 
                                                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                            }`}>
                                                                {student.proposed_rollnumber}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </div>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RollNumberGenerator;
