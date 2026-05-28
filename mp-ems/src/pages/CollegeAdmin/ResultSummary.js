import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    ClipboardList, Download, Printer, Search,
    Filter, Users, CheckCircle2, XCircle, Trophy,
    TrendingUp, BookOpen, Award, RefreshCw, Info
} from 'lucide-react';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';
import { exportResultCSV } from '../../utils/exportUtils';

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

const gradeColor = (grade) => {
    const map = {
        'O': 'bg-emerald-100 text-emerald-700',
        'A+': 'bg-teal-100 text-teal-700',
        'A': 'bg-blue-100 text-blue-700',
        'B+': 'bg-indigo-100 text-indigo-700',
        'B': 'bg-violet-100 text-violet-700',
        'C': 'bg-amber-100 text-amber-700',
        'F': 'bg-red-100 text-red-700',
    };
    return map[grade] || 'bg-slate-100 text-slate-600';
};

const ResultSummary = () => {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [searched, setSearched] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pass' | 'fail'

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [masters, externalExams] = await Promise.all([
                masterDataApi.getMasters(),
                collegeAdminApi.getExternalExams()
            ]);
            setExams((externalExams || []).map(e => ({ value: e.id, label: e.exam_name || e.name })));
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
        if (!selectedExam) { toast.warning('Please select an exam'); return; }
        try {
            setLoading(true);
            const params = { exam_id: selectedExam.value };
            if (selectedSemester) params.semester_id = selectedSemester.value;
            if (selectedProgram) params.program_id = selectedProgram.value;

            const result = await collegeAdminApi.getResultSummary(params);
            setRows(result.rows || []);
            setSummary(result.summary || null);
            setSearched(true);
            if (!result.rows?.length) toast.info('No result data found for the selected criteria.');
        } catch {
            toast.error('Failed to fetch result summary');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!rows.length) return;
        exportResultCSV(
            filteredRows.map(r => ({
                ...r,
                percentage: r.total_marks,
                status: r.result_status
            })),
            `result_summary_${selectedExam?.label?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`
        );
    };

    const filteredRows = rows.filter(r => {
        if (activeTab === 'pass') return r.result_status === 'Pass';
        if (activeTab === 'fail') return r.result_status === 'Fail';
        return true;
    });

    const passRate = summary
        ? Math.round((Number(summary.total_passed) / Math.max(Number(summary.total_students), 1)) * 100)
        : 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 print:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <ClipboardList size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Result Summary</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Semester-wise exam result analysis with pass/fail breakdown
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        disabled={!rows.length}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-40"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!rows.length}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-40"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 print:hidden">
                <div className="flex flex-wrap gap-5 items-end">
                    <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[12px] font-black text-slate-400 tracking-widest ml-1">Exam *</label>
                        <Select
                            options={exams}
                            value={selectedExam}
                            onChange={setSelectedExam}
                            placeholder="Select Exam..."
                            styles={selectStyles}
                        />
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-2">
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
                    <div className="flex-1 min-w-[160px] space-y-2">
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
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="h-[45px] px-8 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        Generate
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-slate-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-400 tracking-widest">Total Students</p>
                            <p className="text-2xl font-black text-slate-900">{summary.total_students}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-emerald-500 tracking-widest">Passed</p>
                            <p className="text-2xl font-black text-emerald-700">{summary.total_passed}</p>
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-red-400 tracking-widest">Failed</p>
                            <p className="text-2xl font-black text-red-700">{summary.total_failed}</p>
                        </div>
                    </div>
                    <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white flex items-center gap-4">
                        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black opacity-60 tracking-widest">Pass Rate</p>
                            <p className="text-2xl font-black">{passRate}%</p>
                            <p className="text-[10px] opacity-60">Avg: {summary.avg_marks} marks</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs + Table */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : rows.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Print Header */}
                    <div className="hidden print:block p-8 border-b-2 border-slate-900 text-center">
                        <h1 className="text-xl font-black">Exam Result Summary — {selectedExam?.label}</h1>
                        <p className="text-sm text-slate-600">
                            {selectedSemester ? `Semester: ${selectedSemester.label} | ` : ''}
                            Generated: {new Date().toLocaleDateString('en-IN')}
                        </p>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex gap-1 p-4 border-b border-slate-100 bg-slate-50 print:hidden">
                        {[
                            { id: 'all', label: `All (${rows.length})`, icon: <BookOpen size={13} /> },
                            { id: 'pass', label: `Passed (${rows.filter(r => r.result_status === 'Pass').length})`, icon: <CheckCircle2 size={13} /> },
                            { id: 'fail', label: `Failed (${rows.filter(r => r.result_status === 'Fail').length})`, icon: <XCircle size={13} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black tracking-widest transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
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
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Internal</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">External</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Total</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Grade</th>
                                    <th className="px-5 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.map((row, idx) => (
                                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${row.result_status === 'Fail' ? 'bg-red-50/20' : ''}`}>
                                        <td className="px-5 py-3 text-[12px] font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-5 py-3 text-[13px] font-black text-slate-900">{row.enrollment_no}</td>
                                        <td className="px-5 py-3 text-[13px] font-bold text-slate-700">{row.student_name}</td>
                                        <td className="px-5 py-3 text-[12px] text-slate-500 font-bold">{row.program_name}</td>
                                        <td className="px-5 py-3 text-[12px] text-slate-500 font-bold">{row.semester_name}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-[12px] font-black text-slate-900">{row.subject_code}</p>
                                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{row.subject_name}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center text-[13px] font-bold text-slate-600">{row.internal_marks ?? '-'}</td>
                                        <td className="px-5 py-3 text-center text-[13px] font-bold text-slate-600">{row.external_marks ?? '-'}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="text-[15px] font-black text-slate-900">{row.total_marks}</span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[11px] font-black ${gradeColor(row.grade)}`}>
                                                {row.grade}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                                row.result_status === 'Pass'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {row.result_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px] text-slate-400 font-bold">
                            <Info size={13} />
                            Showing {filteredRows.length} of {rows.length} records
                        </div>
                        {summary?.highest_marks && (
                            <div className="flex items-center gap-2 text-[12px] text-slate-500 font-bold">
                                <Trophy size={13} className="text-amber-500" />
                                Highest: {summary.highest_marks} | Lowest: {summary.lowest_marks}
                            </div>
                        )}
                    </div>
                </div>
            ) : searched && !loading ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <Award size={40} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No Results Found</h3>
                    <p className="text-slate-500 mt-2">No marks data available for the selected exam and filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <Filter size={40} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Select an Exam to Begin</h3>
                    <p className="text-slate-400 mt-2">Choose an exam from the filters above and click "Generate".</p>
                </div>
            )}
        </div>
    );
};

export default ResultSummary;
