import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    AlertTriangle, Download, Printer, Search,
    Filter, Users, BookOpen, XCircle, TrendingDown,
    RefreshCw, Info
} from 'lucide-react';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';
import { exportAttendanceCSV } from '../../utils/exportUtils';

const selectStyles = {
    control: (base) => ({
        ...base,
        borderRadius: '0.75rem',
        borderColor: '#e2e8f0',
        minHeight: '45px',
        boxShadow: 'none',
        '&:hover': { borderColor: '#6366f1' }
    })
};

const AttendanceShortage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [semesters, setSemesters] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [threshold, setThreshold] = useState(75);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const masters = await masterDataApi.getMasters();
            setSemesters((masters.semesters || [])
                .sort((a, b) => {
                    const numA = parseInt(a.semester_name.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.semester_name.replace(/\D/g, '')) || 0;
                    return numA - numB;
                })
                .map(s => ({ value: s.id, label: s.semester_name }))
            );
            setPrograms((masters.programs || []).map(p => ({ value: p.id, label: p.name })));
        } catch {
            toast.error('Failed to load filter options');
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            const params = { threshold };
            if (selectedSemester) params.semester_id = selectedSemester.value;
            if (selectedProgram) params.program_id = selectedProgram.value;

            const result = await collegeAdminApi.getAttendanceShortage(params);
            setData(result);
            setSearched(true);
            if (result.length === 0) toast.info('No students found below the selected threshold.');
        } catch {
            toast.error('Failed to fetch attendance shortage report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data.length) return;
        exportAttendanceCSV(
            data,
            `attendance_shortage_${threshold}pct_${new Date().toISOString().slice(0, 10)}`
        );
    };

    // Summary stats
    const critical = data.filter(r => r.status === 'Critical').length;
    const shortage = data.filter(r => r.status === 'Shortage').length;
    const uniqueStudents = new Set(data.map(r => r.enrollment_no)).size;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 print:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
                        <AlertTriangle size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Attendance Shortage Report</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Students with attendance below the minimum threshold
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        disabled={!data.length}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-40"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!data.length}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-40"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 print:hidden">
                <div className="flex flex-wrap gap-5 items-end">
                    <div className="flex-1 min-w-[180px] space-y-2">
                        <label className="text-[12px] font-black text-slate-400 tracking-widest ml-1">Semester</label>
                        <Select
                            options={semesters}
                            value={selectedSemester}
                            onChange={setSelectedSemester}
                            isClearable
                            placeholder="All Semesters"
                            styles={selectStyles}
                        />
                    </div>
                    <div className="flex-1 min-w-[180px] space-y-2">
                        <label className="text-[12px] font-black text-slate-400 tracking-widest ml-1">Program</label>
                        <Select
                            options={programs}
                            value={selectedProgram}
                            onChange={setSelectedProgram}
                            isClearable
                            placeholder="All Programs"
                            styles={selectStyles}
                        />
                    </div>
                    <div className="min-w-[160px] space-y-2">
                        <label className="text-[12px] font-black text-slate-400 tracking-widest ml-1">
                            Threshold: <span className="text-red-600">{threshold}%</span>
                        </label>
                        <input
                            type="range"
                            min={50}
                            max={90}
                            step={5}
                            value={threshold}
                            onChange={e => setThreshold(Number(e.target.value))}
                            className="w-full accent-red-500 h-2 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>50%</span><span>90%</span>
                        </div>
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="h-[45px] px-8 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {searched && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Users size={22} className="text-slate-600" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-400 tracking-widest">Affected Students</p>
                            <p className="text-3xl font-black text-slate-900">{uniqueStudents}</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <TrendingDown size={22} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-amber-500 tracking-widest">Shortage</p>
                            <p className="text-3xl font-black text-amber-700">{shortage}</p>
                            <p className="text-[11px] text-amber-400 font-bold">{threshold - 15}%–{threshold}% range</p>
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle size={22} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-red-400 tracking-widest">Critical (below 60%)</p>
                            <p className="text-3xl font-black text-red-700">{critical}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Print Header */}
                    <div className="hidden print:block p-8 border-b-2 border-slate-900 text-center">
                        <h1 className="text-xl font-black">Attendance Shortage Report</h1>
                        <p className="text-sm text-slate-600">Threshold: {threshold}% | Generated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">#</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">Enrollment</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">Student Name</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">Program</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">Semester</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest">Subject</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Present/Total</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Attendance %</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((row, idx) => (
                                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${row.status === 'Critical' ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-5 py-3 text-[12px] font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-5 py-3 text-[13px] font-black text-slate-900">{row.enrollment_no}</td>
                                        <td className="px-5 py-3 text-[13px] font-bold text-slate-700">{row.student_name}</td>
                                        <td className="px-5 py-3 text-[12px] font-bold text-slate-500">{row.program_name}</td>
                                        <td className="px-5 py-3 text-[12px] font-bold text-slate-500">{row.semester_name}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-[12px] font-black text-slate-900">{row.subject_code}</p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">{row.subject_name}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center text-[13px] font-bold text-slate-600">
                                            {row.attended_sessions}/{row.total_sessions}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-lg font-black ${parseFloat(row.attendance_percentage) < 60 ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {row.attendance_percentage}%
                                                </span>
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${parseFloat(row.attendance_percentage) < 60 ? 'bg-red-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${row.attendance_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                                row.status === 'Critical'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 text-[12px] text-slate-400 font-bold">
                        <Info size={13} />
                        Total {data.length} records | {uniqueStudents} unique students below {threshold}% threshold
                    </div>
                </div>
            ) : searched && !loading ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Shortage Found</h3>
                    <p className="text-slate-500 mt-2">All students meet the {threshold}% attendance threshold.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Set Filters & Generate</h3>
                    <p className="text-slate-400 mt-2">Select a threshold and click "Generate Report" to view shortage data.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceShortage;
