import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { BookOpenCheck, Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const MarksConfigForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [policies, setPolicies] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    // States for ADD (Multi-component)
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [components, setComponents] = useState([
        { id: Date.now(), name: '', maxMarks: '', passingMarks: '' }
    ]);

    // States for EDIT (Single-component)
    const [editingStructure, setEditingStructure] = useState({
        component_name: '', max_marks: '', passing_marks: ''
    });

    useEffect(() => {
        fetchMasterData().then((m) => {
            if (isEditing) fetchStructureDataEdit(m);
        });
    }, [id]);

    const fetchMasterData = async () => {
        try {
            const data = await masterDataApi.getMasters();
            setPolicies(data.policies || []);
            setPrograms(data.programs || []);
            setSemesters(data.semesters || []);
            setSubjects(data.subjects || []);
            setDepartments(data.departments || []);
            return data;
        } catch (err) {
            toast.error('Failed to load master data');
        }
        return null;
    };

    const fetchStructureDataEdit = async (masterData) => {
        try {
            const data = await collegeAdminApi.getAllMarksStructures();
            const struct = data.find(m => m.id.toString() === id.toString());
            if (struct) {
                setEditingStructure(struct);
            } else {
                toast.error("Structure not found");
                navigate('/college-admin/marks-config');
            }
        } catch (err) {
            toast.error('Failed to load structure. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic for ADD
    const filteredPrograms = React.useMemo(() => {
        if (!selectedDepartment) return programs;
        return programs.filter(p => p.department_ids && p.department_ids.includes(selectedDepartment.value));
    }, [programs, selectedDepartment]);

    const filteredSemesters = React.useMemo(() => {
        if (!selectedProgram || !selectedProgram.duration_years) return semesters;
        const maxSemesters = selectedProgram.duration_years * 2;
        const sortedSemesters = [...semesters].sort((a, b) => {
            const numA = parseInt(a.semester_name.replace(/[^0-9]/g, ''), 10) || 0;
            const numB = parseInt(b.semester_name.replace(/[^0-9]/g, ''), 10) || 0;
            return numA - numB;
        });
        return sortedSemesters.slice(0, maxSemesters);
    }, [semesters, selectedProgram]);

    const filteredSubjects = React.useMemo(() => {
        if (!selectedDepartment) return subjects;
        return subjects.filter(s => s.department_ids && s.department_ids.includes(selectedDepartment.value));
    }, [subjects, selectedDepartment]);

    useEffect(() => {
        if (selectedDepartment) {
            setSelectedProgram(null);
            setSelectedSubject(null);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedProgram) setSelectedSemester(null);
    }, [selectedProgram]);


    const addComponent = () => {
        setComponents([...components, { id: Date.now(), name: '', maxMarks: '', passingMarks: '' }]);
    };

    const removeComponent = (compId) => {
        setComponents(components.filter(c => c.id !== compId));
    };

    const updateComponent = (compId, field, value) => {
        setComponents(components.map(c =>
            c.id === compId ? { ...c, [field]: value } : c
        ));
    };

    const handleSaveConfig = async () => {
        if (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment || !selectedSubject) {
            return toast.warning("Please select all mapping fields.");
        }

        const invalidComponents = components.some(c => !c.name || !c.maxMarks || !c.passingMarks);
        if (invalidComponents || components.length === 0) {
            return toast.warning("Please fill all fields for components.");
        }

        setSaving(true);
        try {
            const collegeId = localStorage.getItem('collegeId');

            for (let comp of components) {
                await collegeAdminApi.saveMarksStructure({
                    college_id: collegeId,
                    policy_id: selectedPolicy.value,
                    program_id: selectedProgram.value,
                    semester_id: selectedSemester.value,
                    department_id: selectedDepartment.value,
                    subject_id: selectedSubject.value,
                    component_name: comp.name,
                    max_marks: comp.maxMarks,
                    passing_marks: comp.passingMarks
                });
            }

            toast.success("Marks structure saved successfully!");
            navigate('/college-admin/marks-config');
        } catch (err) {
            toast.error("Failed to save marks configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStructure = async () => {
        if (!editingStructure.component_name || !editingStructure.max_marks || !editingStructure.passing_marks) {
            return toast.warning("Please fill in all component details");
        }
        setSaving(true);
        try {
            await collegeAdminApi.updateMarksStructure(editingStructure.id, editingStructure);
            toast.success("Marks structure updated successfully");
            navigate('/college-admin/marks-config');
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
                        onClick={() => navigate('/college-admin/marks-config')}
                        className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <BookOpenCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">
                            {isEditing ? 'Edit Marks Structure' : 'New Internal Marks Structure'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {isEditing ? 'Update the component details' : 'Configure IA and Practical max marks and passing criteria'}
                        </p>
                    </div>
                </div>

                <div className="p-10">
                    {!isEditing ? (
                        <div className="space-y-8">
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
                                    <label className="text-sm font-bold text-slate-700 ml-1">Program</label>
                                    <Select
                                        options={filteredPrograms.map(p => ({ value: p.id, label: p.name, duration_years: p.duration_years }))}
                                        value={selectedProgram}
                                        onChange={setSelectedProgram}
                                        placeholder="Program"
                                        styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                                        isDisabled={!selectedDepartment}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                                    <Select
                                        options={filteredSemesters.map(s => ({ value: s.id, label: s.semester_name }))}
                                        value={selectedSemester}
                                        onChange={setSelectedSemester}
                                        placeholder="Semester"
                                        styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                                        isDisabled={!selectedProgram}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                                    <Select
                                        options={filteredSubjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
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
                                        {components.map((comp) => (
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Component Name</label>
                                    <input 
                                        type="text"
                                        value={editingStructure.component_name} 
                                        onChange={(e) => setEditingStructure({...editingStructure, component_name: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                        placeholder="e.g., IA1, Final Exam"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 ml-1">Max Marks</label>
                                        <input 
                                            type="number"
                                            value={editingStructure.max_marks} 
                                            onChange={(e) => setEditingStructure({...editingStructure, max_marks: e.target.value})}
                                            className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 ml-1">Passing Marks</label>
                                        <input 
                                            type="number"
                                            value={editingStructure.passing_marks} 
                                            onChange={(e) => setEditingStructure({...editingStructure, passing_marks: e.target.value})}
                                            className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-[2.5rem]">
                    <button 
                        onClick={() => navigate('/college-admin/marks-config')} 
                        disabled={saving}
                        className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={isEditing ? handleUpdateStructure : handleSaveConfig} 
                        disabled={saving || (!isEditing && (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment || !selectedSubject))}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isEditing ? 'Update Structure' : 'Save Framework'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
export default MarksConfigForm;
