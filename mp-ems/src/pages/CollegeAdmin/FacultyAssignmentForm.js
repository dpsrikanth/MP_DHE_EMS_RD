import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const FacultyAssignmentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    // States for ADD
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
    const [section, setSection] = useState('');

    // States for EDIT
    const [editingAssignment, setEditingAssignment] = useState({
        teacher_id: '', subject_id: '', semester_id: '', academic_year_id: '', section: ''
    });

    useEffect(() => {
        fetchMasterData().then(m => {
            if (isEditing) fetchAssignmentDataEdit(m);
        });
    }, [id]);

    const fetchMasterData = async () => {
        try {
            const data = await masterDataApi.getMasters();
            let masterData = {};
            setSubjects(data.subjects || []);
            setSemesters(data.semesters || []);
            setAcademicYears(data.academicYears || []);
            masterData = data;

            // Fetch Teachers
            const teacherData = await masterDataApi.getTeachers();
            setFaculties(teacherData || []);
            masterData.faculties = teacherData;
            return masterData;
        } catch (err) {
            toast.error('Failed to load master data');
            return null;
        }
    };

    const fetchAssignmentDataEdit = async (masterData) => {
        try {
            const collegeId = localStorage.getItem('collegeId');
            const data = await collegeAdminApi.getFacultyAssignments(collegeId);
            const assignment = data.find(m => m.id.toString() === id.toString());
            if (assignment) {
                setEditingAssignment({
                    id: assignment.id,
                    teacher_id: parseInt(assignment.teacher_id),
                    subject_id: parseInt(assignment.subject_id),
                    semester_id: parseInt(assignment.semester_id),
                    academic_year_id: parseInt(assignment.academic_year_id),
                    section: assignment.section
                });
            } else {
                toast.error("Assignment not found");
                navigate('/college-admin/faculty-assignment');
            }
        } catch (err) {
            toast.error('Failed to load assignment. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedFaculty || !selectedSubject || !selectedSemester || !selectedAcademicYear || !section) {
            return toast.warning("Please fill all required fields.");
        }
        setSaving(true);
        try {
            const collegeId = localStorage.getItem('collegeId');
            await collegeAdminApi.assignFaculty({
                college_id: collegeId,
                teacher_id: selectedFaculty.value,
                subject_id: selectedSubject.value,
                semester_id: selectedSemester.value,
                academic_year_id: selectedAcademicYear.value,
                section: section
            });

            toast.success("Faculty assigned successfully!");
            navigate('/college-admin/faculty-assignment');
        } catch (err) {
            toast.error("Error assigning faculty");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAssignment = async () => {
        if (!editingAssignment.teacher_id || !editingAssignment.subject_id || !editingAssignment.semester_id || !editingAssignment.academic_year_id || !editingAssignment.section) {
            return toast.warning("Please fill in all assignment details");
        }
        setSaving(true);
        try {
            await collegeAdminApi.updateFacultyAssignment(editingAssignment.id, editingAssignment);
            toast.success("Faculty assignment updated successfully");
            navigate('/college-admin/faculty-assignment');
        } catch (err) {
            toast.error("An error occurred while updating");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center gap-5 sticky top-0 z-10 bg-white">
                    <button 
                        type="button"
                        onClick={() => navigate('/college-admin/faculty-assignment')}
                        className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">
                            {isEditing ? 'Edit Faculty Assignment' : 'New Faculty Assignment'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {isEditing ? 'Update the subject and section details' : 'Assign faculty members to subjects and sections'}
                        </p>
                    </div>
                </div>

                <div className="p-10">
                    {!isEditing ? (
                        <div className="space-y-8">
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
                        </div>
                    ) : (
                        <div className="space-y-6">
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-500 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-[2.5rem]">
                    <button 
                        onClick={() => navigate('/college-admin/faculty-assignment')} 
                        disabled={saving}
                        className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={isEditing ? handleUpdateAssignment : handleAssign} 
                        disabled={saving || (!isEditing && (!selectedFaculty || !selectedSubject || !selectedSemester || !selectedAcademicYear || !section))}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isEditing ? 'Update Assignment' : 'Assign Faculty'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyAssignmentForm;
