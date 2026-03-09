import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

const MarksReview = () => {
    const { subjectId, section } = useParams();
    const navigate = useNavigate();
    
    const [marksData, setMarksData] = useState([]);
    const [marksStructure, setMarksStructure] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLocking, setIsLocking] = useState(false);
    
    // Extracted subject metadata
    const [subjectMeta, setSubjectMeta] = useState(null);

    useEffect(() => {
        fetchReviewData();
    }, [subjectId, section]);

    const fetchReviewData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const collegeId = userStr ? JSON.parse(userStr).college_id : 1;

            // 1. Fetch Marks Structure 
            const structureRes = await fetch(`http://localhost:8080/api/college-admin/marks-structure/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let structData = [];
            if (structureRes.ok) structData = await structureRes.json();
            setMarksStructure(structData);

            // 2. Fetch Review Marks (Raw data grouped by student)
            const reviewRes = await fetch(`http://localhost:8080/api/college-admin/review-marks?subject_id=${subjectId}&section=${section}&college_id=${collegeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                setMarksData(reviewData);
            }

            // 3. Setup basic subject meta (could fetch more details from subject API)
            setSubjectMeta({ id: subjectId, section: section, collegeId });

        } catch (err) {
            toast.error("Failed to load marks for review");
        } finally {
            setLoading(false);
        }
    };

    const handleLockMarks = async () => {
        if (!window.confirm("WARNING: Locking marks will freeze this section and determine Pass/Fail statuses permanently. Are you sure you want to proceed?")) {
            return;
        }

        setIsLocking(true);
        try {
            const token = localStorage.getItem('token');
            // Assuming academic_year and semester_id are needed, could be fetched or hardcoded for now if not in route
            const res = await fetch(`http://localhost:8080/api/college-admin/lock-marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectMeta.id,
                    section: subjectMeta.section,
                    college_id: subjectMeta.collegeId,
                    semester_id: 1, // Placeholder
                    academic_year_id: 1 // Placeholder
                })
            });

            if (res.ok) {
                toast.success("Marks Locked Successfully! Best of 3 generated.");
                navigate('/admin/marks-verification');
            } else {
                toast.error("Failed to lock marks");
            }
        } catch (err) {
            toast.error("An error occurred while locking marks");
        } finally {
            setIsLocking(false);
        }
    };

    // Calculate Best of 3 client-side just for preview display
    const calculatePreview = (studentMarks) => {
        let iaScores = [];
        let practicalScore = 0;
        let passMarkEntry = marksStructure.find(c => c.component_name === 'Total' || c.component_name === 'Best_of_3');
        let passMark = passMarkEntry ? parseFloat(passMarkEntry.passing_marks) : 40;

        studentMarks.forEach(m => {
            const struct = marksStructure.find(s => s.id === m.component_id);
            if (!struct) return;
            
            const score = m.is_absent ? 0 : parseFloat(m.marks_obtained);
            
            if (struct.component_name.toUpperCase().includes('IA')) {
                iaScores.push(score);
            } else if (struct.component_name.toUpperCase().includes('PRACTICAL')) {
                practicalScore = score;
            }
        });

        iaScores.sort((a,b) => b - a);
        const bestOf3 = (iaScores[0] || 0) + (iaScores[1] || 0);
        const total = bestOf3 + practicalScore;
        const isPass = total >= passMark;

        return { bestOf3, practicalScore, total, isPass, passMark };
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/marks-verification')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm">
                    <ArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Review & Lock Marks</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Verify submitted marks and confirm Best of 3 calculation before finalizing.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : marksData.length === 0 ? (
                 <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <p className="text-slate-500 font-medium">No marks data found for this section.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-bold text-sm">
                            <AlertCircle size={16} />
                            Preview Mode: Best of 3 will be officially calculated upon Locking
                        </div>
                    </div>

                    <div className="overflow-x-auto text-slate-700">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 border-r border-slate-200 z-10">Student</th>
                                    {marksStructure.map(comp => (
                                        <th key={comp.id} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                                            {comp.component_name}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-xs font-black text-indigo-500 bg-indigo-50 uppercase tracking-widest text-center border-l-2 border-indigo-100">Calculated Best 2/3</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Practical</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-800 uppercase tracking-widest text-center border-l border-slate-200">Total</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Result Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {marksData.map((student) => {
                                    const preview = calculatePreview(student.marks);

                                    return (
                                        <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 sticky left-0 bg-white border-r border-slate-100 z-10 w-64">
                                                <p className="text-sm font-bold text-slate-800 truncate">{student.student_name}</p>
                                                <p className="text-xs text-slate-500">{student.rollnumber || `ID: ${student.student_id}`}</p>
                                            </td>

                                            {marksStructure.map(comp => {
                                                const mEntry = student.marks.find(m => m.component_id === comp.id);
                                                return (
                                                    <td key={comp.id} className="px-6 py-4 text-center">
                                                        {mEntry ? (
                                                            <span className={`font-medium ${mEntry.is_absent ? 'text-red-500' : 'text-slate-700'}`}>
                                                                {mEntry.is_absent ? 'AB' : mEntry.marks_obtained}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            <td className="px-6 py-4 text-center border-l-2 border-indigo-50 bg-indigo-50/30">
                                                <span className="text-sm font-black text-indigo-600">{preview.bestOf3}</span>
                                            </td>
                                            
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700">{preview.practicalScore}</span>
                                            </td>

                                            <td className="px-6 py-4 text-center border-l border-slate-100">
                                                <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                                                    {preview.total}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black uppercase tracking-widest ${preview.isPass ? 'text-green-500' : 'text-red-500'}`}>
                                                    {preview.isPass ? 'PASS' : 'FAIL'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center z-20 sticky bottom-0">
                         <div className="text-sm text-slate-500 max-w-xl">
                            <span className="font-bold text-amber-600 block mb-1">Important Note</span>
                            Once you lock these marks, they cannot be modified by the faculty. The system will permanently write the Best of 3 calculations to the database.
                        </div>
                        <button
                            disabled={isLocking}
                            onClick={handleLockMarks}
                            className={`inline-flex items-center gap-2 px-10 py-4 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-sm
                                ${isLocking ? 'bg-amber-400 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] shadow-amber-500/20 active:scale-[0.98]'}`}
                        >
                            {isLocking ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <ShieldCheck size={20} />
                            )}
                            <span>{isLocking ? 'Locking...' : 'Lock Marks & Process'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarksReview;
