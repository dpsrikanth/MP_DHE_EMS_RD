import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Users, Save, List, Pencil, Trash2, X } from "lucide-react";

const FacultyAssignment = () => {
    const navigate = useNavigate();
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
    const [section, setSection] = useState('');

    const [editingAssignment, setEditingAssignment] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMasterData();
        fetchAssignments();
    }, []);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/masters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubjects(data.subjects || []);
                setSemesters(data.semesters || []);
                setAcademicYears(data.academicYears || []);
            }

            // Fetch Teachers
            const teacherRes = await fetch('http://localhost:8080/api/master-teachers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (teacherRes.ok) {
                const teacherData = await teacherRes.json();
                setFaculties(teacherData || []);
            }
        } catch (err) {
            toast.error('Failed to load master data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            const res = await fetch(`http://localhost:8080/api/college-admin/faculty-assignments/${collegeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch assignments');
        }
    }

    const handleAssign = async () => {
        if (!selectedFaculty || !selectedSubject || !selectedSemester || !selectedAcademicYear || !section) {
            return toast.warning("Please fill all required fields.");
        }

        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            const response = await fetch('http://localhost:8080/api/college-admin/assign-faculty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    college_id: collegeId,
                    teacher_id: selectedFaculty.value,
                    subject_id: selectedSubject.value,
                    semester_id: selectedSemester.value,
                    academic_year_id: selectedAcademicYear.value,
                    section: section
                })
            });

            if (response.ok) {
                toast.success("Faculty assigned successfully!");
                setSelectedFaculty(null);
                setSelectedSubject(null);
                setSection('');
                fetchAssignments(); // Refresh list
            } else {
                toast.error("Failed to assign faculty");
            }
        } catch (err) {
            toast.error("Error assigning faculty");
        }
    };

    const handleDeleteClick = (assignment) => {
        setDeleteTarget(assignment);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/faculty-assignments/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Faculty assignment deleted successfully");
                fetchAssignments();
            } else {
                toast.error("Failed to delete assignment");
            }
        } catch (err) {
            toast.error("An error occurred while deleting");
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleEditClick = (assignment) => {
        navigate(`/college-admin/faculty-assign/edit/${assignment.id}`, {
            state: {
                assignment: {
                    ...assignment,
                    teacher_id: parseInt(assignment.teacher_id),
                    subject_id: parseInt(assignment.subject_id),
                    semester_id: parseInt(assignment.semester_id),
                    academic_year_id: parseInt(assignment.academic_year_id),
                }
            }
        });
    };

    const handleUpdateAssignment = async () => {
        if (!editingAssignment.teacher_id || !editingAssignment.subject_id || !editingAssignment.semester_id || !editingAssignment.academic_year_id || !editingAssignment.section) {
            return toast.warning("Please fill in all assignment details");
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/faculty-assignments/${editingAssignment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingAssignment)
            });
            if (res.ok) {
                toast.success("Faculty assignment updated successfully");
                setShowEditModal(false);
                fetchAssignments();
            } else {
                toast.error("Failed to update assignment");
            }
        } catch (err) {
            toast.error("An error occurred while updating");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Users size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Faculty Assignment</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Assign faculty members to subjects and sections.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Faculty Member</label>
                        <Select
                            options={faculties.map(f => ({ value: f.id, label: f.name || f.email || `Teacher ID: ${f.id}` }))}
                            value={selectedFaculty}
                            onChange={setSelectedFaculty}
                            placeholder="Search Faculty..."
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Academic Year</label>
                        <Select
                            options={academicYears.map(ay => ({ value: ay.id, label: ay.year_name }))}
                            value={selectedAcademicYear}
                            onChange={setSelectedAcademicYear}
                            placeholder="Select AY"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                        <Select
                            options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedSemester}
                            onChange={setSelectedSemester}
                            placeholder="Select Semester"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                        <Select
                            options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            placeholder="Select Subject"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Section</label>
                        <input
                            type="text"
                            placeholder="e.g. A, B, C"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2 text-slate-800 outline-none focus:border-indigo-500 font-medium"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={handleAssign}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Save size={18} />
                        <span>Assign Faculty</span>
                    </button>
                </div>
            </div>

            {/* Existing Assignments List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <List size={20} className="text-indigo-500" /> Current Assignments
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Faculty</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Academic Year & Sem</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Section</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.map((assignment, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        {assignment.faculty_name || `Faculty ID: ${assignment.teacher_id}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{assignment.academic_year || '-'}</span>
                                            <span className="text-xs font-bold text-slate-400 mt-0.5">{assignment.semester || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{assignment.subject_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{assignment.section}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                            {assignment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEditClick({
                                                    ...assignment,
                                                    // ensuring numbers for select options matching
                                                    teacher_id: parseInt(assignment.teacher_id),
                                                    subject_id: parseInt(assignment.subject_id),
                                                    semester_id: parseInt(assignment.semester_id),
                                                    academic_year_id: parseInt(assignment.academic_year_id),
                                                })}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Edit Assignment"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(assignment)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Assignment"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-500">No assignments found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Edit Modal */}
            {showEditModal && editingAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden pointer-events-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Edit Faculty Assignment</h3>
                                <p className="text-xs text-slate-500 font-medium">Update the subject and section details</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-white hover:bg-slate-200 text-slate-400 rounded-xl transition-colors border border-slate-200 shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Faculty Member</label>
                                    <Select
                                        options={faculties.map(f => ({ value: f.id, label: f.name || f.email || `Teacher ID: ${f.id}` }))}
                                        value={faculties.map(f => ({ value: f.id, label: f.name || f.email || `Teacher ID: ${f.id}` })).find(o => o.value === editingAssignment.teacher_id)}
                                        onChange={(opt) => setEditingAssignment({...editingAssignment, teacher_id: opt ? opt.value : null})}
                                        placeholder="Search Faculty..."
                                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                                        menuPortalTarget={document.body}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Academic Year</label>
                                    <Select
                                        options={academicYears.map(ay => ({ value: ay.id, label: ay.year_name }))}
                                        value={academicYears.map(ay => ({ value: ay.id, label: ay.year_name })).find(o => o.value === editingAssignment.academic_year_id)}
                                        onChange={(opt) => setEditingAssignment({...editingAssignment, academic_year_id: opt ? opt.value : null})}
                                        placeholder="Select AY"
                                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Semester</label>
                                    <Select
                                        options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                                        value={semesters.map(s => ({ value: s.id, label: s.semester_name })).find(o => o.value === editingAssignment.semester_id)}
                                        onChange={(opt) => setEditingAssignment({...editingAssignment, semester_id: opt ? opt.value : null})}
                                        placeholder="Select Semester"
                                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Subject</label>
                                    <Select
                                        options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
                                        value={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` })).find(o => o.value === editingAssignment.subject_id)}
                                        onChange={(opt) => setEditingAssignment({...editingAssignment, subject_id: opt ? opt.value : null})}
                                        placeholder="Select Subject"
                                        styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0' }) }}
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A, B, C"
                                        value={editingAssignment.section}
                                        onChange={(e) => setEditingAssignment({...editingAssignment, section: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleUpdateAssignment} className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all">Update Assignment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto">
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                Are you sure you want to delete this faculty assignment? This action cannot be reversed.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                                    onClick={handleDeleteConfirm}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyAssignment;
