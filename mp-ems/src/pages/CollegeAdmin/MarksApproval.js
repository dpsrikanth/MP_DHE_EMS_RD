import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { FileText, CheckCircle2, XCircle, Search, Lock } from "lucide-react";

const MarksApproval = () => {
    const [workflows, setWorkflows] = useState([]);
    const [semesters, setSemesters] = useState([]);

    const [selectedSemester, setSelectedSemester] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSemesters();
        fetchWorkflows();
    }, []);

    const fetchSemesters = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/masters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSemesters(data.semesters || []);
            }
        } catch (err) {
            console.error('Failed to load semesters');
        }
    };

    const fetchWorkflows = async (semesterId = null) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const collegeId = localStorage.getItem('collegeId');

            let url = `http://localhost:8080/api/college-admin/workflow-status?college_id=${collegeId}`;
            if (semesterId) url += `&semester_id=${semesterId}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkflows(data || []);
            }
        } catch (err) {
            toast.error("Failed to fetch workflow status");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (selected) => {
        setSelectedSemester(selected);
        fetchWorkflows(selected ? selected.value : null);
    };

    const updateStatus = async (workflowId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistic update
            setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: newStatus } : w));

            // In a real scenario, you'd send specific workflow details or just the id
            const workflow = workflows.find(w => w.id === workflowId);
            if (!workflow) return;

            await fetch('http://localhost:8080/api/college-admin/workflow-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    college_id: workflow.college_id,
                    subject_id: workflow.subject_id,
                    semester_id: workflow.semester_id,
                    academic_year_id: workflow.academic_year_id,
                    section: workflow.section,
                    status: newStatus
                })
            });

            toast.success(`Marks status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
            fetchWorkflows(selectedSemester ? selectedSemester.value : null); // revert
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Submitted': return 'bg-blue-100 text-blue-700';
            case 'Verified': return 'bg-purple-100 text-purple-700';
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Locked': return 'bg-slate-200 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading && workflows.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Marks Verification & Approval</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Review and lock internal marks submitted by faculty.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full sm:max-w-xs">
                        <Select
                            options={semesters.map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedSemester}
                            onChange={handleFilterChange}
                            placeholder="Filter by Semester"
                            isClearable
                            styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full sm:w-auto text-slate-400 focus-within:text-slate-600 focus-within:border-indigo-500 transition-colors">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Subject ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Semester / Sec</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Last Updated</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workflows.map((wf) => (
                                <tr key={wf.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        Sub #{wf.subject_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        Sem {wf.semester_id} <span className="text-slate-400">|</span> Sec {wf.section}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${getStatusStyle(wf.status)}`}>
                                            {wf.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium tracking-tight">
                                        {new Date(wf.updated_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {wf.status !== 'Locked' && (
                                            <div className="flex items-center justify-end gap-2">
                                                {wf.status === 'Submitted' && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Verified')}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                {wf.status === 'Verified' && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Approved')}
                                                        className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {wf.status === 'Approved' && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Locked')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-bold shadow-md shadow-slate-900/20 transition-all"
                                                    >
                                                        <Lock size={12} /> Lock
                                                    </button>
                                                )}
                                                {/* Rejection/Reject to previous state could also be added here */}
                                                {(wf.status === 'Submitted' || wf.status === 'Verified') && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Pending')}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {wf.status === 'Locked' && (
                                            <span className="inline-flex items-center gap-1 text-slate-400 text-sm font-bold">
                                                <Lock size={14} /> Read-only
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {workflows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 size={32} className="text-slate-300" />
                                            <p className="text-sm font-bold uppercase tracking-widest mt-2">No workflows found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MarksApproval;
