import useAuthStore from '../../store/useAuthStore';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
    BookOpen,
    Users,
    Save,
    CheckCircle,
    Calendar,
    Search,
    ChevronRight,
    ArrowLeft,
    Clock,
    UserCircle,
    ClipboardCheck,
    AlertCircle,
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileUp,
    Flag
} from "lucide-react";
import Papa from 'papaparse';
import BulkImportModal from '../../components/BulkImportModal';
import { TableSearch } from '../../components/TableControls';
import { facultyApi } from '../../api/facultyApi';
import { masterDataApi } from '../../api/masterDataApi';
import { milestoneApi } from '../../api/milestoneApi';

const InternalExamMarks = () => {
    // Context States
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [assignedSubjects, setAssignedSubjects] = useState([]);

    // Selection States
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedSem, setSelectedSem] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Data States
    const [students, setStudents] = useState([]);
    const [marksDraft, setMarksDraft] = useState({});
    const [componentInfo, setComponentInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [workflowStatus, setWorkflowStatus] = useState('Pending');
    const [showBulkDropdown, setShowBulkDropdown] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [pendingDiscrepancies, setPendingDiscrepancies] = useState([]);
    const [unlockedStudentIds, setUnlockedStudentIds] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [isValidationEnabled, setIsValidationEnabled] = useState(true);
    const [isCorrectionMode, setIsCorrectionMode] = useState(false);

    const teacherId = (useAuthStore.getState().user || {})?.teacher_id || 1;

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedYear || selectedSem) {
            fetchFilteredRounds();
        } else {
            setRounds([]);
            setSelectedRound(null);
        }
        // Always clear selected subject when filters change to avoid inconsistent state
        setSelectedSubject(null);
    }, [selectedYear, selectedSem]);

    const fetchFilteredRounds = async () => {
        try {
            const data = await facultyApi.getExamRounds(
                teacherId,
                selectedYear?.value,
                selectedSem?.value
            );
            setRounds(data || []);
            // If current selected round is not in new list, clear it
            if (selectedRound && !data.find(r => r.id === selectedRound.value)) {
                setSelectedRound(null);
            }
        } catch (err) {
            console.error("Failed to fetch rounds:", err);
        }
    };

    const fetchInitialData = async () => {
        try {
            // Fetch Years, Semesters, Subjects and Schedules in parallel
            const [years, sems, subjects, schedulesData, valData, milestonesData] = await Promise.all([
                masterDataApi.getAcademicYears(),
                masterDataApi.getSemesters(),
                facultyApi.getAssignedSubjects(teacherId),
                facultyApi.getInternalSchedules(),
                milestoneApi.getValidationSetting(),
                milestoneApi.getMilestones({})
            ]);

            setIsValidationEnabled(valData?.enabled ?? true);
            setMilestones(Array.isArray(milestonesData) ? milestonesData : []);

            if (years) {
                setAcademicYears(years.sort((a, b) => {
                    const yearA = a.start_year || parseInt(a.year_name?.split('-')[0]) || 0;
                    const yearB = b.start_year || parseInt(b.year_name?.split('-')[0]) || 0;
                    return yearB - yearA; // Latest first
                }));
            }
            if (sems) {
                setSemesters(sems.sort((a, b) => {
                    const numA = parseInt(a.semester_name.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.semester_name.replace(/\D/g, '')) || 0;
                    return numA - numB;
                }));
            }
            if (subjects) setAssignedSubjects(subjects || []);
            if (schedulesData) setSchedules(schedulesData);

        } catch (err) {
            toast.error('Failed to load initial data');
        }
    };

    const handleGo = async () => {
        if (!selectedYear || !selectedSem || !selectedRound) {
            toast.warning('Please select Year, Semester and Exam Round');
            return;
        }
        setSelectedSubject(null);
    };

    const fetchStudentMarks = async (subject) => {
        setLoading(true);
        // Clear previous state
        setStudents([]);
        setMarksDraft({});
        setSelectedSubject(null);
        setIsCorrectionMode(false);

        try {
            const data = await facultyApi.getStudentsForRound({
                subject_id: subject.subject_id,
                round_name: selectedRound?.label,
                college_id: subject.college_id,
                semester_id: selectedSem?.value,
                academic_year_id: selectedYear?.value,
                section: subject.section,
                program_id: subject.program_id
            });

            if (data) {
                setStudents(data.students || []);
                setComponentInfo(data.structure);
                setUnlockedStudentIds(data.unlockedStudentIds || []);
                setIsCorrectionMode(data.isCorrectionMode || false);

                // Fetch pending discrepancies
                try {
                    const disc = await facultyApi.getPendingDiscrepancies({
                        subject_id: subject.subject_id,
                        component_name: selectedRound?.label
                    });
                    setPendingDiscrepancies(disc || []);
                } catch (discErr) {
                    console.error("Failed to load pending discrepancies:", discErr);
                }

                // Populate draft
                const draft = {};
                data.students.forEach(student => {
                    const existing = data.marks.find(m => m.student_id === student.id);
                    draft[student.id] = {
                        marks: existing ? existing.marks_obtained : '',
                        isAbsent: existing ? existing.is_absent : false
                    };
                });
                setMarksDraft(draft);
                setWorkflowStatus(data.workflowStatus || 'Pending');
                setSelectedSubject(subject);
            } else {
                toast.error('Failed to load students');
                setPendingDiscrepancies([]);
            }
        } catch (err) {
            toast.error('Error fetching marks data');
            setPendingDiscrepancies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDiscrepancy = async (discrepancyId) => {
        try {
            await facultyApi.resolveDiscrepancy({ discrepancy_id: discrepancyId });
            toast.success('Discrepancy resolved successfully');
            
            // Refresh discrepancies list
            if (selectedSubject) {
                const disc = await facultyApi.getPendingDiscrepancies({
                    subject_id: selectedSubject.subject_id,
                    component_name: selectedRound?.label
                });
                setPendingDiscrepancies(disc || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to resolve discrepancy');
        }
    };


    const handleMarkChange = (studentId, field, value) => {
        setMarksDraft(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            const token = useAuthStore.getState().token;
            if (!componentInfo) {
                toast.error("Marks structure component not found for this round.");
                return false;
            }

            const payload = Object.entries(marksDraft).map(([studentId, data]) => ({
                student_id: parseInt(studentId),
                subject_id: selectedSubject.subject_id,
                component_id: componentInfo.id,
                marks_obtained: data.isAbsent ? 0 : parseFloat(data.marks || 0),
                is_absent: data.isAbsent
            }));

            await facultyApi.saveMarks({
                marksData: payload,
                faculty_id: teacherId,
                college_id: selectedSubject.college_id,
                semester_id: selectedSem.value,
                academic_year_id: selectedYear.value,
                section: selectedSubject.section
            });

            if (!silent) toast.success('Marks updated successfully!');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Saving failed');
            return false;
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        // --- Validation Check: Ensure all students have marks or are absent ---
        const missingMarks = students.filter(student => {
            const entry = marksDraft[student.id];
            return !entry || (entry.marks === '' && !entry.isAbsent);
        });

        if (missingMarks.length > 0) {
            toast.warning(`Please enter marks for all students. ${missingMarks.length} student(s) are missing marks.`);
            return;
        }

        if (!window.confirm("Are you sure you want to publish these marks to students? They will be locked for editing.")) return;

        // Auto-save any unsaved entries before publishing
        const isSaved = await handleSave(true);
        if (!isSaved) {
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        try {
            await facultyApi.publishRound({
                subject_id: selectedSubject.subject_id,
                component_id: componentInfo.id,
                faculty_id: teacherId,
                college_id: selectedSubject.college_id,
                semester_id: selectedSem.value,
                academic_year_id: selectedYear.value,
                section: selectedSubject.section
            });

            toast.success('Marks published successfully!');
            setWorkflowStatus('Published');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Publishing failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestUnlock = async () => {
        const reason = window.prompt("Please enter a reason for requesting edit access:");
        if (reason === null) return; // Cancelled
        
        setIsSaving(true);
        try {
            await facultyApi.requestRoundUnlock({
                subject_id: selectedSubject.subject_id,
                component_id: componentInfo.id,
                college_id: selectedSubject.college_id,
                semester_id: selectedSem.value,
                academic_year_id: selectedYear.value,
                section: selectedSubject.section,
                reason: reason || 'Requested by faculty'
            });

            toast.success('Unlock request sent to HOD!');
            setWorkflowStatus('Unlock Requested');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send unlock request');
        } finally {
            setIsSaving(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['Enrollment No', 'Marks Obtained', 'Attendance'];
        const csv = Papa.unparse([headers]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `template_${selectedRound?.label || 'internal'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToCSV = () => {
        if (students.length === 0) return toast.warning('No data to export');
        const csv = Papa.unparse(students.map(s => {
            const entry = marksDraft[s.id] || { marks: '', isAbsent: false };
            return {
                'Enrollment No': s.rollnumber || s.id,
                'Student Name': s.name,
                'Marks Obtained': entry.marks,
                'Attendance': entry.isAbsent ? 'ABSENT' : 'PRESENT',
                'Status': entry.isAbsent ? 'N/A' : (parseFloat(entry.marks) < (componentInfo?.passing_marks || 0) ? 'Below Passing' : 'Qualified')
            };
        }));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `marks_${selectedRound?.label || 'internal'}_${selectedSubject?.subject_code || ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollnumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubjects = assignedSubjects.filter(s =>
        s.academic_year_id === selectedYear?.value &&
        s.semester_id === (selectedSem?.value)
    );

    const getRoundSchedule = (subjectId) => {
        return schedules.find(s =>
            s.subject_id === subjectId &&
            s.round_id === selectedRound?.value &&
            s.college_id === academicYears.find(y => y.id === selectedYear?.value)?.college_id // Not perfect check but help
        );
    };

    const getActiveMilestone = () => {
        if (!selectedRound || !Array.isArray(milestones) || milestones.length === 0) return null;
        const roundName = selectedRound.label.toUpperCase();
        const roundNum = roundName.replace(/\D/g, "");

        const semId    = selectedSem?.value;
        const programId = selectedSubject?.program_id;
        const ayYearStr = academicYears.find(y => y.id === selectedYear?.value)?.year_name;
        const ayYear = ayYearStr ? parseInt(ayYearStr.split('-')[0]) : null;

        const matches = milestones.filter(m => {
            const mName = m.name.toUpperCase();

            // Exclude milestones for a different semester or program (if the milestone specifies one)
            if (semId    && m.semester_id && String(m.semester_id) !== String(semId))    return false;
            if (programId && m.program_id  && String(m.program_id)  !== String(programId)) return false;

            if (ayYear && m.start_date) {
                const mYear = new Date(m.start_date).getFullYear();
                if (mYear !== ayYear && mYear !== (ayYear + 1)) return false;
            }

            const isTopicMatch = mName.includes(roundName) ||
                (roundName.includes("IA") && roundNum && (mName.includes("INTERNAL EXAM " + roundNum) || mName.includes("MID-" + roundNum))) ||
                (roundName.includes("MID") && roundNum && mName.includes("INTERNAL EXAM " + roundNum));

            return isTopicMatch && !mName.includes("MARKS ENTRY") && !mName.includes("SCHEDULE");
        });

        // Prioritise: both semester+program match > semester match > any match
        const sorted = [...matches].sort((a, b) => {
            const aScore = (semId    && String(a.semester_id) === String(semId)    ? 2 : 0) +
                           (programId && String(a.program_id)  === String(programId) ? 1 : 0);
            const bScore = (semId    && String(b.semester_id) === String(semId)    ? 2 : 0) +
                           (programId && String(b.program_id)  === String(programId) ? 1 : 0);
            return bScore - aScore;
        });

        const bestMatch = sorted.find(m => m.name.toUpperCase().includes("EXAM")) || sorted[0];

        if (bestMatch) {
            return {
                startFull: bestMatch.start_date,
                endFull: bestMatch.end_date,
                name: bestMatch.name
            };
        }
        return null;
    };

    const getMarksEntryMilestone = () => {
        if (!selectedRound || !Array.isArray(milestones) || milestones.length === 0) return null;
        const roundName = selectedRound.label.toUpperCase();
        const roundNum = roundName.replace(/\D/g, "");

        const semId     = selectedSem?.value;
        const programId = selectedSubject?.program_id;
        const ayYearStr = academicYears.find(y => y.id === selectedYear?.value)?.year_name;
        const ayYear = ayYearStr ? parseInt(ayYearStr.split('-')[0]) : null;

        const matches = milestones.filter(m => {
            const mName = m.name.toUpperCase();

            // Exclude milestones for a different semester or program (if the milestone specifies one)
            if (semId    && m.semester_id && String(m.semester_id) !== String(semId))    return false;
            if (programId && m.program_id  && String(m.program_id)  !== String(programId)) return false;

            if (ayYear && m.start_date) {
                const mYear = new Date(m.start_date).getFullYear();
                if (mYear !== ayYear && mYear !== (ayYear + 1)) return false;
            }

            const isTopicMatch = mName.includes(roundName) ||
                (roundName.includes("IA") && roundNum && (mName.includes("INTERNAL EXAM " + roundNum) || mName.includes("MID-" + roundNum))) ||
                (roundName.includes("MID") && roundNum && mName.includes("INTERNAL EXAM " + roundNum));

            return isTopicMatch && mName.includes("MARKS ENTRY");
        });

        // Prioritise: both semester+program match > semester match > any match
        const sorted = [...matches].sort((a, b) => {
            const aScore = (semId    && String(a.semester_id) === String(semId)    ? 2 : 0) +
                           (programId && String(a.program_id)  === String(programId) ? 1 : 0);
            const bScore = (semId    && String(b.semester_id) === String(semId)    ? 2 : 0) +
                           (programId && String(b.program_id)  === String(programId) ? 1 : 0);
            return bScore - aScore;
        });

        if (sorted.length > 0) {
            return {
                startFull: sorted[0].start_date,
                endFull: sorted[0].end_date,
                name: sorted[0].name
            };
        }
        return null;
    };

    const formatDate = (isoStr, withTime = false) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr.split('T')[0];
        const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        if (!withTime) return dateStr;
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `${dateStr} ${timeStr}`;
    };

    const findCorrectionMilestone = () => {
        if (!selectedRound || milestones.length === 0 || !selectedSubject) return null;
        
        const componentName = selectedRound.label;
        const normalized = componentName.trim().toUpperCase();
        
        const programId = selectedSubject.program_id;
        const semesterId = selectedSem?.value;
        
        const tokens = [normalized];
        const componentNumber = (normalized.match(/\d+/) || [])[0];
        if (normalized.includes('IA') && componentNumber) {
            tokens.push(`IA${componentNumber}`, `IA ${componentNumber}`, `MID-${componentNumber}`, `MID ${componentNumber}`, `INTERNAL EXAM ${componentNumber}`);
        }
        if (normalized.includes('MID') && componentNumber) {
            tokens.push(`MID-${componentNumber}`, `MID ${componentNumber}`, `INTERNAL EXAM ${componentNumber}`, `IA${componentNumber}`, `IA ${componentNumber}`);
        }
        if (normalized.includes('PRACTICAL')) {
            tokens.push('PRACTICAL');
        }
        
        const isMilestoneContextMatch = (milestone, progId, semId) => {
            if (!milestone) return false;
            if (milestone.program_id && progId && String(milestone.program_id) !== String(progId)) return false;
            if (milestone.semester_id && semId && String(milestone.semester_id) !== String(semId)) return false;
            return true;
        };

        const matches = milestones.filter(m => {
            const mName = String(m.name || '').toUpperCase();
            const isCorrectionWindow = mName.includes('CORRECTION') || mName.includes('UNLOCK') || mName.includes('DISCREPANCY');
            if (!isCorrectionWindow) return false;
            if (!isMilestoneContextMatch(m, programId, semesterId)) return false;
            return tokens.some(token => mName.includes(token));
        });

        if (matches.length > 0) return matches[0];

        const fallback = milestones.find(m => {
            const mName = String(m.name || '').toUpperCase();
            const isCorrectionWindow = mName.includes('CORRECTION') || mName.includes('UNLOCK') || mName.includes('DISCREPANCY');
            return isCorrectionWindow && isMilestoneContextMatch(m, programId, semesterId);
        });

        return fallback || null;
    };

    const isCorrectionMilestoneOpen = (milestone) => {
        if (!milestone || !milestone.start_date || !milestone.end_date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(milestone.start_date);
        const end = new Date(milestone.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
    };

    const active = getActiveMilestone();
    const entryWindow = getMarksEntryMilestone();
    const correctionMilestone = findCorrectionMilestone();
    const correctionClosed = isValidationEnabled && correctionMilestone && !isCorrectionMilestoneOpen(correctionMilestone);

    // Publish window: first-time → marks entry window; after correction → correction window
    const isEntryWindowClosed = isValidationEnabled && entryWindow &&
        !isCorrectionMilestoneOpen({ start_date: entryWindow.startFull, end_date: entryWindow.endFull });
    const isPublishWindowClosed = isCorrectionMode
        ? correctionClosed        // re-publish after HOD-approved correction/unlock → correction window
        : isEntryWindowClosed;    // first-time publish → marks entry window

    return (
        <div className="p-6 md:p-10 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <ClipboardCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Internal Marks Entry</h1>
                        <p className="text-slate-500 font-medium">Record assessment scores for specific exam rounds.</p>
                    </div>
                </div>
            </div>

            {/* Context Selectors */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-[13px] font-black text-slate-500  tracking-widest ml-1">Academic Year</label>
                    <Select
                        options={academicYears.map(y => ({ value: y.id, label: y.year_name }))}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        placeholder="Select Year"
                        styles={{ control: (b) => ({ ...b, borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '2px' }) }}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[13px] font-black text-slate-500  tracking-widest ml-1">Semester</label>
                    <Select
                        options={semesters.map(s => ({ value: s.id, label: s.semester_name || `Semester ${s.semester_number}` }))}
                        value={selectedSem}
                        onChange={setSelectedSem}
                        placeholder="Select Sem"
                        styles={{ control: (b) => ({ ...b, borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '2px' }) }}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[13px] font-black text-slate-500  tracking-widest ml-1">Exam Round</label>
                    <Select
                        options={rounds.map(r => ({ value: r.id, label: r.name }))}
                        value={selectedRound}
                        onChange={setSelectedRound}
                        placeholder="e.g. IA1"
                        styles={{ control: (b) => ({ ...b, borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '2px' }) }}
                    />
                </div>
                <button
                    onClick={handleGo}
                    className="h-[46px] bg-indigo-600 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    <Search size={18} />
                    Filter Subjects
                </button>
            </div>

            {isValidationEnabled && active && (
                <div className="flex flex-wrap items-center gap-6 px-1 bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                            <Flag size={20} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-400 tracking-widest leading-none mb-1">Active Milestone</p>
                            <p className="text-sm font-black text-slate-900 leading-none">{active.name}</p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200 hidden md:block" />

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-400 tracking-widest leading-none mb-1">Exam Round Dates</p>
                            <p className="text-sm font-black text-indigo-600 leading-none italic">
                                {formatDate(active.startFull)} - {formatDate(active.endFull)}
                            </p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200 hidden md:block" />

                    <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-indigo-600 tracking-widest leading-none mb-1 text-left">Marks Entry Window</p>
                            <p className="text-sm font-black text-indigo-600 leading-none italic text-left">
                                {entryWindow ? `${formatDate(entryWindow.startFull, true)} to ${formatDate(entryWindow.endFull, true)}` : 'Open / No Deadline'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Subject Selection Grid */}
            {!selectedSubject && selectedYear && selectedSem && selectedRound && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredSubjects.length > 0 ? filteredSubjects.map((sub) => {
                        const schedule = getRoundSchedule(sub.subject_id);
                        return (
                            <button
                                key={sub.id}
                                onClick={() => fetchStudentMarks(sub)}
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all text-left group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <BookOpen size={24} />
                                    </div>
                                    {schedule && (
                                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[12px] font-black  tracking-widest flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {new Date(schedule.exam_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600">{sub.subject_name}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium italic mb-4">
                                    <span>Code: {sub.subject_code}</span>
                                    <span>•</span>
                                    <span>Sec: {sub.section}</span>
                                </div>
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Users size={16} />
                                        <span className="text-[13px] font-bold  tracking-wider">Students</span>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        );
                    }) : (
                        <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                            <AlertCircle size={48} strokeWidth={1} />
                            <p className="mt-4 font-bold text-lg text-slate-600  tracking-tighter">No subjects assigned for this context</p>
                            <p className="text-sm">Change your filters or contact administrator.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Marks Entry Table */}
            {selectedSubject && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    {/* Inline Header for Subject */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedSubject(null)}
                            className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight  tracking-tighter">
                                    {selectedSubject.subject_name} — {selectedRound?.label || 'Assessment'}
                                </h2>
                                    <span className={`px-3 py-1 rounded-full text-[12px] font-black tracking-widest shadow-sm
                                        ${workflowStatus === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                                            workflowStatus === 'Unlock Requested' ? 'bg-amber-100 text-amber-700' :
                                                workflowStatus === 'Approved' || workflowStatus === 'Locked' ? 'bg-slate-200 text-slate-700' :
                                                    'bg-indigo-100 text-indigo-700'}
                                    `}>
                                        {workflowStatus}
                                    </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Entering marks for section {selectedSubject.section}</p>
                        </div>

                        <div className="flex-1"></div>

                        {/* Bulk Actions Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:border-indigo-600 transition-all shadow-sm"
                            >
                                <FileSpreadsheet size={18} className="text-indigo-600" />
                                <span>Bulk Actions</span>
                                <ChevronDown size={16} className={`transition-transform ${showBulkDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showBulkDropdown && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in slide-in-from-top-2">
                                    <button
                                        onClick={() => {
                                            setShowImportModal(true);
                                            setShowBulkDropdown(false);
                                        }}
                                        disabled={['Published', 'Approved', 'Locked', 'Unlock Requested'].includes(workflowStatus)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                    >
                                        <FileUp size={18} />
                                        Import Marks CSV
                                    </button>
                                    <button
                                        onClick={() => { downloadTemplate(); setShowBulkDropdown(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                    >
                                        <Download size={18} />
                                        Download Template
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button
                                        onClick={() => { exportToCSV(); setShowBulkDropdown(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                    >
                                        <Download size={18} />
                                        Export Current View
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        {pendingDiscrepancies.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-8 py-4 flex items-center gap-3">
                                <AlertCircle className="text-amber-600 animate-pulse flex-shrink-0" size={18} />
                                <span className="text-xs text-amber-800 font-black tracking-wide uppercase">
                                    Attention: {pendingDiscrepancies.length} student{pendingDiscrepancies.length > 1 ? 's have' : ' has'} reported marks discrepancies. Please review and resolve their issues in the roster below.
                                </span>
                            </div>
                        )}
                        {unlockedStudentIds.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 flex items-center gap-3 shadow-md">
                                <AlertCircle className="animate-pulse flex-shrink-0" size={18} />
                                <span className="text-xs font-black tracking-wider uppercase">
                                    Correction Mode Active: HOD has unlocked edit access for {unlockedStudentIds.length} student record(s). All other student records remain securely locked and published.
                                </span>
                            </div>
                        )}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4 flex-1">
                                <Search className="text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Filter students by name or roll number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full text-slate-600"
                                />
                            </div>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[12px] font-black text-slate-400  tracking-widest">Max Marks</p>
                                    <p className="text-sm font-bold text-slate-900">{componentInfo?.max_marks || 'N/A'}</p>
                                </div>
                                <div className="text-right border-l border-slate-200 pl-10">
                                    <p className="text-[12px] font-black text-slate-400  tracking-widest">Pass Marks</p>
                                    <p className="text-sm font-bold text-slate-900">{componentInfo?.passing_marks || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 italic">
                                        <th className="px-8 py-5 text-[13px] font-black text-slate-400  tracking-widest">#</th>
                                        <th className="px-8 py-5 text-[13px] font-black text-slate-400  tracking-widest">Student Information</th>
                                        <th className="px-8 py-5 text-[13px] font-black text-slate-400  tracking-widest text-center">Marks Obtained</th>
                                        <th className="px-8 py-5 text-[13px] font-black text-slate-400  tracking-widest text-center">Attendance</th>
                                        <th className="px-8 py-5 text-[13px] font-black text-slate-400  tracking-widest text-center">Result Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium">
                                    {filteredStudents.map((student, idx) => {
                                        const entry = marksDraft[student.id] || { marks: '', isAbsent: false };
                                        const isFailed = !entry.isAbsent && entry.marks !== '' && parseFloat(entry.marks) < (componentInfo?.passing_marks || 0);
                                        const studentDisc = pendingDiscrepancies.find(d => d.student_id === student.id);
                                        const isDiscrepancyClosed = correctionClosed && studentDisc;
                                        const isAttendanceDisabled = 
                                            (['Approved', 'Locked', 'Unlock Requested'].includes(workflowStatus)) ||
                                            (workflowStatus === 'Published' && !unlockedStudentIds.includes(student.id)) ||
                                            (unlockedStudentIds.length > 0 && !unlockedStudentIds.includes(student.id)) ||
                                            isDiscrepancyClosed;
                                        const isFieldDisabled = entry.isAbsent || isAttendanceDisabled;

                                        return (
                                            <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-4 text-[13px] font-bold text-slate-300">{idx + 1}</td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[12px]">
                                                            {student.name ? student.name.charAt(0) : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                            <p className="text-[12px]  font-bold text-slate-400 tracking-wider">Reg: {student.rollnumber}</p>
                                                        </div>
                                                    </div>
                                                    {studentDisc && (
                                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2 max-w-md shadow-sm">
                                                            <div className="flex items-start gap-2">
                                                                 <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                                 <div className="text-xs text-amber-800 font-bold leading-normal">
                                                                     <span className="opacity-75 uppercase text-[9px] tracking-wider block mb-0.5">Reported Issue ({studentDisc.component_name}):</span>
                                                                     "{studentDisc.message}"
                                                                 </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleResolveDiscrepancy(studentDisc.id)}
                                                                disabled={correctionClosed}
                                                                className={`self-start inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors shadow-sm ${correctionClosed ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                                                                title={correctionClosed ? `Correction window closed: ${formatDate(correctionMilestone.start_date)} to ${formatDate(correctionMilestone.end_date)}` : ''}
                                                            >
                                                                Resolve & Close Issue
                                                            </button>
                                                            {correctionClosed && (
                                                                <p className="text-[10px] text-red-600 font-black mt-1">
                                                                    Correction window closed: {formatDate(correctionMilestone.start_date)} to {formatDate(correctionMilestone.end_date)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        max={componentInfo?.max_marks}
                                                        disabled={isFieldDisabled}
                                                        value={entry.marks}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            if (val !== '' && componentInfo?.max_marks !== undefined) {
                                                                if (parseFloat(val) > parseFloat(componentInfo.max_marks)) {
                                                                    toast.warning(`Maximum marks allowed is ${componentInfo.max_marks}`);
                                                                    val = componentInfo.max_marks;
                                                                } else if (parseFloat(val) < 0) {
                                                                    val = 0;
                                                                }
                                                            }
                                                            handleMarkChange(student.id, 'marks', val);
                                                        }}
                                                        className={`w-24 text-center px-4 py-2 bg-white border-2 rounded-xl font-black text-slate-700 outline-none transition-all
                                                            ${isFieldDisabled ? 'opacity-30 bg-slate-50 cursor-not-allowed' : isFailed ? 'border-red-100 bg-red-50/30 text-red-600 focus:border-red-300' : 'border-slate-100 focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10'}
                                                        `}
                                                        placeholder="Marks"
                                                    />
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <button
                                                        disabled={isAttendanceDisabled}
                                                        onClick={() => handleMarkChange(student.id, 'isAbsent', !entry.isAbsent)}
                                                        className={`px-4 py-2 rounded-xl font-black text-[12px]  tracking-widest transition-all
                                                            ${entry.isAbsent ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}
                                                            ${isAttendanceDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                    >
                                                        {entry.isAbsent ? 'ABSENT' : 'PRESENT'}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    {entry.isAbsent ? (
                                                        <span className="text-[12px] font-black text-red-500  italic">Not Applicable</span>
                                                    ) : isFailed ? (
                                                        <span className="text-[12px] font-black text-red-500  tracking-widest bg-red-50 px-3 py-1 rounded-full">Below Passing</span>
                                                    ) : entry.marks !== '' ? (
                                                        <span className="text-[12px] font-black text-emerald-600  tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Qualified</span>
                                                    ) : (
                                                        <span className="text-[12px] font-black text-slate-300  tracking-widest">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Clock size={16} />
                                Last saved: {new Date().toLocaleTimeString()}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSelectedSubject(null)}
                                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || (['Approved', 'Locked', 'Unlock Requested'].includes(workflowStatus)) || (workflowStatus === 'Published' && unlockedStudentIds.length === 0)}
                                    className={`px-10 py-3 rounded-xl font-black tracking-widest text-sm transition-all flex items-center gap-2
                                        ${(isSaving || (['Approved', 'Locked', 'Unlock Requested'].includes(workflowStatus)) || (workflowStatus === 'Published' && unlockedStudentIds.length === 0)) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95'}
                                    `}
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Save size={18} />}
                                    Save Draft
                                </button>
                                
                                {(workflowStatus === 'Published' && unlockedStudentIds.length === 0) ? (
                                    <button
                                        onClick={!correctionClosed ? handleRequestUnlock : undefined}
                                        disabled={isSaving || correctionClosed}
                                        title={correctionClosed && correctionMilestone ? `Correction window closed: ${formatDate(correctionMilestone.start_date)} to ${formatDate(correctionMilestone.end_date)}` : ''}
                                        className={`px-10 py-3 rounded-xl font-black tracking-widest text-sm shadow-xl transition-all flex items-center gap-2
                                            ${isSaving || correctionClosed ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600 active:scale-95'}
                                        `}
                                    >
                                        {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertCircle size={18} />}
                                        Request Edit Access
                                    </button>
                                ) : workflowStatus === 'Unlock Requested' ? (
                                    <button
                                        disabled={true}
                                        className="px-10 py-3 rounded-xl font-black tracking-widest text-sm shadow-xl transition-all flex items-center gap-2 bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                    >
                                        <Clock size={18} />
                                        Unlock Pending...
                                    </button>
                                ) : (
                                    <button
                                        onClick={!isPublishWindowClosed ? handlePublish : undefined}
                                        disabled={isSaving || ['Approved', 'Locked'].includes(workflowStatus) || isPublishWindowClosed}
                                        title={isPublishWindowClosed
                                            ? (isCorrectionMode
                                                ? (correctionMilestone ? `Correction window closed: ${formatDate(correctionMilestone.start_date)} to ${formatDate(correctionMilestone.end_date)}` : 'Correction window is closed')
                                                : (entryWindow ? `Marks entry window closed: ${formatDate(entryWindow.startFull)} to ${formatDate(entryWindow.endFull)}` : 'Marks entry window is closed'))
                                            : ''}
                                        className={`px-10 py-3 rounded-xl font-black tracking-widest text-sm shadow-xl transition-all flex items-center gap-2
                                            ${isSaving || ['Approved', 'Locked'].includes(workflowStatus) || isPublishWindowClosed ? 'bg-slate-400 text-white cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 active:scale-95'}
                                        `}
                                    >
                                        {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                                        Publish Marks
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {selectedSubject && componentInfo && (
                <BulkImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onUploadSuccess={() => {
                        fetchStudentMarks(selectedSubject);
                        setShowImportModal(false);
                    }}
                    endpoint="/faculty-marks/bulk-upload"
                    entityName="marks"
                    expectedColumns={{
                        enrollment_number: 'Enrollment No',
                        marks_obtained: 'Marks Obtained',
                        is_absent: 'Attendance'
                    }}
                    optionalColumns={['marks_obtained', 'is_absent']}
                    extraPayload={{
                        subject_id: selectedSubject.subject_id,
                        component_id: componentInfo.id,
                        faculty_id: teacherId,
                        college_id: selectedSubject.college_id,
                        semester_id: selectedSem.value,
                        academic_year_id: selectedYear.value,
                        section: selectedSubject.section
                    }}
                />
            )}
        </div>
    );
};

export default InternalExamMarks;
