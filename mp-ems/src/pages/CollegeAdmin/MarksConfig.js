import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { BookOpenCheck, Save, Plus, Trash2, Pencil, X, BarChart3, Search } from "lucide-react";
import { TableSearch } from '../../components/TableControls';
import { getApiUrl } from '../../config';

const MarksConfig = () => {
    const [policies, setPolicies] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [savedStructures, setSavedStructures] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [editingStructure, setEditingStructure] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const filteredPrograms = React.useMemo(() => {
        if (!selectedDepartment) return programs;
        return programs.filter(p => p.department_ids && p.department_ids.includes(selectedDepartment.value));
    }, [programs, selectedDepartment]);

    const filteredSemesters = React.useMemo(() => {
        if (!selectedProgram || !selectedProgram.duration_years) return semesters;
        const maxSemesters = selectedProgram.duration_years * 2;
        // Sort semesters by the number in their name (e.g., "Semester 1" -> 1)
        const sortedSemesters = [...semesters].sort((a, b) => {
            const numA = parseInt(a.semester_name.replace(/[^0-9]/g, ''), 10) || 0;
            const numB = parseInt(b.semester_name.replace(/[^0-9]/g, ''), 10) || 0;
            return numA - numB;
        });
        return sortedSemesters.slice(0, maxSemesters);
    }, [semesters, selectedProgram]);

    const filteredSubjects = React.useMemo(() => {
        let filtered = subjects;
        
        // Filter by Department if selected
        if (selectedDepartment) {
            filtered = filtered.filter(s => s.department_ids && s.department_ids.includes(selectedDepartment.value));
        }
        
        // Filter by Program if selected
        if (selectedProgram) {
            filtered = filtered.filter(s => s.program_id === selectedProgram.value);
        }
        
        // Filter by Semester if selected
        if (selectedSemester) {
            filtered = filtered.filter(s => s.semester_id === selectedSemester.value);
        }
        
        return filtered;
    }, [subjects, selectedDepartment, selectedProgram, selectedSemester]);

    const filteredStructures = useMemo(() => {
        if (!searchQuery.trim()) return savedStructures;
        
        const query = searchQuery.toLowerCase();
        return savedStructures.filter(item => 
            (item.department_name?.toLowerCase().includes(query)) ||
            (item.program_name?.toLowerCase().includes(query)) ||
            (item.semester_name?.toLowerCase().includes(query)) ||
            (item.subject_name?.toLowerCase().includes(query)) ||
            (item.subject_code?.toLowerCase().includes(query)) ||
            (item.component_name?.toLowerCase().includes(query)) ||
            (String(item.max_marks).includes(query)) ||
            (String(item.passing_marks).includes(query))
        );
    }, [savedStructures, searchQuery]);

    useEffect(() => {
        if (selectedDepartment) {
            setSelectedProgram(null);
            setSelectedSubject(null);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedProgram) {
            setSelectedSemester(null);
        }
    }, [selectedProgram]);

    const [components, setComponents] = useState([
        { id: Date.now(), name: '', maxMarks: '', passingMarks: '' }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMasterData();
        fetchSavedStructures();
    }, []);

    const fetchSavedStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/college-admin/all-marks-structures'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedStructures(data);
            }
        } catch (err) {
            console.error('Failed to load saved marks structures', err);
        }
    };

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/masters'), {
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
                await fetch(getApiUrl('/college-admin/marks-structure'), {
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
            fetchSavedStructures();
            setComponents([{ id: Date.now(), name: '', maxMarks: '', passingMarks: '' }]);
            setSelectedSubject(null);
        } catch (err) {
            toast.error("Failed to save marks configuration");
        }
    };

    const handleDeleteClick = (struct) => {
        setDeleteTarget(struct);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/college-admin/marks-structure/${deleteTarget.id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Marks structure deleted successfully");
                fetchSavedStructures();
            } else {
                toast.error("Failed to delete marks structure");
            }
        } catch (err) {
            toast.error("An error occurred while deleting");
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleEditClick = (struct) => {
        setEditingStructure(struct);
        setShowEditModal(true);
    };

    const handleUpdateStructure = async () => {
        if (!editingStructure.component_name || !editingStructure.max_marks || !editingStructure.passing_marks) {
            return toast.warning("Please fill in all component details");
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/college-admin/marks-structure/${editingStructure.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingStructure)
            });
            if (res.ok) {
                toast.success("Marks structure updated successfully");
                setShowEditModal(false);
                fetchSavedStructures();
            } else {
                toast.error("Failed to update structure");
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

            {/* Saved Structures Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Configured Marks Structures</h2>
                        <p className="text-sm text-slate-500 mt-1">Currently saved internal marks components and criteria</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search structures..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100/60">
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Program & Sem</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Component Name</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Max Marks</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Passing Marks</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStructures.length > 0 ? (
                                filteredStructures.map((struct) => (
                                    <tr key={struct.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-600 font-medium bg-indigo-50/30">{struct.department_name}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-sky-700">{struct.program_name}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase mt-0.5">{struct.semester_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-800">{struct.subject_name}</span>
                                                <span className="text-xs font-bold text-slate-400 mt-0.5">{struct.subject_code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-indigo-600">{struct.component_name}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{struct.max_marks}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-emerald-600">{struct.passing_marks}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick({
                                                        id: struct.id,
                                                        policy_id: policies.find(p => p.name === struct.policy_name)?.id,
                                                        department_id: departments.find(d => d.name === struct.department_name)?.id,
                                                        program_id: programs.find(p => p.name === struct.program_name)?.id,
                                                        semester_id: semesters.find(s => s.semester_name === struct.semester_name)?.id,
                                                        subject_id: subjects.find(s => s.subject_code === struct.subject_code)?.id,
                                                        component_name: struct.component_name,
                                                        max_marks: struct.max_marks,
                                                        passing_marks: struct.passing_marks
                                                    })}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Edit Structure"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(struct)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Delete Structure"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <BarChart3 size={32} className="text-slate-200" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                {searchQuery ? "No structures found matching your search" : "No structures found"}
                                            </p>
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 underline uppercase tracking-tighter mt-2"
                                                >
                                                    Clear Search
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingStructure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden pointer-events-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Edit Marks Structure</h3>
                                <p className="text-xs text-slate-500 font-medium">Update the component details</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-white hover:bg-slate-200 text-slate-400 rounded-xl transition-colors border border-slate-200 shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Component Name</label>
                                    <input 
                                        type="text"
                                        value={editingStructure.component_name} 
                                        onChange={(e) => setEditingStructure({...editingStructure, component_name: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
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
                                            className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 ml-1">Passing Marks</label>
                                        <input 
                                            type="number"
                                            value={editingStructure.passing_marks} 
                                            onChange={(e) => setEditingStructure({...editingStructure, passing_marks: e.target.value})}
                                            className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleUpdateStructure} className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all">Update Structure</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                Are you sure you want to delete this marks structure? This action cannot be reversed.
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

export default MarksConfig;
