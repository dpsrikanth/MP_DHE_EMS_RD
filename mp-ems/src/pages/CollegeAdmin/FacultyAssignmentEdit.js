import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Users, Save, ArrowLeft } from "lucide-react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../../config';

const FacultyAssignmentEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    
    // Fallback to empty if state is not passed
    const [editingAssignment, setEditingAssignment] = useState(location.state?.assignment || {
        teacher_id: null, subject_id: null, semester_id: null, academic_year_id: null, section: ''
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            await fetchMasterData();
            if (!location.state?.assignment) {
                await fetchAssignmentData();
            } else {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/masters'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubjects(data.subjects || []);
                setSemesters(data.semesters || []);
                setAcademicYears(data.academicYears || []);
            }

            const teacherRes = await fetch(getApiUrl('/master-teachers'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (teacherRes.ok) {
                const teacherData = await teacherRes.json();
                setFaculties(teacherData || []);
            }
        } catch (err) {
            toast.error('Failed to load master data');
        }
    };

    const fetchAssignmentData = async () => {
        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            const res = await fetch(getApiUrl(`/college-admin/faculty-assignments/${collegeId}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const found = data.find(a => a.id.toString() === id);
                if (found) {
                    setEditingAssignment({
                        ...found,
                        teacher_id: parseInt(found.teacher_id),
                        subject_id: parseInt(found.subject_id),
                        semester_id: parseInt(found.semester_id),
                        academic_year_id: parseInt(found.academic_year_id)
                    });
                } else {
                    toast.error("Assignment not found");
                    navigate('/college-admin/faculty-assign');
                }
            }
        } catch (err) {
            toast.error('Failed to fetch assignment details');
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateAssignment = async () => {
        if (!editingAssignment.teacher_id || !editingAssignment.subject_id || !editingAssignment.semester_id || !editingAssignment.academic_year_id || !editingAssignment.section) {
            return toast.warning("Please fill in all assignment details");
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/college-admin/faculty-assignments/${id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingAssignment)
            });
            if (res.ok) {
                toast.success("Faculty assignment updated successfully");
                navigate('/college-admin/faculty-assign');
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
        <div className="p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <button 
                onClick={() => navigate('/college-admin/faculty-assign')}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
            >
                <ArrowLeft size={16} /> Back to Assignments
            </button>

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Users size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Edit Faculty Assignment</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Update the subject and section details for the faculty member.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8 max-w-4xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Faculty Member</label>
                        <Select
                            options={faculties.map(f => ({ value: f.id, label: f.name || f.email || `Teacher ID: ${f.id}` }))}
                            value={faculties.map(f => ({ value: f.id, label: f.name || f.email || `Teacher ID: ${f.id}` })).find(o => o.value === editingAssignment.teacher_id)}
                            onChange={(opt) => setEditingAssignment({...editingAssignment, teacher_id: opt ? opt.value : null})}
                            placeholder="Search Faculty..."
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0', minHeight: '3.5rem' }) }}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Academic Year</label>
                        <Select
                            options={academicYears.map(ay => ({ value: ay.id, label: ay.year_name }))}
                            value={academicYears.map(ay => ({ value: ay.id, label: ay.year_name })).find(o => o.value === editingAssignment.academic_year_id)}
                            onChange={(opt) => setEditingAssignment({...editingAssignment, academic_year_id: opt ? opt.value : null})}
                            placeholder="Select AY"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0', minHeight: '3.5rem' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                        <Select
                            options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={semesters.map(s => ({ value: s.id, label: s.semester_name })).find(o => o.value === editingAssignment.semester_id)}
                            onChange={(opt) => setEditingAssignment({...editingAssignment, semester_id: opt ? opt.value : null})}
                            placeholder="Select Semester"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0', minHeight: '3.5rem' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                        <Select
                            options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
                            value={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` })).find(o => o.value === editingAssignment.subject_id)}
                            onChange={(opt) => setEditingAssignment({...editingAssignment, subject_id: opt ? opt.value : null})}
                            placeholder="Select Subject"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0', minHeight: '3.5rem' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Section</label>
                        <input
                            type="text"
                            placeholder="e.g. A, B, C"
                            value={editingAssignment.section}
                            onChange={(e) => setEditingAssignment({...editingAssignment, section: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-8 border-t border-slate-100">
                    <button
                        onClick={handleUpdateAssignment}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Save size={16} />
                        <span>Update Assignment</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyAssignmentEdit;
