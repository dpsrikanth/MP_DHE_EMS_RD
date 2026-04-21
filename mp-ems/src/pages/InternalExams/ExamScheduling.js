import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Save, Clock, Search, BookOpen, GraduationCap } from 'lucide-react';

const ExamScheduling = () => {
    const [rounds, setRounds] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [subjects, setSubjects] = useState([]);
    
    const [availableContexts, setAvailableContexts] = useState({ programs: [], semesters: [], mapping: [] });
    
    const [filters, setFilters] = useState({
        round_id: '',
        program_id: '',
        semester_id: '',
        academic_year_id: ''
    });

    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState({
        init: true,
        subjects: false,
        saving: false,
        contexts: false
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Dynamic filtering logic: Fetch available programs/semesters when round changes
    useEffect(() => {
        if (filters.round_id) {
            fetchAvailableContexts(filters.round_id);
        } else {
            setAvailableContexts({ programs: [], semesters: [], mapping: [] });
        }
    }, [filters.round_id]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [roundsRes, programsRes, semestersRes, yearsRes] = await Promise.all([
                fetch(`${API_URL}/internal-exams/rounds`, { headers }),
                fetch(`${API_URL}/programs`, { headers }),
                fetch(`${API_URL}/semesters`, { headers }),
                fetch(`${API_URL}/academic-years`, { headers })
            ]);

            const roundsData = await roundsRes.json();
            const programsData = await programsRes.json();
            const semestersData = await semestersRes.json();
            const yearsData = await yearsRes.json();

            setRounds(roundsData);
            setPrograms(programsData);
            setSemesters(semestersData);
            setAcademicYears(yearsData);

            // Default to B.Tech if it exists
            const btech = programsData.find(p => 
                p.name.toLowerCase().includes('btech') || 
                p.name.toLowerCase().includes('b.tech') ||
                p.id === 2 // Legacy B.Tech ID
            );
            if (btech) {
                setFilters(prev => ({ ...prev, program_id: btech.id }));
            }

        } catch (error) {
            console.error("Initial fetch error:", error);
            toast.error("Failed to load configuration data");
        } finally {
            setLoading(prev => ({ ...prev, init: false }));
        }
    };

    const fetchAvailableContexts = async (roundId) => {
        try {
            setLoading(prev => ({ ...prev, contexts: true }));
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const res = await fetch(`${API_URL}/internal-exams/available-contexts?round_id=${roundId}`, { headers });
            const data = await res.json();
            
            // Assuming data is { programs: [id...], semesters: [id...], mapping: [{program_id, semester_id}...] }
            // If the backend doesn't return mapping yet, we'll just use the IDs for now as requested.
            setAvailableContexts({
                programs: data.programs || [],
                semesters: data.semesters || [],
                mapping: data.mapping || []
            });

            // If current program is not in available, reset it
            if (filters.program_id && data.programs && !data.programs.includes(parseInt(filters.program_id))) {
                setFilters(prev => ({ ...prev, program_id: '', semester_id: '' }));
            }

        } catch (error) {
            console.error("Error fetching contexts:", error);
        } finally {
            setLoading(prev => ({ ...prev, contexts: false }));
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            // Reset semester if program changes
            if (name === 'program_id') newFilters.semester_id = '';
            return newFilters;
        });
    };

    const fetchSubjectsAndSchedules = async () => {
        if (!filters.program_id || !filters.semester_id || !filters.round_id || !filters.academic_year_id) {
            toast.warning("Please select all filters");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, subjects: true }));
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch subjects and existing schedules
            const [subjectsRes, schedulesRes] = await Promise.all([
                fetch(`${API_URL}/subjects?program_id=${filters.program_id}&semester_id=${filters.semester_id}`, { headers }),
                fetch(`${API_URL}/internal-exams/schedules?round_id=${filters.round_id}&program_id=${filters.program_id}&semester_id=${filters.semester_id}&academic_year_id=${filters.academic_year_id}`, { headers })
            ]);
            
            const subjectsData = await subjectsRes.json();
            const schedulesData = await schedulesRes.json();

            setSubjects(subjectsData);

            const initialSchedules = {};
            schedulesData.forEach(s => {
                initialSchedules[s.subject_id] = {
                    exam_date: s.exam_date ? s.exam_date.split('T')[0] : '',
                    start_time: s.start_time,
                    end_time: s.end_time
                };
            });
            setSchedules(initialSchedules);

        } catch (error) {
            console.error("Fetch data error:", error);
            toast.error("Failed to load subjects or schedules");
        } finally {
            setLoading(prev => ({ ...prev, subjects: false }));
        }
    };

    const handleScheduleChange = (subjectId, field, value) => {
        setSchedules(prev => ({
            ...prev,
            [subjectId]: {
                ...(prev[subjectId] || { exam_date: '', start_time: '', end_time: '' }),
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        const scheduleArray = Object.entries(schedules)
            .filter(([_, data]) => data.exam_date) // Only save subjects with a date
            .map(([subjectId, data]) => ({
                subject_id: parseInt(subjectId),
                ...data
            }));

        if (scheduleArray.length === 0) {
            toast.warning("No dates assigned to any subjects");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, saving: true }));
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/internal-exams/schedules`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...filters,
                    schedules: scheduleArray
                })
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Schedules saved successfully!");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save schedules");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    if (loading.init) return <div className="p-8 text-center">Loading configuration...</div>;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Exam Scheduling</h1>
                            <p className="text-slate-500 text-sm">Schedule internal assessment dates for subjects</p>
                        </div>
                    </div>
                    {subjects.length > 0 && (
                        <button
                            onClick={handleSave}
                            disabled={loading.saving}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading.saving ? "Saving..." : "Save Schedule"}
                        </button>
                    )}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end mb-8">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Year</label>
                        <select name="academic_year_id" value={filters.academic_year_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                            <option value="">Select Year</option>
                            {academicYears.map(y => (
                                <option key={y.id} value={y.id}>
                                    {y.year_name || `${y.start_year}-${y.end_year}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Exam Round</label>
                        <select name="round_id" value={filters.round_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                            <option value="">Select Round</option>
                            {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Program</label>
                        <select name="program_id" value={filters.program_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                            <option value="">Select Program</option>
                            {programs
                                .filter(p => {
                                    if (!filters.round_id || availableContexts.programs.length === 0) return true;
                                    return availableContexts.programs.includes(p.id);
                                })
                                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            }
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Semester</label>
                        <select name="semester_id" value={filters.semester_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                            <option value="">Select Semester</option>
                            {semesters
                                .filter(s => {
                                    if (!filters.round_id || (availableContexts.programs.length === 0 && availableContexts.semesters.length === 0)) return true;
                                    
                                    // If we have mapping, filter strictly by (program, semester)
                                    if (availableContexts.mapping.length > 0 && filters.program_id) {
                                        return availableContexts.mapping.some(m => 
                                            m.program_id === parseInt(filters.program_id) && 
                                            m.semester_id === s.id
                                        );
                                    }
                                    
                                    // Fallback to just semester ID from the available list
                                    if (availableContexts.semesters.length > 0) {
                                        return availableContexts.semesters.includes(s.id);
                                    }

                                    return true;
                                })
                                .map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)
                            }
                        </select>
                    </div>
                    <button 
                        onClick={fetchSubjectsAndSchedules}
                        disabled={loading.subjects}
                        className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        <Search size={18} />
                        {loading.subjects ? 'Loading...' : 'Go'}
                    </button>
                </div>

                {subjects.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Exam Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Start Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">End Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((sub) => (
                                    <tr key={sub.id} className="border-b border-slate-50 hover:bg-indigo-50/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <BookOpen size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{sub.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono uppercase">{sub.subject_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <input 
                                                type="date"
                                                className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-600"
                                                value={schedules[sub.id]?.exam_date || ''}
                                                onChange={(e) => handleScheduleChange(sub.id, 'exam_date', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center bg-slate-50 rounded-lg px-3 group-focus-within:ring-2 ring-indigo-500/20">
                                                <Clock size={14} className="text-slate-400" />
                                                <input 
                                                    type="time" 
                                                    className="w-full bg-transparent border-none py-2 text-sm focus:ring-0 font-medium text-slate-600"
                                                    value={schedules[sub.id]?.start_time || ''}
                                                    onChange={(e) => handleScheduleChange(sub.id, 'start_time', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center bg-slate-50 rounded-lg px-3 group-focus-within:ring-2 ring-indigo-500/20">
                                                <Clock size={14} className="text-slate-400" />
                                                <input 
                                                    type="time" 
                                                    className="w-full bg-transparent border-none py-2 text-sm focus:ring-0 font-medium text-slate-600"
                                                    value={schedules[sub.id]?.end_time || ''}
                                                    onChange={(e) => handleScheduleChange(sub.id, 'end_time', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {subjects.length === 0 && !loading.subjects && (
                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <GraduationCap className="mx-auto text-slate-200 mb-4" size={64} />
                        <h3 className="text-lg font-bold text-slate-400">Ready to Schedule?</h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">Select the Round, Program, and Semester above to start assigning exam dates.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamScheduling;
