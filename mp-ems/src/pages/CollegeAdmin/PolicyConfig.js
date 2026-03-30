import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ShieldCheck, Save, Pencil, Trash2, X, Search } from "lucide-react";
import { TableSearch } from '../../components/TableControls';

const PolicyConfig = () => {
    const [policies, setPolicies] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [savedMappings, setSavedMappings] = useState([]);

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const [editingMapping, setEditingMapping] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
        if (!selectedDepartment) return subjects;
        return subjects.filter(s => s.department_ids && s.department_ids.includes(selectedDepartment.value));
    }, [subjects, selectedDepartment]);

    const filteredMappings = useMemo(() => {
        if (!searchQuery.trim()) return savedMappings;
        
        const query = searchQuery.toLowerCase();
        return savedMappings.filter(item => 
            (item.policy_name?.toLowerCase().includes(query)) ||
            (item.department_name?.toLowerCase().includes(query)) ||
            (item.program_name?.toLowerCase().includes(query)) ||
            (item.semester_name?.toLowerCase().includes(query)) ||
            (item.subject_name?.toLowerCase().includes(query)) ||
            (item.subject_code?.toLowerCase().includes(query))
        );
    }, [savedMappings, searchQuery]);

    useEffect(() => {
        if (selectedDepartment) {
            setSelectedProgram(null);
            setSelectedSubjects([]);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedProgram) {
            setSelectedSemester(null);
        }
    }, [selectedProgram]);



    useEffect(() => {
        fetchMasterData();
        fetchSavedMappings();
    }, []);

    const fetchSavedMappings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/college-admin/policy-mappings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedMappings(data);
            }
        } catch (err) {
            console.error('Failed to load saved mappings', err);
        }
    };

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
            setSelectedSubjects([]);
            fetchSavedMappings(); // Refresh the table after saving

        } catch (err) {
            toast.error("Failed to save mapping");
        }
    };

    const handleDeleteClick = (mapping) => {
        setDeleteTarget(mapping);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/policy-mappings/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Mapping deleted successfully");
                fetchSavedMappings();
            } else {
                toast.error("Failed to delete mapping");
            }
        } catch (err) {
            toast.error("An error occurred while deleting");
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleEditClick = (mapping) => {
        setEditingMapping(mapping);
        setShowEditModal(true);
    };

    const handleUpdateMapping = async () => {
        if (!editingMapping.policy_id || !editingMapping.program_id || !editingMapping.semester_id || !editingMapping.department_id || !editingMapping.subject_id) {
            return toast.warning("Please ensure all fields are selected");
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/policy-mappings/${editingMapping.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingMapping)
            });
            if (res.ok) {
                toast.success("Mapping updated successfully");
                setShowEditModal(false);
                fetchSavedMappings();
            } else {
                toast.error("Failed to update mapping");
            }
        } catch (err) {
            toast.error("An error occurred while updating");
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
                        <label className="text-sm font-bold text-slate-700 ml-1">Program</label>
                        <Select
                            options={filteredPrograms.map(p => ({ value: p.id, label: p.name, duration_years: p.duration_years }))}
                            value={selectedProgram}
                            onChange={setSelectedProgram}
                            placeholder="Select Program"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                            isDisabled={!selectedDepartment}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Semester</label>
                        <Select
                            options={filteredSemesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedSemester}
                            onChange={setSelectedSemester}
                            placeholder="Select Semester"
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.2rem', borderColor: '#e2e8f0' }) }}
                            isDisabled={!selectedProgram}
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
                                options={filteredSubjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
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

            {/* Saved Mappings Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Configured Mappings</h2>
                        <p className="text-sm text-slate-500 mt-1">Currently saved policies and subject combinations</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search mappings..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100/60">
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Policy</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Program & Sem</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMappings.length > 0 ? (
                                filteredMappings.map((map) => (
                                    <tr key={map.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-800">{map.policy_name}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-medium bg-amber-50/30">{map.department_name}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-sky-700">{map.program_name}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase mt-0.5">{map.semester_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-800">{map.subject_name}</span>
                                                <span className="text-xs font-bold text-slate-400 mt-0.5">{map.subject_code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick({
                                                        id: map.id,
                                                        policy_id: policies.find(p => p.name === map.policy_name)?.id,
                                                        department_id: departments.find(d => d.name === map.department_name)?.id,
                                                        program_id: programs.find(p => p.name === map.program_name)?.id,
                                                        semester_id: semesters.find(s => s.semester_name === map.semester_name)?.id,
                                                        subject_id: subjects.find(s => s.subject_code === map.subject_code)?.id
                                                    })}
                                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                                                    title="Edit Mapping"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(map)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Delete Mapping"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 px-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldCheck size={32} className="text-slate-200" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                {searchQuery ? "No mappings found matching your search" : "No mappings found"}
                                            </p>
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="text-xs font-black text-sky-600 hover:text-sky-700 underline uppercase tracking-tighter mt-2"
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
            {showEditModal && editingMapping && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden pointer-events-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Edit Policy Mapping</h3>
                                <p className="text-xs text-slate-500 font-medium">Update the subject to policy relationship</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 bg-white hover:bg-slate-200 text-slate-400 rounded-xl transition-colors border border-slate-200 shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Policy</label>
                                    <select 
                                        value={editingMapping.policy_id} 
                                        onChange={(e) => setEditingMapping({...editingMapping, policy_id: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Policy</option>
                                        {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Department</label>
                                    <select 
                                        value={editingMapping.department_id} 
                                        onChange={(e) => setEditingMapping({...editingMapping, department_id: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Program</label>
                                    <select 
                                        value={editingMapping.program_id} 
                                        onChange={(e) => setEditingMapping({...editingMapping, program_id: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Semester</label>
                                    <select 
                                        value={editingMapping.semester_id} 
                                        onChange={(e) => setEditingMapping({...editingMapping, semester_id: e.target.value})}
                                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Semester</option>
                                        {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Subject</label>
                                <select 
                                    value={editingMapping.subject_id} 
                                    onChange={(e) => setEditingMapping({...editingMapping, subject_id: e.target.value})}
                                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleUpdateMapping} className="px-5 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition-all">Update Mapping</button>
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
                                Are you sure you want to delete this mapping? This action cannot be reversed.
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

export default PolicyConfig;
