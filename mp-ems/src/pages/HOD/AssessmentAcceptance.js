import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
    CheckCircle, FileText, 
    ShieldCheck, AlertCircle, ClipboardCheck,
    ChevronDown, ChevronUp, User, Lock
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { hodApi } from '../../api/hodApi';
import { milestoneApi } from '../../api/milestoneApi';

// Inline student marks panel, fetched lazily per component
const ComponentStudentPanel = ({ comp }) => {
    const [students, setStudents] = useState([]);
    const [passingMarks, setPassingMarks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await hodApi.getComponentStudentMarks({
                    component_id: comp.component_id,
                    subject_id: comp.subject_id,
                    section: comp.section,
                    semester_id: comp.semester_id,
                    academic_year_id: comp.academic_year_id
                });
                if (!cancelled) {
                    setStudents(data.students || []);
                    setPassingMarks(data.passing_marks);
                }
            } catch (err) {
                if (!cancelled) setStudents([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchStudents();
        return () => { cancelled = true; };
    }, [comp.component_id, comp.subject_id, comp.section, comp.semester_id, comp.academic_year_id]);

    return (
        <div className="mt-4 border-t border-slate-100 pt-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-left mb-3"
            >
                <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                    <User size={11} />
                    Students &amp; Marks
                </span>
                {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {expanded && (
                loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : students.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-bold text-center py-3">
                        No specific student discrepancies linked to this request.
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {students.map((s) => {
                            const marks = s.is_absent ? null : parseFloat(s.marks_obtained);
                            const isFail = !s.is_absent && marks !== null && passingMarks !== null && marks < passingMarks;
                            return (
                                <div key={s.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold
                                    ${s.is_absent ? 'bg-slate-50 text-slate-400' : isFail ? 'bg-red-50 text-red-700' : 'bg-emerald-50/60 text-slate-700'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-5 h-5 rounded bg-white/70 border border-current/10 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                                            {s.name ? s.name.charAt(0) : '?'}
                                        </span>
                                        <span className="truncate">{s.name}</span>
                                        <span className="text-[9px] opacity-60 font-black tracking-wider flex-shrink-0">{s.rollnumber}</span>
                                    </div>
                                    <span className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black
                                        ${s.is_absent ? 'bg-slate-200 text-slate-500' : isFail ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {s.is_absent ? 'ABSENT' : `${s.marks_obtained}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

const AssessmentAcceptance = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [isValidationEnabled, setIsValidationEnabled] = useState(true);

    useEffect(() => {
        fetchAssessments();
        fetchMilestonesAndSettings();
    }, []);

    const fetchMilestonesAndSettings = async () => {
        try {
            const [mData, sData] = await Promise.all([
                milestoneApi.getMilestones({ delete_status: true }),
                milestoneApi.getValidationSetting()
            ]);
            setMilestones(Array.isArray(mData) ? mData : (mData?.milestones || []));
            setIsValidationEnabled(sData?.enabled !== false);
        } catch (err) {
            // Silently fail — milestones are optional metadata
        }
    };

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

    /**
     * Find the correction/unlock milestone for a given component card.
     * Matches on component name tokens, semester_id, program_id, and academic year.
     */
    const findCorrectionMilestoneForComp = useCallback((comp) => {
        if (!comp || !Array.isArray(milestones) || milestones.length === 0) return null;

        const normalized = String(comp.component_name || '').trim().toUpperCase();
        const componentNumber = (normalized.match(/\d+/) || [])[0];
        const tokens = [normalized];
        if (normalized.includes('IA') && componentNumber) {
            tokens.push(`IA${componentNumber}`, `IA ${componentNumber}`,
                `MID-${componentNumber}`, `MID ${componentNumber}`,
                `INTERNAL EXAM ${componentNumber}`);
        }
        if (normalized.includes('MID') && componentNumber) {
            tokens.push(`MID-${componentNumber}`, `MID ${componentNumber}`,
                `INTERNAL EXAM ${componentNumber}`, `IA${componentNumber}`, `IA ${componentNumber}`);
        }
        if (normalized.includes('PRACTICAL')) tokens.push('PRACTICAL');

        const semId   = comp.semester_id;
        const progId  = comp.program_id;
        const yearStr = comp.year_name || '';
        const ayYear  = yearStr ? parseInt(yearStr.split('-')[0]) : null;

        const contextMatch = (m) => {
            if (m.program_id  && progId && String(m.program_id)  !== String(progId))  return false;
            if (m.semester_id && semId  && String(m.semester_id) !== String(semId))   return false;
            return true;
        };

        const matches = milestones.filter(m => {
            const mName = String(m.name || '').toUpperCase();
            const isCorrectionWindow = mName.includes('CORRECTION') || mName.includes('UNLOCK') || mName.includes('DISCREPANCY');
            if (!isCorrectionWindow) return false;
            if (!contextMatch(m)) return false;
            if (ayYear && m.start_date) {
                const mYear = new Date(m.start_date).getFullYear();
                if (mYear !== ayYear && mYear !== ayYear + 1) return false;
            }
            return tokens.some(token => mName.includes(token));
        });

        if (matches.length > 0) return matches[0];

        // Fallback: any correction milestone matching context + year
        return milestones.find(m => {
            const mName = String(m.name || '').toUpperCase();
            const isCorrectionWindow = mName.includes('CORRECTION') || mName.includes('UNLOCK') || mName.includes('DISCREPANCY');
            if (!isCorrectionWindow || !contextMatch(m)) return false;
            if (ayYear && m.start_date) {
                const mYear = new Date(m.start_date).getFullYear();
                if (mYear !== ayYear && mYear !== ayYear + 1) return false;
            }
            return true;
        }) || null;
    }, [milestones]);

    const isMilestoneOpen = (milestone) => {
        if (!milestone || !milestone.start_date || !milestone.end_date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(milestone.start_date);
        const end   = new Date(milestone.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
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
        const filtered = assessments.filter(item => {
            const matchesSearch = item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.section.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSemester = !selectedSemester || item.semester_id.toString() === selectedSemester.toString();
            return matchesSearch && matchesSemester;
        });

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
            await hodApi.approveComponentUnlock({
                subject_id: component.subject_id,
                semester_id: component.semester_id,
                academic_year_id: component.academic_year_id,
                section: component.section,
                component_id: component.component_id
            });
            toast.success(`'${component.component_name}' unlocked. Faculty can now edit marks.`);
            fetchAssessments();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to approve unlock");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <ClipboardCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Unlock <span className="text-amber-500 italic">Requests</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
                            <AlertCircle size={16} className="text-slate-400" />
                            Review and approve faculty requests to unlock and edit published assessment marks.
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
                            <ChevronDown size={16} />
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
                    <p className="text-slate-400 font-black tracking-widest text-[12px]">Loading unlock requests...</p>
                </div>
            ) : groupedData.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Everything is up to date</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                        No pending unlock requests from faculty at this time.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {groupedData.map((batch, index) => (
                        <div key={index} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transform transition-all hover:border-amber-200">
                            {/* Batch Header */}
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded tracking-widest">
                                                {batch.subject_code}
                                            </span>
                                            <span className="text-slate-400 text-[13px] font-bold">•</span>
                                            <span className="text-[13px] font-black text-slate-400 tracking-widest">Section {batch.section}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{batch.subject_name}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] font-black text-slate-400 tracking-widest mb-0.5">Program &amp; Semester</p>
                                    <p className="text-[13px] font-bold text-slate-700 tracking-tight">{batch.semester_name} • {batch.year_name}</p>
                                </div>
                            </div>

                            {/* Components List */}
                            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {batch.components.map((comp) => {
                                    const procId = `${comp.subject_id}-${comp.section}-${comp.component_id}`;
                                    const isProcessing = processingId === procId;

                                    // --- Roadmap correction window check ---
                                    const correctionMilestone = findCorrectionMilestoneForComp(comp);
                                    const correctionClosed = isValidationEnabled && correctionMilestone && !isMilestoneOpen(correctionMilestone);
                                    const closedLabel = correctionClosed
                                        ? `Correction window closed: ${formatDate(correctionMilestone.start_date)} to ${formatDate(correctionMilestone.end_date)}`
                                        : '';

                                    return (
                                        <div key={comp.component_id} className="p-5 rounded-2xl border-2 bg-white border-amber-100 hover:border-amber-200 shadow-sm flex flex-col">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                                        <AlertCircle size={20} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full tracking-widest">
                                                        Unlock Requested
                                                    </span>
                                                </div>

                                                <h4 className="font-black text-slate-900 text-base leading-tight mb-1">{comp.component_name}</h4>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-[12px] font-bold text-slate-400 tracking-widest">Weightage: {comp.max_marks} Marks</span>
                                                </div>

                                                {/* Faculty Reason */}
                                                {comp.unlock_reason && (
                                                    <div className="mb-4 bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex gap-2">
                                                        <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <div className="text-[11px] font-bold text-amber-800 leading-normal">
                                                            <span className="opacity-75 uppercase text-[9px] tracking-wider block mb-0.5">Faculty Reason:</span>
                                                            "{comp.unlock_reason}"
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Closed Correction Window Warning */}
                                                {correctionClosed && (
                                                    <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                                                        <Lock size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-black text-red-600 leading-snug">
                                                            {closedLabel}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Inline Student Marks */}
                                                <ComponentStudentPanel comp={comp} />
                                            </div>

                                            {/* Approve Button */}
                                            <div className="mt-4">
                                                <button
                                                    onClick={!correctionClosed ? () => handleAccept(comp) : undefined}
                                                    disabled={isProcessing || correctionClosed}
                                                    title={closedLabel}
                                                    className={`w-full py-3 text-[12px] font-black tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                                                        ${isProcessing || correctionClosed
                                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                            : 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.98]'}`}
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : correctionClosed ? (
                                                        <>
                                                            <Lock size={14} />
                                                            Approve Unlock
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck size={14} />
                                                            Approve Unlock
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[12px] font-black text-slate-400 tracking-[0.15em]">
                                    {batch.components.length} Unlock {batch.components.length === 1 ? 'Request' : 'Requests'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">{batch.section}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssessmentAcceptance;
