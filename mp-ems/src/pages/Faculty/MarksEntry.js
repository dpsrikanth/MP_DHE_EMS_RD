import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { BookOpen, Users, Save, CheckCircle, ShieldAlert, Search, X } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';
import { facultyApi } from '../../api/facultyApi';
import { marksApi } from '../../api/marksApi';
import { masterDataApi } from '../../api/masterDataApi';
import { ChevronDown, Download, FileSpreadsheet, FileUp } from "lucide-react";
import Papa from 'papaparse';
import BulkImportModal from '../../components/BulkImportModal';

const MarksEntry = () => {
    const location = useLocation();
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [marksStructure, setMarksStructure] = useState([]);
    const [enteredMarks, setEnteredMarks] = useState([]);
    const [workflowStatus, setWorkflowStatus] = useState('Pending'); // New Status
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [marksDraft, setMarksDraft] = useState({});
    const [initialMarks, setInitialMarks] = useState({}); // Track initial state for change detection
    const [reviews, setReviews] = useState({}); // Per-student review statuses/comments
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectSchedules, setSubjectSchedules] = useState([]);
    const [showBulkDropdown, setShowBulkDropdown] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        fetchAssignedSubjects();
    }, []);

    useEffect(() => {
        if (assignedSubjects.length > 0 && location.state?.assignmentId) {
            const assignment = assignedSubjects.find(a => a.id === location.state.assignmentId);
            if (assignment) {
                const option = {
                    value: assignment.id,
                    label: `${assignment.subject_code} - ${assignment.subject_name} (Sec: ${assignment.section})`
                };
                setSelectedAssignment(option);
                fetchSubjectDetails(assignment);
            }
        }
    }, [assignedSubjects, location.state]);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;
            const data = await facultyApi.getAssignedSubjects(teacherId);
            // Only show subjects that have an internal exam scheduled
            setAssignedSubjects((data || []).filter(s => s.has_schedule === true));
        } catch (err) {
            toast.error('Failed to load assigned subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectDetails = async (assignment) => {
        if (!assignment) return;
        try {
            setLoading(true);
            // 1. Fetch Marks Structure for this subject
            const structureData = await facultyApi.getMarksStructure(assignment.subject_id);
            setMarksStructure(structureData || []);
    
            // 2. Fetch Students for this subject
            const studentsData = await facultyApi.getStudentsForSubject({
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                program_id: assignment.program_id
            });
            setStudents(studentsData || []);
    
            // 3. Fetch already entered marks and status
            const data = await facultyApi.getEnteredMarks({
                subject_id: assignment.subject_id,
                section: assignment.section,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id
            });
            
            const existingMarks = data.marks || [];
            const status = data.workflowStatus || 'Pending';
            const reviewsData = data.reviews || {};
            
            setEnteredMarks(existingMarks);
            setWorkflowStatus(status);
            setReviews(reviewsData);
    
            // 4. Fetch Internal Schedules for this subject & college
            const internalData = await facultyApi.getInternalSchedules({
                program_id: assignment.program_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id
            });
            setSubjectSchedules(internalData.filter(s => s.subject_id === assignment.subject_id));

            // Populate draft state with existing marks
            const draft = {};
            const initial = {};
            studentsData.forEach(student => {
                draft[student.id] = {};
                initial[student.id] = {};
                structureData.forEach(comp => {
                    const existing = existingMarks.find(m => m.student_id === student.id && m.component_id === comp.id);
                    const markVal = existing ? existing.marks_obtained : '';
                    const absVal = existing ? existing.is_absent : false;

                    draft[student.id][comp.id] = {
                        marks: markVal,
                        isAbsent: absVal
                    };
                    initial[student.id][comp.id] = {
                        marks: markVal,
                        isAbsent: absVal
                    };
                });
            });
            setMarksDraft(draft);
            setInitialMarks(initial);

        } catch (err) {
            toast.error('Error fetching details for marks entry');
        } finally {
            setLoading(false);
        }
    };


    const handleAssignmentSelect = (selectedOption) => {
        setSelectedAssignment(selectedOption);
        const assignment = assignedSubjects.find(a => a.id === selectedOption.value);
        if (assignment) {
            fetchSubjectDetails(assignment);
        }
    };

    const handleMarkChange = (studentId, componentId, field, value) => {
        // Disabled: This view is read-only.
        console.warn("Direct editing is disabled in this view. Please use the 'Internal Exam Round' module for entries.");
    };

    const calculateTotal = (studentId) => {
        if (!marksDraft[studentId]) return 0;
        let iaMarks = [];
        let otherMarksTotal = 0;

        marksStructure.forEach(comp => {
            const entry = marksDraft[studentId][comp.id];
            if (entry) {
                let score = entry.isAbsent ? 0 : parseFloat(entry.marks) || 0;
                let cname = comp.component_name ? comp.component_name.toUpperCase() : '';
                if (cname.includes('IA')) {
                    iaMarks.push(score);
                } else if (!cname.includes('TOTAL') && !cname.includes('BEST_OF_3')) {
                    otherMarksTotal += score;
                }
            }
        });

        iaMarks.sort((a, b) => b - a);
        let bestOf2 = (iaMarks[0] || 0) + (iaMarks[1] || 0);

        return bestOf2 + otherMarksTotal;
    };

    const determineStatus = (studentId) => {
        if (!marksDraft[studentId] || marksStructure.length === 0) return { label: 'Pending', style: 'text-slate-400' };

        let isFullyAbsent = true;
        let isPartiallyPending = false;

        // Cumulative Pass Calculation
        let cumulativePassMarks = 0;
        let hasExplicitTotal = false;
        let iaPassMarks = [];
        let otherPassMarks = 0;

        marksStructure.forEach(comp => {
            const entry = marksDraft[studentId][comp.id];
            let cname = comp.component_name ? comp.component_name.toUpperCase() : '';

            if (cname.includes('TOTAL') || cname.includes('BEST_OF_3')) {
                cumulativePassMarks = parseFloat(comp.passing_marks) || 0;
                hasExplicitTotal = true;
            } else if (cname.includes('IA')) {
                iaPassMarks.push(parseFloat(comp.passing_marks) || 0);
            } else {
                otherPassMarks += parseFloat(comp.passing_marks) || 0;
            }

            if (!entry || (entry.marks === '' && !entry.isAbsent)) {
                isPartiallyPending = true;
            } else {
                isFullyAbsent = isFullyAbsent && entry.isAbsent;
            }
        });

        if (isPartiallyPending) return { label: 'Incomplete', style: 'text-indigo-' };
        if (isFullyAbsent) return { label: 'Absent', style: 'text-red-500' };

        if (!hasExplicitTotal) {
            // Sort IA pass marks and take top 2 to estimate required IA pass total
            iaPassMarks.sort((a, b) => b - a);
            cumulativePassMarks = (iaPassMarks[0] || 0) + (iaPassMarks[1] || 0) + otherPassMarks;
        }

        const totalScore = calculateTotal(studentId);

        if (totalScore < cumulativePassMarks) {
            return { label: 'Fail', style: 'text-red-500' };
        }

        return { label: 'Pass', style: 'text-green-500' };
    };

    const filteredStudents = React.useMemo(() => {
        if (!searchQuery.trim()) return students;
        
        const query = searchQuery.toLowerCase().trim();
        return students.filter(student => {
            const sName = (student.name || "").toLowerCase();
            const sRoll = (student.rollnumber || "").toLowerCase();
            const total = calculateTotal(student.id).toString();
            const status = determineStatus(student.id).label.toLowerCase();
            
            // Check individual component marks
            let componentMatches = false;
            if (marksDraft[student.id]) {
                componentMatches = Object.values(marksDraft[student.id]).some(d => 
                    String(d.marks).includes(query) || (d.isAbsent && query.includes('absent'))
                );
            }

            return sName.includes(query) || 
                   sRoll.includes(query) || 
                   total.includes(query) || 
                   status.includes(query) || 
                   componentMatches;
        });
    }, [students, searchQuery, marksDraft, marksStructure]);

    const checkHasChanges = () => {
        for (const studentId in marksDraft) {
            for (const compId in marksDraft[studentId]) {
                const current = marksDraft[studentId][compId];
                const initial = initialMarks[studentId]?.[compId] || { marks: '', isAbsent: false };

                const currentMark = current.marks === '' ? null : parseFloat(current.marks);
                const initialMark = initial.marks === '' ? null : parseFloat(initial.marks);

                if (currentMark !== initialMark || current.isAbsent !== initial.isAbsent) {
                    return true;
                }
            }
        }
        return false;
    };

    const normalizedStatus = (workflowStatus || 'Pending').trim();
    // This page is now permanently read-only
    const isReadOnly = true; 
    const isSubjectSubmitted = ['Submitted', 'Approved', 'Locked'].includes(normalizedStatus);

    const handleSaveMarks = async () => {
        if (isSubjectSubmitted && normalizedStatus !== 'Rejected') return;
        const assignmentStr = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignmentStr) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            const payload = [];
            Object.entries(marksDraft).forEach(([studentId, components]) => {
                Object.entries(components).forEach(([componentId, data]) => {
                    if (data.marks !== '' || data.isAbsent) {
                        payload.push({
                            student_id: parseInt(studentId),
                            subject_id: assignmentStr.subject_id,
                            component_id: parseInt(componentId),
                            marks_obtained: data.isAbsent ? 0 : parseFloat(data.marks || 0),
                            is_absent: data.isAbsent
                        });
                    }
                });
            });

            if (payload.length === 0) {
                toast.info("No marks to save.");
                setIsSaving(false);
                return;
            }

            await facultyApi.saveMarks({
                marksData: payload,
                faculty_id: teacherId,
                college_id: assignmentStr.college_id,
                semester_id: assignmentStr.semester_id,
                academic_year_id: assignmentStr.academic_year_id,
                section: assignmentStr.section
            });

            toast.success("Marks saved successfully!");
            fetchSubjectDetails(assignmentStr);
        } catch (err) {
            toast.error("Error saving marks");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadTemplate = () => {
        if (!marksStructure.length) return toast.warning('Structure not loaded');
        const headers = ['Enrollment No', 'Student Name', ...marksStructure.map(c => c.component_name)];
        const csv = Papa.unparse([headers]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `template_${selectedAssignment?.label || 'internal'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToCSV = () => {
        if (students.length === 0) return toast.warning('No data to export');
        const csv = Papa.unparse(students.map(s => {
            const row = {
                'Enrollment No': s.rollnumber || s.id,
                'Student Name': s.name
            };
            marksStructure.forEach(comp => {
                const draft = marksDraft[s.id]?.[comp.id] || { marks: '', isAbsent: false };
                row[comp.component_name] = draft.isAbsent ? 'ABSENT' : draft.marks;
            });
            row['Total'] = calculateTotal(s.id).toFixed(1);
            row['Status'] = determineStatus(s.id).label;
            return row;
        }));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `marks_${selectedAssignment?.label || 'internal'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const transformPayload = (rows) => {
        return rows.map(row => {
            const components = {};
            Object.entries(row).forEach(([key, val]) => {
                if (key.startsWith('comp_')) {
                    const compId = key.split('_')[1];
                    components[compId] = { 
                        marks: val === 'ABSENT' ? 0 : val, 
                        is_absent: val === 'ABSENT' 
                    };
                }
            });
            return {
                enrollment_number: row.enrollment_number,
                components: components
            };
        });
    };


    const handleSubmitMarks = async () => {
        const assignmentStr = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignmentStr || (isSubjectSubmitted && normalizedStatus !== 'Rejected')) return;

        // --- Validation Check: Ensure all students have marks for ALL components ---
        const missingEntries = [];
        students.forEach(student => {
            marksStructure.forEach(comp => {
                const entry = marksDraft[student.id]?.[comp.id];
                if (!entry || (entry.marks === '' && !entry.isAbsent)) {
                    missingEntries.push({ student: student.name, component: comp.component_name });
                }
            });
        });

        if (missingEntries.length > 0) {
            toast.error("Incomplete marks detected. Please ensure all internal assessment rounds (IA1, IA2, etc.) are filled for all students before submitting to HOD.");
            return;
        }

        if (!window.confirm("Are you sure you want to submit all marks to HOD? This will lock editing for this subject.")) return;

        // Validation for Rejected status
        if (workflowStatus === 'Rejected' && !checkHasChanges()) {
            toast.error("Please update marks before resubmitting. No changes detected.");
            return;
        }

        toast.info("Submitting marks...");

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            // 1. First Save the marks as draft
            const payload = [];
            Object.entries(marksDraft).forEach(([studentId, components]) => {
                Object.entries(components).forEach(([componentId, data]) => {
                    if (data.marks !== '' || data.isAbsent) {
                        payload.push({
                            student_id: parseInt(studentId),
                            subject_id: assignmentStr.subject_id,
                            component_id: parseInt(componentId),
                            marks_obtained: data.isAbsent ? 0 : parseFloat(data.marks || 0),
                            is_absent: data.isAbsent
                        });
                    }
                });
            });

            // Even if payload is empty, we proceed to submit if some marks exist in DB, 
            // but usually we want to save current state.
            if (payload.length > 0) {
                await facultyApi.saveMarks({
                    marksData: payload,
                    faculty_id: teacherId,
                    college_id: assignmentStr.college_id,
                    semester_id: assignmentStr.semester_id,
                    academic_year_id: assignmentStr.academic_year_id,
                    section: assignmentStr.section
                });
            }

            // 2. Then Submit
            const responseData = await facultyApi.submitMarks({
                subject_id: assignmentStr.subject_id,
                section: assignmentStr.section,
                college_id: assignmentStr.college_id,
                semester_id: assignmentStr.semester_id,
                academic_year_id: assignmentStr.academic_year_id,
                faculty_id: teacherId,
                program_id: assignmentStr.program_id
            });

            toast.success("Marks submitted successfully!");
            fetchSubjectDetails(assignmentStr);
        } catch (err) {
            toast.error(err.response?.data?.error || "Error submitting marks");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestCorrection = async () => {
        const assignmentStr = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignmentStr || !['Submitted', 'Locked'].includes(workflowStatus)) return;

        if (!window.confirm("Are you sure you want to request the HOD to unlock these marks for corrections?")) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const data = await facultyApi.requestUnlock({
                subject_id: assignmentStr.subject_id,
                section: assignmentStr.section,
                college_id: assignmentStr.college_id,
                semester_id: assignmentStr.semester_id,
                academic_year_id: assignmentStr.academic_year_id
            });

            toast.success("Correction request sent to HOD successfully!");
            // Optimistic update to lock UI immediately
            setWorkflowStatus('Correction Requested');
            fetchSubjectDetails(assignmentStr);
        } catch (err) {
            toast.error("Error sending correction request");
        } finally {
            setIsSaving(false);
        }
    };

    const options = assignedSubjects.map(a => ({
        value: a.id,
        label: `${a.subject_code} - ${a.subject_name} (Sec: ${a.section})`
    }));

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <BookOpen size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Internal Marks Entry</h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-sm text-slate-500 font-medium">Select a subject to enter student internal assessment marks.</p>
                        {selectedAssignment && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-black  tracking-widest border ${normalizedStatus === 'Pending' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                normalizedStatus === 'Submitted' ? 'bg-indigo- text-indigo- border-indigo-' :
                                    normalizedStatus === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
                                    normalizedStatus === 'Correction Requested' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse' :
                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}>
                                {normalizedStatus}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {selectedAssignment && subjectSchedules.length > 0 && (
                <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Search size={20} />
                        </div>
                        <div>
                            <p className="text-[13px] font-black  tracking-widest opacity-70">Internal Exam Schedule Detected</p>
                            <div className="flex gap-4 mt-1">
                                {subjectSchedules.map((s, idx) => (
                                    <div key={idx} className="text-sm font-bold">
                                        Exam Date: <span className="bg-white/20 px-2 py-0.5 rounded-lg text-white ml-1">{new Date(s.exam_date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Assigned Subject</label>
                    <Select
                        options={options}
                        value={selectedAssignment}
                        onChange={handleAssignmentSelect}
                        placeholder="Select Subject & Section..."
                        styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                    />
                </div>

                {/* Bulk Actions - Disabled as this is read-only summary view */}
            </div>

            {loading && (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {!loading && selectedAssignment && students.length > 0 && marksStructure.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-indigo-500" />
                            <h3 className="text-lg font-bold text-slate-900">Student List</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-full md:w-64">
                                <TableSearch 
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Filter students..."
                                />
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-slate-500 whitespace-nowrap">
                                Total Students: {students.length}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto text-slate-700">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="px-6 py-4 text-[13px] font-black text-slate-500  tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Student Name / ID</th>
                                    {marksStructure.map(comp => (
                                        <th key={comp.id} className="px-6 py-4 text-[13px] font-black text-slate-500  tracking-widest text-center">
                                            {comp.component_name} <br />
                                            <span className="text-[12px] text-slate-400 font-medium">Max: {comp.max_marks} | Min: {comp.passing_marks}</span>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[13px] font-black text-slate-500  tracking-widest text-center border-l border-slate-200">Total</th>
                                    <th className="px-6 py-4 text-[13px] font-black text-slate-500  tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => {
                                    const total = calculateTotal(student.id);
                                    const status = determineStatus(student.id);
                                    const review = reviews[student.id];

                                    return (
                                        <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10 border-r border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{student.name || `Student ${student.id}`}</p>
                                                        <p className="text-[13px] text-slate-500">Reg: {student.rollnumber || student.id}</p>
                                                    </div>
                                                    {review?.status === 'Rejected' && (
                                                        <div className="relative group/tooltip">
                                                            <ShieldAlert size={16} className="text-red-500 animate-pulse" />
                                                            <div className="absolute left-full ml-2 top-0 invisible group-hover/tooltip:visible bg-red-600 text-white p-2 rounded-lg text-[12px] w-48 z-50 shadow-xl">
                                                                <p className="font-bold border-b border-red-500 mb-1">REJECTED BY ADMIN</p>
                                                                {review.comment || "Please correct and re-submit."}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {marksStructure.map(comp => {
                                                const draft = marksDraft[student.id]?.[comp.id] || { marks: '', isAbsent: false };
                                                const isFailedComp = !draft.isAbsent && draft.marks !== '' && parseFloat(draft.marks) < parseFloat(comp.passing_marks);

                                                return (
                                                    <td key={comp.id} className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className={`w-20 text-center px-2 py-1.5 border rounded-lg font-bold transition-all ${draft.isAbsent
                                                                ? 'bg-slate-50 border-slate-100 text-slate-300 italic'
                                                                : isFailedComp
                                                                    ? 'border-red-100 bg-red-50 text-red-500'
                                                                    : 'border-slate-100 bg-slate-50 text-slate-600'
                                                                }`}>
                                                                {draft.isAbsent ? "ABSENT" : (draft.marks || "0.0")}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="px-6 py-4 text-center border-l border-slate-100">
                                                <span className="text-base font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
                                                    {total.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[13px] font-black  tracking-widest ${status.style}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })) : (
                                    <tr>
                                        <td colSpan={marksStructure.length + 3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search size={40} className="text-slate-200" />
                                                <h3 className="text-lg font-black text-slate-900  tracking-tighter">No matching students found</h3>
                                                <p className="text-slate-400 font-medium text-sm">Try searching with a different name or roll number.</p>
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="mt-4 text-[13px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-widest"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 sticky bottom-0 z-20">
                        {isSubjectSubmitted && (
                            <div className="flex-1 flex items-center justify-between gap-4 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                    <ShieldAlert size={18} />
                                    {normalizedStatus === 'Correction Requested' 
                                        ? "Correction request pending HOD approval. Marks are locked." 
                                        : normalizedStatus === 'Locked'
                                        ? "Marks have been locked by HOD. Request correction if changes are needed."
                                        : "Marks are submitted and in read-only mode till HOD review."}
                                </div>
                                {['Submitted', 'Locked'].includes(normalizedStatus) && (
                                    <button
                                        onClick={handleRequestCorrection}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[12px] font-black  tracking-widest rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                                    >
                                        <ShieldAlert size={14} />
                                        Request Correction
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <button
                            disabled={isSaving || (isSubjectSubmitted && normalizedStatus !== 'Rejected')}
                            onClick={handleSaveMarks}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 text-slate-700 font-bold bg-white border border-slate-200 rounded-xl shadow-sm transition-all text-sm
                                ${isSaving || (isSubjectSubmitted && normalizedStatus !== 'Rejected') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'}`}
                        >
                            <Save size={18} />
                            Save Draft
                        </button>
                        
                        <button
                            disabled={isSaving || (isSubjectSubmitted && normalizedStatus !== 'Rejected')}
                            onClick={handleSubmitMarks}
                            className={`inline-flex items-center gap-2 px-10 py-3.5 text-white font-black rounded-xl shadow-xl transition-all  tracking-widest text-sm
                                ${isSaving || (isSubjectSubmitted && normalizedStatus !== 'Rejected') ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-600/20 active:scale-[0.98]'}`}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <CheckCircle size={20} />
                            )}
                            <span>{isSaving ? 'Processing...' : 'Submit Records'}</span>
                        </button>
                    </div>
                </div>
            )}

            {!loading && selectedAssignment && (students.length === 0 || marksStructure.length === 0) && (
                <div className="bg-indigo- border border-indigo- rounded-2xl p-6 text-center text-yellow-800">
                    <p className="font-bold">Cannot proceed with marks entry.</p>
                    <p className="text-sm mt-1">Either no students are enrolled or the marks structure is not configured for this subject yet.</p>
                </div>
            )}

            {/* Bulk Import Modal */}
            {selectedAssignment && marksStructure.length > 0 && (
                <BulkImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onUploadSuccess={() => {
                        const assignment = assignedSubjects.find(a => a.id === selectedAssignment.value);
                        fetchSubjectDetails(assignment);
                        setShowImportModal(false);
                    }}
                    endpoint="/faculty-marks/bulk-upload"
                    entityName="marks"
                    expectedColumns={{
                        enrollment_number: 'Enrollment No',
                        ...Object.fromEntries(marksStructure.map(c => [`comp_${c.id}`, c.component_name]))
                    }}
                    optionalColumns={marksStructure.map(c => `comp_${c.id}`)}
                    extraPayload={{
                        subject_id: assignedSubjects.find(a => a.id === selectedAssignment.value)?.subject_id,
                        faculty_id: JSON.parse(localStorage.getItem('user'))?.teacher_id || 1,
                        college_id: assignedSubjects.find(a => a.id === selectedAssignment.value)?.college_id,
                        semester_id: assignedSubjects.find(a => a.id === selectedAssignment.value)?.semester_id,
                        academic_year_id: assignedSubjects.find(a => a.id === selectedAssignment.value)?.academic_year_id,
                        section: assignedSubjects.find(a => a.id === selectedAssignment.value)?.section
                    }}
                    transformPayload={transformPayload}
                />
            )}
        </div>
    );
};

export default MarksEntry;
