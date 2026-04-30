import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import { ShieldCheck, Save, ArrowLeft } from "lucide-react";
import { getApiUrl } from '../../config';

const PolicyConfigForm = () => {
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

    // States for ADD (Multi)
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    // States for EDIT (Single)
    const [editingMapping, setEditingMapping] = useState({
        policy_id: '', department_id: '', program_id: '', semester_id: '', subject_id: ''
    });

    useEffect(() => {
        fetchMasterData().then((m) => {
            if (isEditing) fetchMappingDataEdit(m);
        });
    }, [id]);

    const fetchMasterData = async () => {
        try {
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
                return data;
            }
        } catch (err) {
            toast.error('Failed to load master data');
        }
        return null;
    };

    const fetchMappingDataEdit = async (masterData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/college-admin/policy-mappings'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mapping = data.find(m => m.id.toString() === id.toString());
                if (mapping && masterData) {
                    setEditingMapping({
                        id: mapping.id,
                        policy_id: masterData.policies.find(p => p.name === mapping.policy_name)?.id || '',
                        department_id: masterData.departments.find(d => d.name === mapping.department_name)?.id || '',
                        program_id: masterData.programs.find(p => p.name === mapping.program_name)?.id || '',
                        semester_id: masterData.semesters.find(s => s.semester_name === mapping.semester_name)?.id || '',
                        subject_id: masterData.subjects.find(s => s.subject_code === mapping.subject_code)?.id || ''
                    });
                } else {
                    toast.error("Mapping not found");
                    navigate('/college-admin/policy-config');
                }
            }
        } catch (err) {
            toast.error('Failed to load mapping. ' + err.message);
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
            setSelectedSubjects([]);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedProgram) setSelectedSemester(null);
    }, [selectedProgram]);


    const handleSaveMapping = async () => {
        if (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment) {
            return toast.warning("Please select Policy, Program, Semester, and Department");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            // 1. Map Program & Semester to Policy
            await fetch(getApiUrl('/college-admin/map-policy'), {
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
                    await fetch(getApiUrl('/college-admin/map-subject'), {
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
            navigate('/college-admin/policy-config');
        } catch (err) {
            toast.error("Failed to save mapping");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMapping = async () => {
        if (!editingMapping.policy_id || !editingMapping.program_id || !editingMapping.semester_id || !editingMapping.department_id || !editingMapping.subject_id) {
            return toast.warning("Please ensure all fields are selected");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl(`/college-admin/policy-mappings/${editingMapping.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingMapping)
            });
            if (res.ok) {
                toast.success("Mapping updated successfully");
                navigate('/college-admin/policy-config');
            } else {
                toast.error("Failed to update mapping");
            }
        } catch (err) {
            toast.error("An error occurred while updating");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center gap-5 sticky top-0 z-10 bg-white">
                    <button 
                        type="button"
                        onClick={() => navigate('/college-admin/policy-config')}
                        className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">
                            {isEditing ? 'Edit Policy Mapping' : 'New Policy Configuration'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {isEditing ? 'Update the subject to policy relationship' : 'Map academic policies to programs and semesters'}
                        </p>
                    </div>
                </div>

                <div className="p-10">
                    {!isEditing ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Policy</label>
                                    <select 
                                        value={editingMapping.policy_id} 
                                        onChange={(e) => setEditingMapping({...editingMapping, policy_id: e.target.value})}
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
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
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
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
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
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
                                        className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
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
                                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-[2.5rem]">
                    <button 
                        onClick={() => navigate('/college-admin/policy-config')} 
                        disabled={saving}
                        className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={isEditing ? handleUpdateMapping : handleSaveMapping} 
                        disabled={saving || (!isEditing && (!selectedPolicy || !selectedProgram || !selectedSemester || !selectedDepartment))}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isEditing ? 'Update Mapping' : 'Save Mapping'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
export default PolicyConfigForm;
