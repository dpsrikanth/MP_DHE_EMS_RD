import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { 
    CheckCircle, Clock, FileText, ChevronRight, 
    ShieldCheck, Building, Search, X, ClipboardCheck,
    Users, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { hodApi } from '../../api/hodApi';

const AssessmentAcceptance = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setLoading(true);
            const data = await hodApi.getAssessmentAcceptance();
            setAssessments(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load assessments");
        } finally {
            setLoading(false);
        }
    };

    const semesters = useMemo(() => {
        const unique = {};
        assessments.forEach(item => {
            if (!unique[item.semester_id]) {
                unique[item.semester_id] = item.semester_name;
            }
        });
        return Object.entries(unique).map(([id, name]) => ({ id, name }));
    }, [assessments]);

    const groupedData = useMemo(() => {
        // First filter by search query and semester
        const filtered = assessments.filter(item => {
            const matchesSearch = item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.section.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesSemester = !selectedSemester || item.semester_id.toString() === selectedSemester.toString();
            
            return matchesSearch && matchesSemester;
        });

        // Then group by batch (subject + section)
        const groups = {};
        filtered.forEach(item => {
            const key = `${item.subject_id}-${item.section}-${item.semester_id}-${item.academic_year_id}`;
            if (!groups[key]) {
                groups[key] = {
                    subject_id: item.subject_id,
                    subject_name: item.subject_name,
                    subject_code: item.subject_code,
                    section: item.section,
                    semester_name: item.semester_name,
                    year_name: item.year_name,
                    semester_id: item.semester_id,
                    academic_year_id: item.academic_year_id,
                    components: []
                };
            }
            groups[key].components.push(item);
        });
        return Object.values(groups);
    }, [assessments, searchQuery, selectedSemester]);

    const handleAccept = async (component) => {
        const id = `${component.subject_id}-${component.section}-${component.component_id}`;
        setProcessingId(id);
        
        try {
            await hodApi.acceptComponent({
                subject_id: component.subject_id,
                semester_id: component.semester_id,
                academic_year_id: component.academic_year_id,
                section: component.section,
                component_id: component.component_id
            });

            toast.success(`'${component.component_name}' accepted. Students can now view these marks.`);
            fetchAssessments(); // Refresh
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to accept assessment");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header section with specific HOD Branding */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <ClipboardCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assessment <span className="text-emerald-500 italic">Acceptance</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            Review and authorize individual assessment components for student visibility.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-60">
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Semesters</option>
                            {semesters.map(sem => (
                                <option key={sem.id} value={sem.id}>{sem.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search subjects or sections..."
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black  tracking-widest text-[12px]">Loading pending assessments...</p>
                </div>
            ) : groupedData.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2  tracking-tight">Everything is up to date</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                        No pending assessments require your acceptance at this time.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {groupedData.map((batch, index) => (
                        <div key={index} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transform transition-all hover:border-emerald-200">
                            {/* Batch Header */}
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded  tracking-widest">
                                                {batch.subject_code}
                                            </span>
                                            <span className="text-slate-400 text-[13px] font-bold">•</span>
                                            <span className="text-[13px] font-black text-slate-400  tracking-widest">Section {batch.section}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{batch.subject_name}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[12px] font-black text-slate-400  tracking-widest mb-0.5">Program & Semester</p>
                                        <p className="text-[13px] font-bold text-slate-700  tracking-tight">{batch.semester_name} • {batch.year_name}</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/admin/marks-review/${batch.subject_id}/${batch.section}`, {
                                            state: { semester_id: batch.semester_id, academic_year_id: batch.academic_year_id }
                                        })}
                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm group"
                                    >
                                        <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Components List */}
                            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {batch.components.map((comp) => {
                                    const procId = `${comp.subject_id}-${comp.section}-${comp.component_id}`;
                                    const isProcessing = processingId === procId;

                                    return (
                                        <div key={comp.component_id} className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-full ${comp.is_accepted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2 rounded-lg ${comp.is_accepted ? 'bg-indigo-500/10 text-emerald-600' : 'bg-indigo-/10 text-indigo-'}`}>
                                                        {comp.is_accepted ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                                                    </div>
                                                    {comp.is_accepted && (
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full  tracking-widest">
                                                            Authorized
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <h4 className="font-black text-slate-900 text-base leading-tight mb-1">{comp.component_name}</h4>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-[12px] font-bold text-slate-400  tracking-widest">Weightage: {comp.max_marks} Marks</span>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[12px] font-black text-slate-400  tracking-widest">Marks Entered</span>
                                                        <span className="text-[13px] font-black text-slate-900">{comp.student_count} Students</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${comp.is_accepted ? 'bg-emerald-500' : 'bg-indigo-'}`}
                                                            style={{ width: '100%' }} // Note: total_students could be added to query if needed
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {comp.is_accepted ? (
                                                <div className="flex items-center gap-2 text-emerald-600 text-[12px] font-black  tracking-widest bg-emerald-100/50 p-2.5 rounded-xl border border-emerald-100">
                                                    <CheckCircle size={14} />
                                                    Accepted {formatDate(comp.accepted_at, true)}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAccept(comp)}
                                                    disabled={isProcessing}
                                                    className="w-full py-3 bg-emerald-500 text-white text-[12px] font-black  tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck size={14} />
                                                            Authorize Assessment
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Section Footer */}
                            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[12px] font-black text-slate-400  tracking-[0.15em]">
                                    {batch.components.filter(c => c.is_accepted).length} of {batch.components.length} Assessments Accepted
                                </span>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssessmentAcceptance;
