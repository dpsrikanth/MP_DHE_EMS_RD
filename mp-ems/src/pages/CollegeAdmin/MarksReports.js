import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileDown, Printer, Filter, Search, BookOpen, GraduationCap } from "lucide-react";
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const MarksReports = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const data = await masterDataApi.getMasters();
            setSemesters((data.semesters || []).map(s => ({ value: s.id, label: s.semester_name })));
            setSubjects((data.subjects || []).map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}`, semester_id: s.semester_id })));
        } catch (err) {
            toast.error("Failed to load metadata for filters");
        }
    };

    const fetchReport = async () => {
        if (!selectedSemester) {
            toast.warning("Please select a semester at least");
            return;
        }
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const collegeId = userStr ? JSON.parse(userStr).college_id : 1;

            const params = { college_id: collegeId, semester_id: selectedSemester.value };
            if (selectedSubject) params.subject_id = selectedSubject.value;

            const data = await collegeAdminApi.getMarksReport(params);
            setReportData(data);
            if (data.length === 0) toast.info("No locked marks found for the selected criteria.");
        } catch (err) {
            toast.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Filter subjects based on selected semester
    const filteredSubjects = selectedSemester 
        ? subjects.filter(sub => sub.semester_id === selectedSemester.value)
        : subjects;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto print:p-0">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <FileDown size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Final Marks Reports</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Generate and export consolidated 'Best of 3' internal assessment reports.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint}
                        disabled={reportData.length === 0}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <Printer size={18} />
                        Print Report
                    </button>
                    <button 
                        disabled={reportData.length === 0}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        <GraduationCap size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filters - Hidden on Print */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-end print:hidden">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Semester</label>
                    <Select
                        options={semesters}
                        value={selectedSemester}
                        onChange={(opt) => { setSelectedSemester(opt); setSelectedSubject(null); }}
                        placeholder="Select Semester..."
                        className="text-sm"
                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', minHeight: '45px' }) }}
                    />
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Subject (Optional)</label>
                    <Select
                        options={filteredSubjects}
                        value={selectedSubject}
                        onChange={setSelectedSubject}
                        isClearable
                        placeholder="All Subjects"
                        className="text-sm"
                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', minHeight: '45px' }) }}
                    />
                </div>
                <button 
                    onClick={fetchReport}
                    className="px-8 h-[45px] bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                    <Search size={18} />
                    Search
                </button>
            </div>

            {/* Results Section */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : reportData.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Report Header for Print */}
                    <div className="hidden print:block p-8 border-b-2 border-slate-900 text-center space-y-2">
                        <h1 className="text-2xl font-black uppercase">Internal Assessment Summary Report</h1>
                        <p className="text-sm font-bold text-slate-600">
                            Semester: {selectedSemester.label} | Academic Year: {reportData[0].academic_year}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">S.No</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment No</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-12 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-indigo-50/30">IA (Best of 2)</th>
                                    <th className="px-12 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-indigo-50/50">Practical</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total (IA+P)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{idx + 1}</td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-900">{row.enrollmentNo || row.rollnumber}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.student_name}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-slate-900">{row.subject_code}</p>
                                            <p className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">{row.subject_name}</p>
                                        </td>
                                        <td className="px-12 py-4 text-sm font-black text-center bg-indigo-50/30 text-indigo-700">{row.best_of_3_score}</td>
                                        <td className="px-12 py-4 text-sm font-black text-center bg-indigo-50/50 text-indigo-700">{row.practical_score}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-black text-slate-900">
                                                {row.total_internal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${row.passing_status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {row.passing_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : !loading && (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                        <Filter size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Report Data</h3>
                    <p className="text-slate-500 mt-2">Select a semester and click 'Search' to generate the report.</p>
                </div>
            )}
        </div>
    );
};

export default MarksReports;
