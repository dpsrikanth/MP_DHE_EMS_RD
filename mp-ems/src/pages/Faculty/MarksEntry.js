import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { BookOpen, Users, Save, CheckCircle } from "lucide-react";

const MarksEntry = () => {
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [marksStructure, setMarksStructure] = useState([]);
    const [enteredMarks, setEnteredMarks] = useState([]);

    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // This state holds the current unsaved edits in a structured way: 
    // { studentId: { componentId: { marks: value, isAbsent: boolean } } }
    const [marksDraft, setMarksDraft] = useState({});

    useEffect(() => {
        fetchAssignedSubjects();
    }, []);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            const res = await fetch(`http://localhost:8080/api/faculty-marks/assigned-subjects/${teacherId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignedSubjects(data || []);
            }
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
            const token = localStorage.getItem('token');

            // 1. Fetch Marks Structure for this subject
            const structureRes = await fetch(`http://localhost:8080/api/college-admin/marks-structure/${assignment.subject_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let structureData = [];
            if (structureRes.ok) structureData = await structureRes.json();
            setMarksStructure(structureData);

            // 2. Fetch Students for this subject (assuming fetched by program/semester/college)
            const studentsRes = await fetch(`http://localhost:8080/api/faculty-marks/students?college_id=${assignment.college_id}&semester_id=${assignment.semester_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let studentsData = [];
            if (studentsRes.ok) studentsData = await studentsRes.json();
            setStudents(studentsData);

            // 3. Fetch already entered marks
            const marksRes = await fetch(`http://localhost:8080/api/faculty-marks/entered-marks?subject_id=${assignment.subject_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let existingMarks = [];
            if (marksRes.ok) existingMarks = await marksRes.json();
            setEnteredMarks(existingMarks);

            // Populate draft state with existing marks
            const draft = {};
            studentsData.forEach(student => {
                draft[student.id] = {};
                structureData.forEach(comp => {
                    const existing = existingMarks.find(m => m.student_id === student.id && m.component_id === comp.id);
                    draft[student.id][comp.id] = {
                        marks: existing ? existing.marks_obtained : '',
                        isAbsent: existing ? existing.is_absent : false
                    };
                });
            });
            setMarksDraft(draft);

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
        setMarksDraft(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [componentId]: {
                    ...prev[studentId]?.[componentId],
                    [field]: value
                }
            }
        }));
    };

    const calculateTotal = (studentId) => {
        if (!marksDraft[studentId]) return 0;
        let total = 0;
        Object.values(marksDraft[studentId]).forEach(comp => {
            if (!comp.isAbsent && comp.marks) {
                total += parseFloat(comp.marks) || 0;
            }
        });
        return total;
    };

    const determineStatus = (studentId) => {
        if (!marksDraft[studentId] || marksStructure.length === 0) return { label: 'Pending', style: 'text-slate-400' };

        let hasFailedComponent = false;
        let isFullyAbsent = true;
        let isPartiallyPending = false;

        marksStructure.forEach(comp => {
            const entry = marksDraft[studentId][comp.id];
            if (!entry || (entry.marks === '' && !entry.isAbsent)) {
                isPartiallyPending = true;
            } else {
                isFullyAbsent = isFullyAbsent && entry.isAbsent;
                if (!entry.isAbsent && parseFloat(entry.marks) < parseFloat(comp.passing_marks)) {
                    hasFailedComponent = true;
                }
            }
        });

        if (isPartiallyPending) return { label: 'Incomplete', style: 'text-yellow-500' };
        if (isFullyAbsent) return { label: 'Absent', style: 'text-red-500' };
        if (hasFailedComponent) return { label: 'Fail', style: 'text-red-500' };
        return { label: 'Pass', style: 'text-green-500' };
    };

    const handleSaveMarks = async () => {
        const assignmentStr = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignmentStr) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            // Transform draft into flat array format for the backend
            const payload = [];
            Object.entries(marksDraft).forEach(([studentId, components]) => {
                Object.entries(components).forEach(([componentId, data]) => {
                    // Only send if it has a value or is marked absent
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

            const res = await fetch('http://localhost:8080/api/faculty-marks/enter-marks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    marksData: payload,
                    faculty_id: teacherId
                })
            });

            const responseData = await res.json();

            if (res.ok) {
                toast.success("Marks saved successfully!");
                // Optionally refetch to get updated "entered marks" state
                fetchSubjectDetails(assignmentStr);
            } else {
                toast.error(responseData.error || "Failed to save marks");
            }
        } catch (err) {
            toast.error("Error saving marks");
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
                    <p className="text-sm text-slate-500 mt-1 font-medium">Select a subject to enter student internal assessment marks.</p>
                </div>
            </div>

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
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                            Total Students: {students.length}
                        </div>
                    </div>

                    <div className="overflow-x-auto text-slate-700">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Student Name / ID</th>
                                    {marksStructure.map(comp => (
                                        <th key={comp.id} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                                            {comp.component_name} <br />
                                            <span className="text-[10px] text-slate-400 font-medium">Max: {comp.max_marks} | Min: {comp.passing_marks}</span>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center border-l border-slate-200">Total</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    const total = calculateTotal(student.id);
                                    const status = determineStatus(student.id);

                                    return (
                                        <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10 border-r border-slate-100">
                                                <p className="text-sm font-bold text-slate-800">{student.name || `Student ${student.id}`}</p>
                                                <p className="text-xs text-slate-500">ID: {student.id}</p>
                                            </td>

                                            {marksStructure.map(comp => {
                                                const draft = marksDraft[student.id]?.[comp.id] || { marks: '', isAbsent: false };
                                                const isFailedComp = !draft.isAbsent && draft.marks !== '' && parseFloat(draft.marks) < parseFloat(comp.passing_marks);

                                                return (
                                                    <td key={comp.id} className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <input
                                                                type="number"
                                                                max={comp.max_marks}
                                                                min={0}
                                                                value={draft.marks}
                                                                disabled={draft.isAbsent}
                                                                onChange={(e) => handleMarkChange(student.id, comp.id, 'marks', e.target.value)}
                                                                className={`w-20 text-center px-2 py-1.5 border rounded-lg font-bold outline-none transition-all ${draft.isAbsent
                                                                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                                                                        : isFailedComp
                                                                            ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                                            : 'border-slate-200 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                                                                    }`}
                                                                placeholder={draft.isAbsent ? "AB" : "00"}
                                                            />
                                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={draft.isAbsent}
                                                                    onChange={(e) => handleMarkChange(student.id, comp.id, 'isAbsent', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded text-red-500 focus:ring-red-500 border-slate-300"
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Absent</span>
                                                            </label>
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
                                                <span className={`text-xs font-black uppercase tracking-widest ${status.style}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end sticky bottom-0 z-20">
                        <button
                            disabled={isSaving}
                            onClick={handleSaveMarks}
                            className={`inline-flex items-center gap-2 px-10 py-3.5 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-sm
                                ${isSaving ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-600/20 active:scale-[0.98]'}`}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <CheckCircle size={20} />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Submit Records'}</span>
                        </button>
                    </div>
                </div>
            )}

            {!loading && selectedAssignment && (students.length === 0 || marksStructure.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-800">
                    <p className="font-bold">Cannot proceed with marks entry.</p>
                    <p className="text-sm mt-1">Either no students are enrolled or the marks structure is not configured for this subject yet.</p>
                </div>
            )}
        </div>
    );
};

export default MarksEntry;
