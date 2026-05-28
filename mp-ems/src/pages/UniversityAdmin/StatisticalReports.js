import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    BarChart3, Download, RefreshCw, TrendingUp,
    Users, Award, CheckCircle2, XCircle,
    Building2, GraduationCap, Info, Trophy
} from 'lucide-react';
import Select from 'react-select';
import { universityAdminApi } from '../../api/universityAdminApi';
import { exportRankingCSV, exportToCSV } from '../../utils/exportUtils';
import { masterDataApi } from '../../api/masterDataApi';

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

const StatCard = ({ label, value, sub, icon, color = 'slate', large = false }) => {
    const colors = {
        slate: 'bg-white border-slate-200 text-slate-900',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        red: 'bg-red-50 border-red-100 text-red-700',
        indigo: 'bg-indigo-600 border-indigo-700 text-white',
    };
    const iconColors = {
        slate: 'bg-slate-100 text-slate-500',
        emerald: 'bg-emerald-100 text-emerald-600',
        red: 'bg-red-100 text-red-600',
        indigo: 'bg-white/20 text-white',
    };
    return (
        <div className={`rounded-2xl border p-5 shadow-sm flex items-center gap-4 ${colors[color]}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
                {icon}
            </div>
            <div>
                <p className={`text-[11px] font-black tracking-widest ${color === 'indigo' ? 'opacity-60' : 'text-slate-400'}`}>{label}</p>
                <p className={`${large ? 'text-3xl' : 'text-2xl'} font-black`}>{value ?? '—'}</p>
                {sub && <p className={`text-[11px] font-bold ${color === 'indigo' ? 'opacity-50' : 'text-slate-400'}`}>{sub}</p>}
            </div>
        </div>
    );
};

const StatisticalReports = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        fetchExams();
        fetchAllStats(null);
    }, []);

    const fetchExams = async () => {
        try {
            const masters = await masterDataApi.getMasters();
            setExams((masters.exams || []).map(e => ({ value: e.id, label: e.name })));
        } catch { /* silent */ }
    };

    const fetchAllStats = async (examId) => {
        setLoading(true);
        try {
            const [stats, rank] = await Promise.all([
                universityAdminApi.getGlobalExamStats(examId),
                universityAdminApi.getInstitutionalRanking(),
            ]);
            setGlobalStats(stats);
            // Attach rank number
            setRanking((rank || []).map((r, i) => ({ ...r, rank: i + 1 })));
        } catch {
            toast.error('Failed to load statistical reports');
        } finally {
            setLoading(false);
        }
    };

    const handleExamChange = (opt) => {
        setSelectedExam(opt);
        fetchAllStats(opt?.value || null);
    };

    const passRate = globalStats
        ? Math.round((Number(globalStats.total_passed) / Math.max(Number(globalStats.total_students), 1)) * 100)
        : 0;

    const handleExportRanking = () => {
        if (!ranking.length) return;
        exportRankingCSV(ranking, `institutional_ranking_${new Date().toISOString().slice(0, 10)}`);
    };

    const handleExportGlobal = () => {
        if (!globalStats) return;
        exportToCSV(
            [{
                total_exams: globalStats.total_exams,
                total_students: globalStats.total_students,
                total_passed: globalStats.total_passed,
                total_failed: globalStats.total_failed,
                pass_rate: `${passRate}%`,
            }],
            [
                { key: 'total_exams', label: 'Total Exams' },
                { key: 'total_students', label: 'Total Students' },
                { key: 'total_passed', label: 'Passed' },
                { key: 'total_failed', label: 'Failed' },
                { key: 'pass_rate', label: 'Pass Rate' },
            ],
            `global_exam_stats_${new Date().toISOString().slice(0, 10)}`
        );
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <BarChart3 size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Statistical Reports</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            University-wide exam statistics, institutional rankings and performance analytics
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="min-w-[220px]">
                        <Select
                            options={exams}
                            value={selectedExam}
                            onChange={handleExamChange}
                            isClearable
                            placeholder="Filter by Exam..."
                            styles={selectStyles}
                        />
                    </div>
                    <button
                        onClick={() => fetchAllStats(selectedExam?.value || null)}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200">
                {[
                    { id: 'overview', label: 'Global Overview', icon: <BarChart3 size={13} /> },
                    { id: 'ranking', label: 'Institutional Ranking', icon: <Trophy size={13} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black tracking-widest transition-all ${
                            activeSection === tab.id
                                ? 'bg-white text-indigo-600 shadow-md'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* ── GLOBAL OVERVIEW ── */}
                    {activeSection === 'overview' && (
                        <div className="space-y-6">
                            {/* Export */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleExportGlobal}
                                    disabled={!globalStats}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-40 text-sm"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                <StatCard
                                    label="TOTAL EXAMS"
                                    value={globalStats?.total_exams}
                                    icon={<GraduationCap size={20} />}
                                    color="slate"
                                />
                                <StatCard
                                    label="TOTAL STUDENTS"
                                    value={globalStats?.total_students}
                                    icon={<Users size={20} />}
                                    color="slate"
                                />
                                <StatCard
                                    label="TOTAL PASSED"
                                    value={globalStats?.total_passed}
                                    icon={<CheckCircle2 size={20} />}
                                    color="emerald"
                                />
                                <StatCard
                                    label="TOTAL FAILED"
                                    value={globalStats?.total_failed}
                                    icon={<XCircle size={20} />}
                                    color="red"
                                />
                            </div>

                            {/* Pass Rate Banner */}
                            <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
                                <div>
                                    <p className="text-sm font-black opacity-60 tracking-widest mb-1">UNIVERSITY-WIDE PASS RATE</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-6xl font-black tracking-tighter">{passRate}%</span>
                                        <span className="text-indigo-200 font-bold">
                                            {Number(globalStats?.total_passed)} of {Number(globalStats?.total_students)} students passed
                                        </span>
                                    </div>
                                    {selectedExam && (
                                        <p className="text-indigo-200 text-sm mt-2 font-bold">
                                            Filtered by: {selectedExam.label}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="relative w-32 h-32">
                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                                            <circle
                                                cx="18" cy="18" r="15.9"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="3"
                                                strokeDasharray={`${passRate} ${100 - passRate}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-black">{passRate}%</span>
                                        </div>
                                    </div>
                                    <p className="text-indigo-200 text-xs font-black tracking-widest mt-2">PASS RATE</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── INSTITUTIONAL RANKING ── */}
                    {activeSection === 'ranking' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] font-black text-slate-400 tracking-widest">
                                    {ranking.length} colleges ranked by pass percentage
                                </p>
                                <button
                                    onClick={handleExportRanking}
                                    disabled={!ranking.length}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-40 text-sm"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>

                            {/* Top 3 Podium */}
                            {ranking.length >= 3 && (
                                <div className="grid grid-cols-3 gap-4">
                                    {[ranking[1], ranking[0], ranking[2]].map((college, i) => {
                                        const podiumRank = [2, 1, 3][i];
                                        const heights = ['h-28', 'h-36', 'h-24'];
                                        const bgColors = ['bg-slate-100', 'bg-amber-100', 'bg-amber-50'];
                                        const textColors = ['text-slate-600', 'text-amber-700', 'text-amber-600'];
                                        return (
                                            <div key={i} className={`rounded-2xl ${bgColors[i]} flex flex-col items-center justify-end p-5 ${heights[i]} border border-slate-200 transition-all`}>
                                                {podiumRank === 1 && <Trophy size={20} className="text-amber-500 mb-1" />}
                                                <p className={`text-[11px] font-black tracking-widest ${textColors[i]} text-center`}>
                                                    #{podiumRank}
                                                </p>
                                                <p className="text-[12px] font-black text-slate-900 text-center truncate w-full">
                                                    {college?.college_name}
                                                </p>
                                                <p className={`text-xl font-black ${textColors[i]}`}>
                                                    {college?.pass_percentage}%
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Full Table */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest">Rank</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest">College Name</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Total Students</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Passed</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest text-center">Pass %</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-slate-400 tracking-widest">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ranking.map((college, idx) => {
                                                const pct = parseFloat(college.pass_percentage) || 0;
                                                const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                                                return (
                                                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${idx < 3 ? 'bg-amber-50/30' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                                                                idx === 0 ? 'bg-amber-400 text-white' :
                                                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                                                idx === 2 ? 'bg-amber-200 text-amber-800' :
                                                                'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {college.rank}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                                    <Building2 size={16} className="text-indigo-500" />
                                                                </div>
                                                                <span className="text-[13px] font-black text-slate-900">{college.college_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-[13px] font-bold text-slate-600">
                                                            {college.total_marks_entered}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-[13px] font-bold text-emerald-600">
                                                            {college.passed_count}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-[15px] font-black ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                {pct > 0 ? `${pct}%` : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 min-w-[140px]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-400 w-8">{pct > 0 ? `${pct}%` : '—'}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 text-[12px] text-slate-400 font-bold">
                                    <Info size={13} />
                                    Rankings based on total marks entered. Colleges with no marks data shown at the bottom.
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StatisticalReports;
