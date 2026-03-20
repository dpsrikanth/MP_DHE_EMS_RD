import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Save, Plus, Trash2, Info, 
  Settings, BarChart3, ChevronRight, AlertTriangle
} from "lucide-react";
import { toast } from 'react-toastify';

const GradingPolicy = () => {
    const [config, setConfig] = useState({
        grade_scale: [],
        pass_threshold: 40,
        calculate_sgpa_on_earned_only: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [universities, setUniversities] = useState([]);
    const [selectedUni, setSelectedUni] = useState("");
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isHighLevelAdmin = user.role === 'superAdmin' || user.role === 'admin';

    useEffect(() => {
        if (isHighLevelAdmin) {
            fetchUniversities();
        } else {
            fetchConfig();
        }
    }, []);

    const fetchUniversities = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/universities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUniversities(data);
                if (data.length > 0) {
                    setSelectedUni(data[0].id);
                }
            }
        } catch (error) {
            console.error("Fetch universities error:", error);
        }
    };

    useEffect(() => {
        if (selectedUni || !isHighLevelAdmin) {
            fetchConfig();
        }
    }, [selectedUni]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:8080/api/grading/config';
            if (isHighLevelAdmin && selectedUni) {
                url += `?targetUniversityId=${selectedUni}`;
            }
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Ensure grade_scale is an array and sorted
                const scale = Array.isArray(data.grade_scale) ? data.grade_scale : [];
                setConfig({
                    ...data,
                    grade_scale: scale.sort((a, b) => b.min - a.min)
                });
            } else {
                toast.error("Failed to load grading configuration");
            }
        } catch (error) {
            console.error("Fetch config error:", error);
            toast.error("An error occurred while fetching configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        const newRow = { min: 0, grade: '', points: 0 };
        setConfig(prev => ({
            ...prev,
            grade_scale: [...prev.grade_scale, newRow].sort((a, b) => b.min - a.min)
        }));
    };

    const handleRemoveRow = (index) => {
        const newScale = config.grade_scale.filter((_, i) => i !== index);
        setConfig(prev => ({ ...prev, grade_scale: newScale }));
    };

    const handleScaleChange = (index, field, value) => {
        const newScale = [...config.grade_scale];
        newScale[index][field] = field === 'grade' ? value.toUpperCase() : Number(value);
        setConfig(prev => ({ ...prev, grade_scale: newScale }));
    };

    const handleSave = async () => {
        // Validation
        if (config.grade_scale.length === 0) {
            return toast.warning("Grade scale cannot be empty");
        }
        
        const hasEmpty = config.grade_scale.some(r => !r.grade || r.min === undefined);
        if (hasEmpty) {
            return toast.warning("Please fill all grade details");
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8080/api/grading/config', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...config,
                    targetUniversityId: isHighLevelAdmin ? selectedUni : undefined
                })
            });

            if (res.ok) {
                toast.success("Grading policy updated successfully");
                fetchConfig();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update configuration");
            }
        } catch (error) {
            console.error("Save config error:", error);
            toast.error("An error occurred during save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading university policy...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 shadow-sm border border-sky-500/20">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">University Grading Policy</h1>
                        <p className="text-slate-500 font-medium">Configure how grades, points, and SGPA are calculated.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {isHighLevelAdmin && (
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select University</label>
                            <select 
                                value={selectedUni}
                                onChange={(e) => setSelectedUni(e.target.value)}
                                className="h-14 pl-5 pr-10 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer shadow-sm shadow-slate-200/50"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
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
                        className="inline-flex items-center gap-2 px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-auto"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                        <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Grade Scale Editor */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} />
                                Grade Scale Definitions
                            </h3>
                            <button 
                                onClick={handleAddRow}
                                className="inline-flex items-center gap-2 text-xs font-black text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors border border-sky-100"
                            >
                                <Plus size={14} />
                                Add Grade
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-8 py-4">Min. Marks (%)</th>
                                        <th className="px-8 py-4">Letter Grade</th>
                                        <th className="px-8 py-4">Grade Points</th>
                                        <th className="px-8 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {config.grade_scale.map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="number" 
                                                    value={row.min} 
                                                    onChange={(e) => handleScaleChange(index, 'min', e.target.value)}
                                                    className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-700 focus:bg-white focus:border-sky-500 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="text" 
                                                    value={row.grade} 
                                                    onChange={(e) => handleScaleChange(index, 'grade', e.target.value)}
                                                    placeholder="A+, O, F etc."
                                                    className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-700 focus:bg-white focus:border-sky-500 outline-none transition-all uppercase"
                                                />
                                            </td>
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="number" 
                                                    step="0.1"
                                                    value={row.points} 
                                                    onChange={(e) => handleScaleChange(index, 'points', e.target.value)}
                                                    className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-700 focus:bg-white focus:border-sky-500 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <button 
                                                    onClick={() => handleRemoveRow(index)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Settings size={16} />
                                Result Parameters
                            </h3>
                            
                            <div className="space-y-3 font-semibold">
                                <label className="text-sm text-slate-700 ml-1">Overall Pass Threshold (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={config.pass_threshold}
                                        onChange={(e) => setConfig({ ...config, pass_threshold: Number(e.target.value) })}
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-lg font-black text-sky-600 outline-none focus:bg-white focus:border-sky-500 transition-all font-mono"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black">PERCENT</div>
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed px-2">
                                    Students scoring below this cumulative percentage will be marked as "FAIL".
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <h4 className="text-sm font-bold text-slate-900">Exclude Fails from SGPA</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">Calculate SGPA only using earned credits (Pass subjects).</p>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, calculate_sgpa_on_earned_only: !config.calculate_sgpa_on_earned_only })}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.calculate_sgpa_on_earned_only ? 'bg-sky-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.calculate_sgpa_on_earned_only ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4">
                            <AlertTriangle size={24} className="text-amber-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Important Notice</p>
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed tracking-tight uppercase">
                                    Changes to these settings will immediately affect all student results, including those already generated and finalized.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-sky-900 rounded-[2rem] p-8 text-white space-y-4 shadow-xl shadow-sky-900/20">
                         <div className="flex items-center gap-3">
                            <Info size={20} className="text-sky-400" />
                            <h4 className="font-black text-sm uppercase tracking-widest">Logic Guide</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-sky-800 flex items-center justify-center text-xs font-black text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">1</div>
                                <p className="text-[10px] font-medium leading-relaxed opacity-80 flex-1">
                                    Grades are assigned by checking which range the student's marks fall into, starting from highest to lowest threshold.
                                </p>
                            </div>
                            <div className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-sky-800 flex items-center justify-center text-xs font-black text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">2</div>
                                <p className="text-[10px] font-medium leading-relaxed opacity-80 flex-1">
                                    Grade points are used in the calculation of SGPA: Total (Points × Credits) / Total Credits.
                                </p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingPolicy;
