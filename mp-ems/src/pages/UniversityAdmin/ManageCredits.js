import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Save, Info, 
  Search, BookOpen, GraduationCap, AlertTriangle
} from "lucide-react";
import { toast } from 'react-toastify';
import { masterDataApi } from '../../api/masterDataApi';
import { marksApi } from '../../api/marksApi';

const ManageCredits = () => {
    const [config, setConfig] = useState({
        subject_credits: {}
    });
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Selector state (reusing the high-level admin logic)
    const [universities, setUniversities] = useState([]);
    const [selectedUni, setSelectedUni] = useState("");
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleName = localStorage.getItem('roleName') || '';
    const isSuperOrAdmin = user.role === 'superadmin' || user.role === 'superAdmin' || user.role === 'admin' || roleName === 'superadmin' || roleName === 'superAdmin' || roleName === 'admin';
    const isUniversityAdmin = user.role === 'university_admin' || roleName === 'university_admin';
    const isHighLevelAdmin = isSuperOrAdmin; // Only super/system admins get the full editable university dropdown

    useEffect(() => {
        if (isSuperOrAdmin) {
            fetchUniversities();
        } else if (isUniversityAdmin) {
            fetchOwnUniversity();
        } else {
            fetchInitialData();
        }
    }, []);

    const fetchUniversities = async () => {
        try {
            const data = await masterDataApi.getUniversities();
            if (data) {
                setUniversities(data);
                if (data.length > 0) {
                    setSelectedUni(data[0].id);
                }
            }
        } catch (error) {
            console.error("Fetch universities error:", error);
        }
    };

    const fetchOwnUniversity = async () => {
        try {
            const uniId = localStorage.getItem('universityId') || user.university_id;
            // Fetch all universities and filter to this admin's university
            const data = await masterDataApi.getUniversities();
            if (data) {
                const myUni = uniId ? data.filter(u => String(u.id) === String(uniId)) : data.slice(0, 1);
                setUniversities(myUni);
                const resolvedId = uniId || (myUni.length > 0 ? String(myUni[0].id) : '');
                setSelectedUni(resolvedId);
            } else {
                if (uniId) setSelectedUni(uniId);
                fetchInitialData();
            }
        } catch (error) {
            console.error("Fetch own university error:", error);
            fetchInitialData();
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchSubjects(), fetchConfig()]);
        setLoading(false);
    };

    useEffect(() => {
        if (selectedUni) {
            fetchInitialData();
        }
    }, [selectedUni]);

    const fetchSubjects = async () => {
        try {
            const data = await masterDataApi.getSubjects();
            if (data) {
                setSubjects(data);
            }
        } catch (error) {
            console.error("Fetch subjects error:", error);
        }
    };

    const fetchConfig = async () => {
        try {
            const targetUniversityId = (isSuperOrAdmin || isUniversityAdmin) && selectedUni ? selectedUni : undefined;
            const data = await marksApi.getGradingConfig(targetUniversityId);
            if (data) {
                setConfig(data);
            }
        } catch (error) {
            console.error("Fetch config error:", error);
        }
    };

    const handleCreditChange = (subjectId, value) => {
        setConfig(prev => ({
            ...prev,
            subject_credits: {
                ...prev.subject_credits,
                [subjectId]: value === "" ? undefined : Number(value)
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await marksApi.saveGradingConfig({
                ...config,
                targetUniversityId: (isSuperOrAdmin || isUniversityAdmin) ? selectedUni : undefined
            });

            if (data) {
                toast.success("Subject credits updated successfully");
                fetchConfig();
            } else {
                toast.error("Failed to update configuration");
            }
        } catch (error) {
            console.error("Save config error:", error);
            toast.error(error.response?.data?.message || "An error occurred during save");
        } finally {
            setSaving(false);
        }
    };

    const filteredSubjects = subjects.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.program_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading subject data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-500/20">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">University Subject Credits</h1>
                        <p className="text-slate-500 font-medium">Manage and override credits for specific subjects.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {(isSuperOrAdmin || isUniversityAdmin) && universities.length > 0 && (
                        <div className="flex flex-col">
                            <label className="text-[12px] font-black text-slate-400  tracking-widest mb-1.5 ml-1">
                                {isSuperOrAdmin ? 'Select University' : 'University'}
                            </label>
                            <select 
                                value={selectedUni}
                                onChange={(e) => isSuperOrAdmin && setSelectedUni(e.target.value)}
                                disabled={!isSuperOrAdmin}
                                className={`h-14 pl-5 pr-10 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none transition-all appearance-none shadow-sm shadow-slate-200/50 ${isSuperOrAdmin ? 'cursor-pointer focus:border-indigo-500' : 'cursor-default opacity-80'}`}
                                style={{ backgroundImage: isSuperOrAdmin ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'%3E%3C/path%3E%3C/svg%3E")` : 'none', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                            >
                                {universities.map(uni => (
                                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-auto"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                        <span>{saving ? 'Saving Changes...' : 'Save Credits'}</span>
                    </button>
                </div>
            </div>

            {/* Toolbar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Search subjects by name, code or program..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                    <GraduationCap size={18} />
                    <span className="text-[13px] font-black  tracking-wider">{subjects.length} Subjects Total</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[12px] font-black  tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-8 py-5">Subject Info</th>
                                <th className="px-8 py-5">Program & Semester</th>
                                <th className="px-8 py-5">Global Credits</th>
                                <th className="px-8 py-5">University Override</th>
                                <th className="px-8 py-5">Effective Credits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSubjects.map((sub) => {
                                const overrideValue = config.subject_credits?.[sub.id];
                                const isOverridden = overrideValue !== undefined;
                                const effectiveValue = isOverridden ? overrideValue : sub.credit;

                                return (
                                    <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 leading-tight">{sub.name}</span>
                                                <span className="text-[12px] font-bold text-slate-400  tracking-wider">{sub.subject_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-600">{sub.program_name}</span>
                                                <span className="text-[12px] font-medium text-slate-400">{sub.semester_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-[13px] ring-1 ring-inset ring-slate-200">
                                                {sub.credit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                placeholder="None"
                                                value={overrideValue ?? ""} 
                                                onChange={(e) => handleCreditChange(sub.id, e.target.value)}
                                                className={`w-24 h-10 border rounded-xl px-4 text-sm font-black outline-none transition-all ${isOverridden ? 'bg-indigo-50 border-indigo-200 text-indigo-600 focus:bg-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-400 focus:bg-white focus:border-indigo-500'}`}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-[13px] shadow-sm ${isOverridden ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'}`}>
                                                {effectiveValue}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white space-y-6 shadow-xl shadow-indigo-600/20">
                <div className="flex items-center gap-3">
                    <Info size={24} className="text-indigo-400" />
                    <h4 className="font-black text-lg  tracking-widest">About Credit Overrides</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex gap-4 group">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[13px] font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">1</div>
                            <p className="text-[13px] font-medium leading-relaxed opacity-80 flex-1">
                                These overrides allow your university to use its own credit system for subjects without affecting the global master data.
                            </p>
                        </div>
                        <div className="flex gap-4 group">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[13px] font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">2</div>
                            <p className="text-[13px] font-medium leading-relaxed opacity-80 flex-1">
                                If no override is provided, the subject will default to its **Global Credits** value.
                            </p>
                        </div>
                    </div>
                    <div className="bg-indigo-500/10 rounded-2xl p-6 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <AlertTriangle size={18} />
                            <span className="text-[13px] font-black  tracking-tight">Calculation Impact</span>
                        </div>
                        <p className="text-[12px] font-bold text-indigo-200 leading-relaxed  tracking-tight">
                            Changing credits will affect SGPA and CGPA calculations for all students enrolled in these subjects within your university.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCredits;
