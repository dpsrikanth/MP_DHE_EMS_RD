import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { FileText, CheckCircle2, XCircle, Search, Lock, Eye, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const MarksApproval = () => {
    const [workflows, setWorkflows] = useState([]);
    const [semesters, setSemesters] = useState([]);

    const [selectedSemester, setSelectedSemester] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isHOD = user.role === 'HOD';
    const isCollegeAdmin = user.role === 'college_admin';

    useEffect(() => {
        fetchSemesters();
        fetchWorkflows();
    }, []);

    const fetchSemesters = async () => {
        try {
            const data = await masterDataApi.getMasters();
            setSemesters(data.semesters || []);
        } catch (err) {
            console.error('Failed to load semesters');
        }
    };

    const fetchWorkflows = async (semesterId = null) => {
        try {
            setLoading(true);
            const collegeId = user.college_id;

            const params = { college_id: collegeId };
            if (semesterId) params.semester_id = semesterId;

            const data = await collegeAdminApi.getWorkflowStatus(params);
            setWorkflows(data || []);
        } catch (err) {
            toast.error("Failed to fetch workflow status");
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkflows = useMemo(() => {
        let result = workflows;

        if (selectedSemester) {
            result = result.filter(wf => String(wf.semester_id) === String(selectedSemester.value));
        }

        if (!searchQuery.trim()) return result;
        
        const query = searchQuery.toLowerCase();
        return result.filter(wf => {
            const subjectMatch = (wf.subject_name?.toLowerCase().includes(query)) || 
                               (String(wf.subject_id).includes(query));
            const semesterMatch = (wf.semester?.toLowerCase().includes(query)) || 
                                (String(wf.semester_id).includes(query)) ||
                                (wf.section?.toLowerCase().includes(query));
            const statusMatch = wf.status?.toLowerCase().includes(query);
            const dateMatch = new Date(wf.updated_at).toLocaleString().toLowerCase().includes(query);
            
            return subjectMatch || semesterMatch || statusMatch || dateMatch;
        });
    }, [workflows, searchQuery, selectedSemester]);

    const handleFilterChange = (selected) => {
        setSelectedSemester(selected);
        fetchWorkflows(selected ? selected.value : null);
    };

    const updateStatus = async (workflowId, newStatus) => {
        console.log(`updateStatus triggered: workflowId=${workflowId}, newStatus=${newStatus}`);
        try {
            // Optimistic update
            setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: newStatus } : w));

            // In a real scenario, you'd send specific workflow details or just the id
            const workflow = workflows.find(w => w.id === workflowId);
            if (!workflow) return;

            await collegeAdminApi.updateWorkflowStatus({
                college_id: workflow.college_id,
                subject_id: workflow.subject_id,
                semester_id: workflow.semester_id,
                academic_year_id: workflow.academic_year_id,
                section: workflow.section,
                status: newStatus
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

    // HOD's responsibility ends at "Approved". Locking is a College Admin step.
    // For HOD, show 'Approved' when actual status is 'Locked' so the display
    // reflects the HOD's last action, not the College Admin's subsequent lock.
    const getDisplayStatus = (actualStatus) => {
        if (isHOD && actualStatus === 'Locked') return 'Approved';
        return actualStatus;
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
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Marks Monitoring & Locking</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Monitor approval status and perform final mark locking.</p>
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
                    <div className="flex-1 w-full sm:max-w-md ml-auto">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by subject, status, or date..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100">
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-500 ">Subject ID</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-500 ">Semester / Sec</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-500 ">Status</th>
                                <th className="px-6 py-4 text-[13px] font-bold text-slate-500 ">Last Updated</th>
                                <th className="px-6 py-4 text-right text-[13px] font-bold text-slate-500 ">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWorkflows.map((wf) => (
                                <tr key={wf.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        {wf.subject_name || `Sub #${wf.subject_id}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {wf.semester || `Sem ${wf.semester_id}`} <span className="text-slate-400">|</span> Sec {wf.section}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[13px] font-bold px-3 py-1 rounded-full  ${getStatusStyle(getDisplayStatus(wf.status))}`}>
                                            {getDisplayStatus(wf.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium tracking-tight">
                                        {wf.updated_at ? new Date(wf.updated_at).toLocaleString() : 'Not Started'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {wf.status === 'Locked' ? (
                                            <span className="inline-flex items-center gap-1 text-slate-400 text-sm font-bold">
                                                <Lock size={14} /> Read-only
                                            </span>
                                        ) : wf.status === 'Approved' && isHOD ? (
                                            // HOD: already approved — show badge only, no action needed
                                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[13px] font-bold border border-green-200">
                                                <CheckCircle2 size={12} /> Approved
                                            </span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                {/* HOD: Verify only when action is needed (Submitted / Rejected / Correction Requested) */}
                                                {isHOD && ['Submitted', 'Rejected', 'Correction Requested'].includes(wf.status) && (
                                                    <button
                                                        onClick={() => navigate(`/admin/marks-review/${wf.subject_id}/${wf.section}`, {
                                                            state: {
                                                                semester_id: wf.semester_id,
                                                                academic_year_id: wf.academic_year_id
                                                            }
                                                        })}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[13px] font-bold transition-colors"
                                                    >
                                                        <Eye size={12} /> Verify
                                                    </button>
                                                )}

                                                {/* HOD: Quick reject button on Submitted rows */}
                                                {isHOD && wf.status === 'Submitted' && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Pending')}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[13px] font-bold transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                )}

                                                {/* College Admin: Review button for non-Pending statuses */}
                                                {isCollegeAdmin && wf.status !== 'Pending' && (
                                                    <button
                                                        onClick={() => navigate(`/admin/marks-review/${wf.subject_id}/${wf.section}`, {
                                                            state: {
                                                                semester_id: wf.semester_id,
                                                                academic_year_id: wf.academic_year_id
                                                            }
                                                        })}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[13px] font-bold transition-colors"
                                                    >
                                                        <Eye size={12} /> Review
                                                    </button>
                                                )}

                                                {/* College Admin: Lock button once HOD approved */}
                                                {isCollegeAdmin && wf.status === 'Approved' && (
                                                    <button
                                                        onClick={() => updateStatus(wf.id, 'Locked')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-[13px] font-bold shadow-md shadow-slate-900/20 transition-all"
                                                    >
                                                        <Lock size={12} /> Lock Marks
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredWorkflows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 size={32} className="text-slate-300" />
                                            <p className="text-sm font-bold  tracking-widest mt-2">
                                                {searchQuery ? "No matching workflows found" : "No workflows found"}
                                            </p>
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="text-[13px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-tighter mt-2"
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
        </div>
    );
};

export default MarksApproval;
