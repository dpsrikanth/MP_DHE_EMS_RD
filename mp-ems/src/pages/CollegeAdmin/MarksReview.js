import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShieldCheck, AlertCircle, MessageSquare, X, Send, Lock } from 'lucide-react';

const MarksReview = () => {
    const { subjectId, section } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Context from navigation state
    const semesterId = location.state?.semester_id || 1;
    const academicYearId = location.state?.academic_year_id || 1;

    const [marksData, setMarksData] = useState([]);
    const [marksStructure, setMarksStructure] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLocking, setIsLocking] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Review Modal States
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isGraceOpen, setIsGraceOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [graceMarks, setGraceMarks] = useState(0);
    const [graceReason, setGraceReason] = useState('');
    const [studentsGraceMarks, setStudentsGraceMarks] = useState({});
    const [isSavingReview, setIsSavingReview] = useState(false);

    // Extracted subject metadata
    const [subjectMeta, setSubjectMeta] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleName = localStorage.getItem('roleName');
    const isHOD = roleName === 'HOD';
    const isCollegeAdmin = roleName === 'college_admin';

    useEffect(() => {
        fetchReviewData();
    }, [subjectId, section]);

    const fetchReviewData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const collegeId = user.college_id;

            // 1. Fetch Marks Structure 
            const structureRes = await fetch(`http://localhost:8080/api/college-admin/marks-structure/${subjectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let structData = [];
            if (structureRes.ok) structData = await structureRes.json();
            setMarksStructure(structData);

            // 2. Fetch Review Marks (Raw data grouped by student)
            const reviewRes = await fetch(`http://localhost:8080/api/college-admin/review-marks?subject_id=${subjectId}&section=${section}&college_id=${collegeId}&semester_id=${semesterId}&academic_year_id=${academicYearId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                setMarksData(reviewData);
            }

            // 3. Setup basic subject meta (could fetch more details from subject API)
            setSubjectMeta({ id: subjectId, section: section, collegeId, status: '' });

            // 4. Fetch status
            const workflowRes = await fetch(`http://localhost:8080/api/college-admin/workflow-status?college_id=${collegeId}&semester_id=${semesterId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (workflowRes.ok) {
                const workflows = await workflowRes.json();
                const currentWf = workflows.find(w => w.subject_id.toString() === subjectId.toString() && w.section === section);
                if (currentWf) {
                    setSubjectMeta(prev => ({ ...prev, status: currentWf.status }));
                }
            }

        } catch (err) {
            toast.error("Failed to load marks for review");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveSection = async () => {
        toast.info("Approving section...");

        setIsLocking(true); // Reusing isLocking for loading state
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/workflow-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectId,
                    section: section,
                    college_id: subjectMeta.collegeId,
                    semester_id: semesterId,
                    academic_year_id: academicYearId,
                    status: 'Approved'
                })
            });

            if (res.ok) {
                const result = await res.json();
                if (result.status === 'Rejected') {
                    toast.warning("Section rejected due to individual student rejections. Sent back to faculty.");
                } else {
                    toast.success("Section approved successfully!");
                }
                navigate('/hod/marks-approval');
            } else {
                toast.error("Failed to approve section");
            }
        } catch (err) {
            toast.error("Error approving section");
        } finally {
            setIsLocking(false);
        }
    };

    const handleLockMarks = async () => {
        toast.info("Locking marks and calculating results...");

        setIsLocking(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/lock-marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectId,
                    section: section,
                    college_id: subjectMeta.collegeId,
                    semester_id: semesterId,
                    academic_year_id: academicYearId,
                    studentsGraceMarks: studentsGraceMarks
                })
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(result.message || "Marks locked and synced successfully!");
                setTimeout(() => {
                    navigate('/college-admin/marks-approval');
                }, 2000);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to lock marks");
            }
        } catch (err) {
            toast.error("Error locking marks");
        } finally {
            setIsLocking(false);
        }
    };

    const handleRejectWorkflow = async () => {
        toast.info("Rejecting section and sending back to faculty...");

        setIsRejecting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/reject-workflow-section`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectId,
                    section: section,
                    college_id: subjectMeta.collegeId,
                    semester_id: semesterId,
                    academic_year_id: academicYearId
                })
            });

            if (res.ok) {
                toast.success("Section rejected and sent back to faculty.");
                navigate(isHOD ? '/hod/marks-approval' : '/admin/marks-verification');
            } else {
                toast.error("Failed to reject section");
            }
        } catch (err) {
            toast.error("Error rejecting section");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleSendBackToCollege = async () => {
        if (!window.confirm(`Send correction request back to College Admin for review?`)) return;
        setIsRejecting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/send-back-correction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectId,
                    section: section,
                    college_id: subjectMeta.collegeId,
                    semester_id: semesterId,
                    academic_year_id: academicYearId
                })
            });
            if (res.ok) {
                toast.success("Correction request sent to College Admin!");
                navigate('/admin/marks-verification');
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to send back to college");
            }
        } catch (error) {
            toast.error("Error sending correction to college");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleOpenGrace = (student) => {
        setSelectedStudent(student);
        setGraceMarks(studentsGraceMarks[student.student_id]?.marks || 0);
        setGraceReason(studentsGraceMarks[student.student_id]?.reason || '');
        setIsGraceOpen(true);
    };

    const handleSaveGrace = () => {
        setStudentsGraceMarks(prev => ({
            ...prev,
            [selectedStudent.student_id]: { marks: graceMarks, reason: graceReason }
        }));
        setIsGraceOpen(false);
        toast.success(`Grace marks updated for ${selectedStudent.student_name}`);
    };

    const handleOpenReview = (student) => {
        console.log("Opening review modal for student:", student);
        setSelectedStudent(student);
        setReviewComment(student.review_comment || '');
        setIsReviewOpen(true);
    };

    const handleSaveReview = async (status) => {
        console.log(`handleSaveReview triggered with status: ${status}`);
        console.log("Selected student:", selectedStudent);
        setIsSavingReview(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/college-admin/save-student-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    subject_id: subjectId,
                    section: section,
                    student_id: selectedStudent.student_id,
                    college_id: subjectMeta.collegeId,
                    semester_id: semesterId,
                    academic_year_id: academicYearId,
                    status: status,
                    comment: reviewComment
                })
            });

            if (res.ok) {
                toast.success(`Student marks marked as ${status}`);
                setIsReviewOpen(false);
                fetchReviewData(); // Refresh
            } else {
                toast.error("Failed to save review");
            }
        } catch (err) {
            toast.error("Error saving review");
        } finally {
            setIsSavingReview(false);
        }
    };

    // Calculate Best of 3 client-side just for preview display
    const calculatePreview = (studentMarks) => {
        let iaScores = [];
        let practicalScore = 0;
        let iaPassMarks = [];
        let practicalPassMark = 0;

        studentMarks.forEach(m => {
            const struct = marksStructure.find(s => s.id === m.component_id);
            if (!struct) return;

            const score = m.is_absent ? 0 : parseFloat(m.marks_obtained);

            if (struct.component_name.toUpperCase().includes('IA')) {
                iaScores.push(score);
                iaPassMarks.push(parseFloat(struct.passing_marks || 0));
            } else if (struct.component_name.toUpperCase().includes('PRACTICAL')) {
                practicalScore = score;
                practicalPassMark = parseFloat(struct.passing_marks || 0);
            }
        });

        // Best of IA passing marks (usually same, but for robustness)
        iaPassMarks.sort((a, b) => b - a);
        const passMark = (iaPassMarks[0] || 0) + (iaPassMarks[1] || 0) + practicalPassMark;

        iaScores.sort((a, b) => b - a);
        const bestOf3 = (iaScores[0] || 0) + (iaScores[1] || 0);
        
        const grace = studentsGraceMarks[studentMarks[0]?.student_id]?.marks || 0;
        const total = bestOf3 + practicalScore + parseFloat(grace);
        const isPass = total >= passMark;

        return { bestOf3, practicalScore, total, isPass, passMark, grace };
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/marks-approval')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm">
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
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Grace Marks</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Action / Status</th>
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
                                            <td className="px-6 py-4 text-center">
                                                {(isHOD || isCollegeAdmin) && subjectMeta?.status !== 'Locked' ? (
                                                    <button
                                                        onClick={() => handleOpenGrace(student)}
                                                        className={`p-2 rounded-lg transition-colors flex flex-col items-center gap-1 hover:scale-[1.05] ${studentsGraceMarks[student.student_id]?.marks > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        <ShieldCheck size={16} />
                                                        <span className="text-[8px] font-black">{studentsGraceMarks[student.student_id]?.marks > 0 ? `+${studentsGraceMarks[student.student_id].marks}` : 'ADD GRACE'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-700">{studentsGraceMarks[student.student_id]?.marks || 0}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isCollegeAdmin ? (
                                                    <div className={`p-2 rounded-lg flex flex-col items-center gap-1 cursor-default ${subjectMeta?.status === 'Locked' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {subjectMeta?.status === 'Locked' ? <Lock size={16} /> : <ShieldCheck size={16} />}
                                                        <span className="text-[8px] font-black">{subjectMeta?.status === 'Locked' ? 'LOCKED' : 'READY TO LOCK'}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenReview(student)}
                                                        className={`p-2 rounded-lg transition-colors flex flex-col items-center gap-1 hover:scale-[1.05] ${student.review_status === 'Rejected' ? 'bg-red-50 text-red-600' :
                                                                student.review_status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        <MessageSquare size={16} />
                                                        <span className="text-[8px] font-black">{student.review_status || 'REVIEW'}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center z-20 sticky bottom-0">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-slate-500 max-w-xl">
                                <span className="font-bold text-amber-600 block mb-1">Important Note</span>
                                {isHOD ?
                                    "Approving this section will notify the College Admin that marks are ready for final locking. You will still be able to view these marks." :
                                    "Once you lock these marks, they cannot be modified by the faculty. The system will permanently write the Best of 3 calculations to the database."
                                }
                            </div>
                            {isHOD && !['Approved', 'Locked'].includes(subjectMeta?.status) && (
                                <button
                                    disabled={isRejecting}
                                    onClick={handleRejectWorkflow}
                                    className="inline-flex items-center gap-2 text-red-500 font-bold text-xs hover:underline"
                                >
                                    <AlertCircle size={14} />
                                    Reject Section & Send Back to Faculty
                                </button>
                            )}
                        </div>
                        {isHOD && subjectMeta?.status === 'Correction Requested' ? (
                            <div className="flex gap-4">
                                <button
                                    disabled={isRejecting}
                                    onClick={handleSendBackToCollege}
                                    className="inline-flex items-center gap-2 px-6 py-4 bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all uppercase tracking-widest text-xs"
                                    title="Send back to college (Scenario 2)"
                                >
                                    <Send size={18} />
                                    Send to College
                                </button>
                                <button
                                    disabled={isRejecting}
                                    onClick={handleRejectWorkflow}
                                    className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] transition-all uppercase tracking-widest text-sm"
                                    title="Approve request and let faculty edit (Scenario 1)"
                                >
                                    <Lock size={18} />
                                    Approve Correction (Allow Edit)
                                </button>
                            </div>
                        ) : isHOD && !['Approved', 'Locked'].includes(subjectMeta?.status) ? (
                            <div className="flex flex-col items-end gap-3">
                                <button
                                    disabled={isLocking}
                                    onClick={handleApproveSection}
                                    className={`inline-flex items-center gap-2 px-10 py-4 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-sm
                                        ${isLocking ? 'bg-amber-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] shadow-emerald-500/20 active:scale-[0.98]'}`}
                                >
                                    {isLocking ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <ShieldCheck size={20} />
                                    )}
                                    <span>{isLocking ? 'Approving...' : 'Verify & Approve Section'}</span>
                                </button>
                                <button
                                    disabled={isRejecting}
                                    onClick={handleRejectWorkflow}
                                    className="text-red-500 font-bold text-xs hover:underline flex items-center gap-1"
                                >
                                    <AlertCircle size={14} />
                                    Reject Section & Send Back to Faculty
                                </button>
                            </div>
                        ) : isCollegeAdmin && subjectMeta?.status !== 'Locked' && (
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
                        )}

                    </div>
                </div>
            )}

            {/* Review Modal */}
            {isReviewOpen && selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Review Student Marks</h3>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-500 font-medium">Student Details</p>
                                <p className="text-lg font-bold text-slate-900">{selectedStudent.student_name}</p>
                                <p className="text-xs text-slate-500">Roll No: {selectedStudent.rollnumber}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {selectedStudent.marks.map(m => {
                                    const struct = marksStructure.find(s => s.id === m.component_id);
                                    return (
                                        <div key={m.component_id} className="p-3 bg-white border border-slate-200 rounded-xl">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{struct?.component_name}</span>
                                            <span className={`text-sm font-black ${m.is_absent ? 'text-red-500' : 'text-slate-800'}`}>
                                                {m.is_absent ? 'AB' : m.marks_obtained}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-indigo-500" />
                                    Review Comments
                                </label>
                                <textarea
                                    className="w-full h-24 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                                    placeholder="Enter your observations or reason for rejection..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => handleSaveReview('Rejected')}
                                disabled={isSavingReview}
                                className="flex-1 py-3.5 bg-white border-2 border-red-500 text-red-600 font-black rounded-xl hover:bg-red-50 transition-all uppercase tracking-widest text-xs"
                            >
                                {isSavingReview ? 'Saving...' : 'Reject Marks'}
                            </button>
                            <button
                                onClick={() => handleSaveReview('Approved')}
                                disabled={isSavingReview}
                                className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} />
                                {isSavingReview ? 'Saving...' : 'Approve Marks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Grace Marks Modal */}
            {isGraceOpen && selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Add Grace Marks</h3>
                            <button onClick={() => setIsGraceOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-800">
                                <ShieldCheck size={24} />
                                <div>
                                    <p className="text-sm font-bold">Applying Grace Marks for {selectedStudent.student_name}</p>
                                    <p className="text-xs opacity-80">These marks will be added to the final internal total.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Grace Marks Value</label>
                                <input
                                    type="number"
                                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-lg font-bold"
                                    placeholder="0.00"
                                    value={graceMarks}
                                    onChange={(e) => setGraceMarks(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Reason for Grace Marks</label>
                                <textarea
                                    className="w-full h-24 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                                    placeholder="Enter reason (e.g., Medical issues, Special participation...)"
                                    value={graceReason}
                                    onChange={(e) => setGraceReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setIsGraceOpen(false)}
                                className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveGrace}
                                className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs"
                            >
                                Apply Grace Marks
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarksReview;
