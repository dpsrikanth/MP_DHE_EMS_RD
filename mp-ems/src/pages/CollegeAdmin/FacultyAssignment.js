import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Users, Save, List } from "lucide-react";

const FacultyAssignment = () => {
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
            const teacherRes = await fetch('http://localhost:8080/api/teachers', {
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
                            options={faculties.map(f => ({ value: f.id, label: `${f.employee_code || ''} - ${f.name || f.user_id}` }))}
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Section</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.map((assignment, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        Faculty ID: {assignment.teacher_id} {/* Assuming name is fetched properly */}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{assignment.subject_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{assignment.section}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                            {assignment.status}
                                        </span>
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
        </div>
    );
};

export default FacultyAssignment;
