import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { BarChart3, Plus, Trash2, Save } from "lucide-react";

const MarksConfig = () => {
    const [policies, setPolicies] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [components, setComponents] = useState([
        { id: Date.now(), name: '', maxMarks: '', passingMarks: '' }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMasterData();
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
                setPolicies(data.policies || []);
                setPrograms(data.programs || []);
                setSemesters(data.semesters || []);
                setSubjects(data.subjects || []);
                setDepartments(data.departments || []);
            }
        } catch (err) {
            toast.error('Failed to load master data');
        } finally {
            setLoading(false);
        }
    };

    const addComponent = () => {
        setComponents([...components, { id: Date.now(), name: '', maxMarks: '', passingMarks: '' }]);
    };

    const removeComponent = (id) => {
        setComponents(components.filter(c => c.id !== id));
    };

    const updateComponent = (id, field, value) => {
        setComponents(components.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    const handleSaveConfig = async () => {
        if (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment || !selectedSubject) {
            return toast.warning("Please select all mapping fields.");
        }

        // Validate components
        const invalidComponents = components.some(c => !c.name || !c.maxMarks || !c.passingMarks);
        if (invalidComponents || components.length === 0) {
            return toast.warning("Please fill all fields for components.");
        }

        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            for (let comp of components) {
                await fetch('http://localhost:8080/api/college-admin/marks-structure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        college_id: collegeId,
                        policy_id: selectedPolicy.value,
                        program_id: selectedProgram.value,
                        semester_id: selectedSemester.value,
                        department_id: selectedDepartment.value,
                        subject_id: selectedSubject.value,
                        component_name: comp.name,
                        max_marks: comp.maxMarks,
                        passing_marks: comp.passingMarks
                    })
                });
            }

            toast.success("Marks structure saved successfully!");
        } catch (err) {
            toast.error("Failed to save marks configuration");
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
                    <BarChart3 size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Internal Marks Structure</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Configure IA and Practical max marks and passing criteria.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Academic Policy</label>
                        <Select
                            options={policies.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedPolicy}
                            onChange={setSelectedPolicy}
                            placeholder="Policy"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Program</label>
                        <Select
                            options={programs.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedProgram}
                            onChange={setSelectedProgram}
                            placeholder="Program"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                        <Select
                            options={departments.map(d => ({ value: d.id, label: d.name }))}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            placeholder="Department"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                        <Select
                            options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedSemester}
                            onChange={setSelectedSemester}
                            placeholder="Semester"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                        <Select
                            options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            placeholder="Subject"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                </div>

                {selectedSubject && selectedDepartment && (
                    <div className="pt-6 border-t border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-4 h-px bg-slate-200"></span> Marks Components
                            </h3>
                            <button
                                onClick={addComponent}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-lg transition-colors border border-indigo-100"
                            >
                                <Plus size={16} /> <span>Add Component</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {components.map((comp, idx) => (
                                <div key={comp.id} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex-1 w-full space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Component Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. IA1, Assignment, Practical"
                                            value={comp.name}
                                            onChange={(e) => updateComponent(comp.id, 'name', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 font-medium"
                                        />
                                    </div>
                                    <div className="w-full md:w-48 space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Max Marks</label>
                                        <input
                                            type="number"
                                            placeholder="00"
                                            value={comp.maxMarks}
                                            onChange={(e) => updateComponent(comp.id, 'maxMarks', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div className="w-full md:w-48 space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Passing Marks</label>
                                        <input
                                            type="number"
                                            placeholder="00"
                                            value={comp.passingMarks}
                                            onChange={(e) => updateComponent(comp.id, 'passingMarks', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div className="flex items-end h-full pt-6">
                                        <button
                                            onClick={() => removeComponent(comp.id)}
                                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveConfig}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                            >
                                <Save size={18} />
                                <span>Save Framework</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarksConfig;
