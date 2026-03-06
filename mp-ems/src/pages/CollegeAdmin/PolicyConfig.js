import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ShieldCheck, Save } from "lucide-react";

const PolicyConfig = () => {
    const [policies, setPolicies] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // For a real app, you would fetch these from specific endpoints or a master endpoint
            const res = await fetch('http://localhost:8080/api/masters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPolicies(data.policies || []);
                setPrograms(data.programs || []);
                setSemesters(data.semesters || []);
                setSubjects(data.subjects || []); // Assuming masters returns subjects too
                setDepartments(data.departments || []);
            }
        } catch (err) {
            toast.error('Failed to load master data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMapping = async () => {
        if (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment) {
            return toast.warning("Please select Policy, Program, Semester, and Department");
        }

        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            // 1. Map Program & Semester to Policy
            await fetch('http://localhost:8080/api/college-admin/map-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    policy_id: selectedPolicy.value,
                    program_id: selectedProgram.value,
                    semester_id: selectedSemester.value,
                    department_id: selectedDepartment.value,
                    college_id: collegeId
                })
            });

            // 2. Map Subjects
            if (selectedSubjects.length > 0) {
                for (let subject of selectedSubjects) {
                    await fetch('http://localhost:8080/api/college-admin/map-subject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            policy_id: selectedPolicy.value,
                            program_id: selectedProgram.value,
                            semester_id: selectedSemester.value,
                            department_id: selectedDepartment.value,
                            subject_id: subject.value,
                            college_id: collegeId
                        })
                    });
                }
            }

            toast.success("Policy mapping saved successfully!");
            // Reset form or refetch existing mappings (implement based on need)
            setSelectedSubjects([]);

        } catch (err) {
            toast.error("Failed to save mapping");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Policy Configuration</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Map academic policies to programs and semesters.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Academic Policy</label>
                        <Select
                            options={policies.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedPolicy}
                            onChange={setSelectedPolicy}
                            placeholder="Select Policy (e.g., NEP 2020)"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Program</label>
                        <Select
                            options={programs.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedProgram}
                            onChange={setSelectedProgram}
                            placeholder="Select Program"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                        <Select
                            options={departments.map(d => ({ value: d.id, label: d.name }))}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            placeholder="Select Department"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                        <Select
                            options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedSemester}
                            onChange={setSelectedSemester}
                            placeholder="Select Semester"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                </div>

                {selectedPolicy && selectedProgram && selectedSemester && selectedDepartment && (
                    <div className="pt-6 border-t border-slate-100 space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-px bg-slate-200"></span> Map Subjects
                        </h3>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Select Subjects for this Semester</label>
                            <Select
                                isMulti
                                options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
                                value={selectedSubjects}
                                onChange={setSelectedSubjects}
                                placeholder="Search and select subjects..."
                                styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.3rem', borderColor: '#e2e8f0' }) }}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveMapping}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
                            >
                                <Save size={18} />
                                <span>Save Mapping</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PolicyConfig;
