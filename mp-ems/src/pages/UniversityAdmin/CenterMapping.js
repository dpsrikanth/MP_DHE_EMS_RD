import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Building2, MapPin, Search, Save, ArrowRight, ShieldCheck, Info, Users, AlertTriangle } from "lucide-react";

const CenterMapping = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/university-admin/center-mapping', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setColleges(data);
            } else {
                toast.error("Failed to fetch college mappings");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateMapping = async (collegeId, centerId) => {
        setUpdating(collegeId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/university-admin/center-mapping/${collegeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sitting_center_id: centerId })
            });

            if (res.ok) {
                toast.success("Center mapping updated");
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Update failed");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setUpdating(null);
        }
    };

    const filteredColleges = colleges.filter(c => 
        c.college_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.college_code && c.college_code.toString().includes(searchQuery))
    );

    return (
        <div className="p-8 space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Center Allocation</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 uppercase">Mandatory External Center Mapping</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search institution..." 
                        className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Info size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Allocation Policy</h3>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        To maintain examination integrity, all students of a college must be allocated to an external "Sitting Center". 
                        The sitting center's available capacity will be validated against its own requirements plus all mapped institutions.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution (Home)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Home Students</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Load / Seat Limit</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Sitting Center</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredColleges.map((college) => {
                                const totalLoad = Number(college.total_assigned_students);
                                const capacity = Number(college.internal_capacity);
                                const isOverCapacity = totalLoad > capacity;
                                const utilization = capacity > 0 
                                    ? Math.round((totalLoad / capacity) * 100) 
                                    : (totalLoad > 0 ? 101 : 0);

                                return (
                                    <tr key={college.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">{college.college_name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code: {college.college_code || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black rounded-lg">{college.student_count}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black ${isOverCapacity ? 'text-red-600' : 'text-slate-900'}`}>
                                                        {totalLoad}
                                                    </span>
                                                    <span className="text-slate-400 font-bold">/</span>
                                                    <span className="text-xs font-bold text-slate-500">{capacity} Seats</span>
                                                    {isOverCapacity && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                                </div>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${isOverCapacity ? 'bg-red-500' : utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                                    ></div>
                                                </div>
                                                {isOverCapacity && (
                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 animate-pulse italic">
                                                        Shortage: {totalLoad - capacity} Seats
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                        <select 
                                            className="w-full max-w-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            value={college.sitting_center_id || ''}
                                            onChange={(e) => handleUpdateMapping(college.id, e.target.value)}
                                            disabled={updating === college.id}
                                        >
                                            <option value="">Unassigned (Self-Center)</option>
                                            {colleges
                                                .filter(c => c.id !== college.id)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.college_name}</option>
                                                ))
                                            }
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-right text-slate-400">
                                        {updating === college.id ? (
                                            <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Auto Saved</span>
                                                <Save size={14} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CenterMapping;
