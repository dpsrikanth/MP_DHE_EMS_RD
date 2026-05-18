import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, CheckCircle, XCircle, BookOpen, Clock, Download, 
  LayoutDashboard, Search, GraduationCap, CheckCircle2, AlertCircle, HelpCircle, MessageSquare
} from 'lucide-react';
import { useGradingPolicy } from '../../hooks/useGradingPolicy';
import { getGradeAndPoints, isPass, calculateSGPA } from '../../utils/gradingUtils';
import { toast } from 'react-toastify';
import { TableSearch } from '../../components/TableControls';
import { studentApi } from '../../api/studentApi';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { config: gradingConfig, loading: configLoading } = useGradingPolicy();
  const [error, setError] = useState(null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [searchQuery, setSearchQuery] = useState('');
  const [resultTypeFilter, setResultTypeFilter] = useState('external');
  const [selectedSemester, setSelectedSemester] = useState('All');

  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [discrepancyMessage, setDiscrepancyMessage] = useState('');
  const [reportedDiscrepancies, setReportedDiscrepancies] = useState([]);
  const [submittingDiscrepancy, setSubmittingDiscrepancy] = useState(false);

  useEffect(() => {
    fetchResults();
    fetchDiscrepancies();
  }, []);


  const fetchResults = async () => {
    try {
      const data = await studentApi.getResults();
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscrepancies = async () => {
    try {
      const data = await studentApi.getDiscrepancies();
      setReportedDiscrepancies(data);
    } catch (err) {
      console.error("Fetch discrepancies error:", err);
    }
  };

  const handleOpenDiscrepancyModal = (sub) => {
    setSelectedSubject(sub);
    const comps = sub.assessment_components || [];
    setSelectedComponent(comps.length > 0 ? comps[0].name : 'General');
    setDiscrepancyMessage('');
    setDiscrepancyModalOpen(true);
  };

  const handleSubmitDiscrepancy = async (e) => {
    e.preventDefault();
    if (!discrepancyMessage.trim()) {
      toast.error('Please enter discrepancy details');
      return;
    }
    setSubmittingDiscrepancy(true);
    try {
      await studentApi.submitDiscrepancy({
        subject_id: selectedSubject.subject_id,
        component_name: selectedComponent,
        message: discrepancyMessage
      });
      toast.success('Discrepancy reported successfully');
      setDiscrepancyModalOpen(false);
      fetchDiscrepancies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report discrepancy');
    } finally {
      setSubmittingDiscrepancy(false);
    }
  };


  const examSeriesResults = React.useMemo(() => {
    if (!gradingConfig) return [];
    
    const groups = {};
    results.forEach(record => {
      const key = record.exam_name;
      if (!groups[key]) {
        groups[key] = {
          exam_name: record.exam_name,
          exam_type: record.exam_type || 2, // default external if not present
          semester_name: record.semester_name,
          program_name: record.program_name,
          subjects: [],
          totalCiGi: 0,
          totalCreditsAssigned: 0,
          totalCreditsEarned: 0,
          college_name: record.college_name || 'Associated Institution'
        };
      }

      const marks = parseFloat(record.total_marks || 0);
      const { grade, gradePoint } = getGradeAndPoints(marks, gradingConfig.grade_scale);
      const subjectIsPass = isPass(marks, gradingConfig.pass_threshold);
      
      // Use override if exists
      const subjectId = record.subject_id || record.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const creditsAssigned = overrideCredits !== undefined ? parseFloat(overrideCredits) : parseFloat(record.credits || 0);
      const creditsEarned = subjectIsPass ? creditsAssigned : 0;
      const ciGi = gradePoint * creditsAssigned;

      groups[key].subjects.push({
        ...record,
        grade,
        gradePoint,
        creditsAssigned,
        creditsEarned,
        ciGi,
        isPass: subjectIsPass
      });

      groups[key].totalCiGi += ciGi;
      groups[key].totalCreditsAssigned += creditsAssigned;
      groups[key].totalCreditsEarned += creditsEarned;
    });
    
    // Calculate final stats and apply search filter to subjects
    const query = searchQuery.toLowerCase().trim();
    
    return Object.values(groups).map(group => {
      const allSubjects = group.subjects;
      const filteredSubjects = query ? allSubjects.filter(sub => {
        return (sub.subject_code || "").toLowerCase().includes(query) ||
               (sub.subject_name || "").toLowerCase().includes(query) ||
               String(sub.creditsAssigned).includes(query) ||
               String(sub.creditsEarned).includes(query) ||
               String(sub.total_marks || "").includes(query) ||
               sub.grade.toLowerCase().includes(query) ||
               String(sub.gradePoint).includes(query);
      }) : allSubjects;

        const hasGrace = allSubjects.some(s => parseFloat(s.grace_marks || 0) > 0);
        const hasFail = allSubjects.some(s => !s.isPass);
        let overallStatus = 'PASS';
        if (hasFail) overallStatus = 'FAIL';
        else if (hasGrace) overallStatus = 'PASS (GRACE)';

        return {
          ...group,
          subjects: filteredSubjects,
          hasMatches: filteredSubjects.length > 0,
          sgpa: group.totalCreditsAssigned > 0 ? (group.totalCiGi / group.totalCreditsAssigned).toFixed(2) : '0.00',
          overallStatus
        };
    }).filter(group => group.hasMatches); // Hide groups with no matching subjects
  }, [results, gradingConfig, searchQuery]);

  const availableSemesters = React.useMemo(() => {
    return Array.from(new Set(examSeriesResults.map(series => series.semester_name))).filter(Boolean).sort();
  }, [examSeriesResults]);

  // Filter series based on the selected tab and semester
  const filteredSeriesResults = React.useMemo(() => {
    return examSeriesResults.filter(series => {
      if (resultTypeFilter === 'internal' && series.exam_type !== 1) return false;
      if (resultTypeFilter === 'external' && series.exam_type === 1) return false;
      if (selectedSemester !== 'All' && series.semester_name !== selectedSemester) return false;
      return true;
    });
  }, [examSeriesResults, resultTypeFilter, selectedSemester]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-[12px]  tracking-[0.2em] mb-1">
            <Award size={14} /> Official Academic Record
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance <span className="text-emerald-500 italic">Statement</span></h1>
        </div>
        <div className="flex items-center gap-4">
             <div className="w-full md:w-64">
                <TableSearch 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Filter results..."
                />
             </div>
             <a href="/student/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[13px] hover:bg-slate-800 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap">
                <LayoutDashboard size={16} /> Return to Home
             </a>
        </div>
      </div>

      {/* Tab Switcher & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setResultTypeFilter('external')}
            className={`px-6 py-3 text-[13px] font-black  tracking-widest rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              resultTypeFilter === 'external'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            🌐 Final Results
          </button>
          <button
            onClick={() => setResultTypeFilter('internal')}
            className={`px-6 py-3 text-[13px] font-black  tracking-widest rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              resultTypeFilter === 'internal'
                ? 'border-violet-500 text-violet-600 bg-violet-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            📝 Internal Assessments
          </button>
        </div>

        {availableSemesters.length > 0 && (
          <div className="flex items-center gap-3 pb-3 sm:pb-0 pr-2">
            <span className="text-[12px] font-black text-slate-400  tracking-widest whitespace-nowrap">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer transition-all hover:bg-white min-w-[140px]"
            >
              <option value="All">All Semesters</option>
              {availableSemesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        )}
      </div>


      {filteredSeriesResults.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm">
           <Search size={40} className="text-slate-300 mx-auto mb-4" />
           <h3 className="text-lg font-black text-slate-900 mb-1  tracking-tighter">
             {searchQuery ? "No matching records" : "No Published Statements"}
           </h3>
           <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
             {searchQuery ? "Try refining your search terms to find specific courses." : "Your examination results will be visible here once they are officially released."}
           </p>
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="mt-6 text-[13px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-widest"
             >
               Clear All Filters
             </button>
           )}
        </div>
      ) : (
        <div className="space-y-12">
          {filteredSeriesResults.map((series, idx) => {
            const internalComponents = Array.from(new Set(series.subjects.flatMap(s => (s.assessment_components || []).filter(c => !c.name.toUpperCase().includes('PRACTICAL')).map(c => c.name)))).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
            const practicalComponents = Array.from(new Set(series.subjects.flatMap(s => (s.assessment_components || []).filter(c => c.name.toUpperCase().includes('PRACTICAL')).map(c => c.name)))).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
            
            return (
            <div key={idx} className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40 print:shadow-none print:border-slate-300">
              {/* College Header */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-emerald-500 shadow-sm">
                       <GraduationCap size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400  tracking-widest mb-0.5">Associated Institution</p>
                       <h2 className="text-sm font-black text-slate-900  tracking-tight">{series.college_name}</h2>
                    </div>
                 </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      {series.exam_type === 1 ? (
                        <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-[12px] font-black  tracking-widest">Internal Assessment</span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[12px] font-black  tracking-widest shadow-sm">OFFICIALLY FINALIZED</span>
                      )}
                    </div>
                    {series.exam_type !== 1 && (
                      <button 
                        onClick={() => window.open(`/student/result-sheet/${encodeURIComponent(series.exam_name)}`, '_blank')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[12px] font-black  tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-slate-800 transition-all flex items-center gap-2 group"
                      >
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> 
                        Download Statement
                      </button>
                    )}
                  </div>
                </div>

              {/* Internal Exam: Simple marks table — no grades/pass/fail */}
              {series.exam_type === 1 ? (
                <div className="p-0">
                  <table className="w-full border-collapse">
                    <thead className="bg-violet-50/60">
                      <tr className="text-left text-[12px] font-extrabold text-slate-500  tracking-widest border-b border-violet-100">
                        <th className="px-6 py-4">Sl. No.</th>
                        <th className="px-4 py-4">Subject</th>
                        {internalComponents.length > 0 ? (
                          internalComponents.map(comp => (
                            <th key={comp} className="px-4 py-4 text-center">{comp}</th>
                          ))
                        ) : (
                          <th className="px-4 py-4 text-center">Internal Marks</th>
                        )}
                        {practicalComponents.length > 0 ? (
                          practicalComponents.map(comp => (
                            <th key={comp} className="px-4 py-4 text-center">{comp}</th>
                          ))
                        ) : (
                          <th className="px-4 py-4 text-center">Practical Marks</th>
                        )}
                        <th className="px-4 py-4 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {series.subjects.map((sub, sIdx) => {
                        const subjectIssues = reportedDiscrepancies.filter(d => d.subject_id === sub.subject_id);
                        const pendingIssue = subjectIssues.find(d => d.status === 'Pending');
                        const resolvedIssue = subjectIssues.find(d => d.status === 'Resolved');
                        
                        return (
                          <tr key={sIdx} className="hover:bg-violet-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-400 text-[13px]">{sIdx + 1}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-black text-slate-900">{sub.subject_name}</p>
                                  <p className="text-[12px] font-bold text-slate-400 tracking-wider">{sub.subject_code}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {pendingIssue ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm">
                                      <AlertCircle size={10} />
                                      Issue Pending
                                    </span>
                                  ) : resolvedIssue ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-sm">
                                        <CheckCircle2 size={10} />
                                        Issue Resolved
                                      </span>
                                      <button
                                        onClick={() => handleOpenDiscrepancyModal(sub)}
                                        className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 hover:underline"
                                      >
                                        Report New
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenDiscrepancyModal(sub)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-violet-700 hover:text-white bg-violet-50 hover:bg-violet-600 border border-violet-100 hover:border-violet-600 rounded-lg transition-all duration-200 shadow-sm"
                                    >
                                      <MessageSquare size={12} />
                                      Report Issue
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            {internalComponents.length > 0 ? (
                            internalComponents.map(compName => {
                              const match = (sub.assessment_components || []).find(c => c.name === compName);
                              return (
                                <td key={compName} className="px-4 py-4 text-center">
                                  {match ? <span className="text-sm font-black text-violet-700">{match.marks}</span> : <span className="text-slate-300">-</span>}
                                </td>
                              );
                            })
                          ) : (
                            <td className="px-4 py-4 text-center">
                              {sub.batch_status === 'Locked' || sub.batch_status === 'Approved' ? (
                                <span className="text-sm font-black text-slate-700">{sub.internal_marks ?? '-'}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          )}
                          {practicalComponents.length > 0 ? (
                            practicalComponents.map(compName => {
                              const match = (sub.assessment_components || []).find(c => c.name === compName);
                              return (
                                <td key={compName} className="px-4 py-4 text-center">
                                  {match ? <span className="text-sm font-black text-emerald-700">{match.marks}</span> : <span className="text-slate-300">-</span>}
                                </td>
                              );
                            })
                          ) : (
                            <td className="px-4 py-4 text-center">
                              {sub.batch_status === 'Locked' || sub.batch_status === 'Approved' ? (
                                <span className="text-sm font-bold text-slate-500">{sub.external_marks > 0 ? sub.external_marks : '-'}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-4 text-center font-black text-violet-700 text-sm">{sub.total_marks}</td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-violet-50/30 border-t border-violet-100">
                    <p className="text-[12px] text-slate-400 font-medium italic">
                      Internal assessment marks are for informational purposes. These do not reflect final semester results. No pass/fail is determined at this stage.
                    </p>
                  </div>
                </div>
              ) : (
              <>
              {/* External: Full marks table with grades */}
              <div className="p-0">
                <table className="w-full border-collapse border-spacing-0">
                  <thead className="bg-slate-200/30">
                    <tr className="text-left text-[12px] font-extrabold text-slate-500  tracking-widest border-b border-slate-200">
                      <th className="px-6 py-4">Sl. No.</th>
                      <th className="px-4 py-4">Course Code</th>
                      <th className="px-4 py-4">Title of the Course Registered</th>
                      <th className="px-4 py-4 text-center">Credits Assigned</th>
                      <th className="px-4 py-4 text-center">Credits Earned (C)</th>
                      <th className="px-4 py-4 text-center">Total Marks</th>
                      <th className="px-4 py-4 text-center">Letter Grade</th>
                      <th className="px-6 py-4 text-right">Grade Point (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {series.subjects.map((sub, sIdx) => (
                      <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-400 text-[13px]">{sIdx + 1}</td>
                        <td className="px-4 py-4 font-black text-slate-900 text-[13px]  tracking-wider">{sub.subject_code}</td>
                        <td className="px-4 py-4 text-[13px] font-bold text-slate-700">{sub.subject_name}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-600 text-[13px]">{sub.creditsAssigned}</td>
                        <td className="px-4 py-4 text-center font-black text-emerald-600 text-[13px]">{sub.creditsEarned}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-900 text-sm italic">
                          {sub.total_marks}{parseFloat(sub.grace_marks || 0) > 0 ? '*' : ''}
                        </td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded text-[12px] font-black ${sub.isPass ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'}  tracking-tight`}>
                             {sub.grade}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-700 text-[13px]">{sub.gradePoint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Physical Marksheet Summary Footer */}
              <div className="p-8 bg-slate-50/30 border-t border-slate-200">
                 <div className="grid grid-cols-2 md:grid-cols-7 border border-slate-300 rounded-xl overflow-hidden shadow-lg shadow-slate-200/20">
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400  mb-2">Credits Reg.</p>
                       <p className="text-xl font-black text-slate-900 tracking-tight">{series.totalCreditsAssigned}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400  mb-2">Credits Earned</p>
                       <p className="text-xl font-black text-emerald-600 tracking-tight">{series.totalCreditsEarned}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400  mb-2 italic">Cumulative Credits</p>
                       <p className="text-xl font-black text-slate-400 tracking-tight">N/A</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-emerald-500 text-white text-center">
                       <p className="text-[9px] font-black opacity-80  mb-2">Σ(Ci x Gi)</p>
                       <p className="text-xl font-black tracking-tighter">{series.totalCiGi}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-indigo-600 text-white text-center">
                       <p className="text-[9px] font-black opacity-60  mb-2 italic">Semester SGPA</p>
                       <p className="text-2xl font-black text-emerald-400 tracking-tight">{series.sgpa}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-indigo-600 text-white text-center">
                       <p className="text-[9px] font-black opacity-60  mb-2 italic tracking-widest">CGPA</p>
                       <p className="text-2xl font-black text-slate-500 tracking-tight">N/A</p>
                    </div>
                    <div className={`p-4 border-b border-slate-200 text-center col-span-2 md:col-span-1 ${
                      series.overallStatus === 'FAIL' ? 'bg-red-600 text-white' : 
                      series.overallStatus === 'PASS (GRACE)' ? 'bg-emerald-600 text-white' : 
                      'bg-emerald-600 text-white'
                    }`}>
                       <p className="text-[9px] font-black opacity-80  mb-2">Final Result</p>
                        <div className="flex flex-col items-center">
                           <p className="text-xl font-black tracking-tight leading-none">
                             {series.overallStatus.includes('PASS') ? 'PASS' : 'FAIL'}
                           </p>
                           {series.overallStatus.includes('(GRACE)') && (
                             <p className="text-[8px] font-black opacity-70 mt-1 tracking-widest">(GRACE APPLIED)</p>
                           )}
                        </div>
                    </div>
                 </div>

                 <div className="mt-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-slate-100 border-dashed">
                    <div className="max-w-md">
                       <p className="text-[12px] text-slate-400 font-medium italic leading-relaxed">
                          Note: This Performance Statement is for informational purposes only. Official Degree Certificates are issued upon successful completion of the academic program. 
                          An asterisk (*) indicates that the subject marks include grace marks to reach the passing threshold.
                          Σ(Ci x Gi) indicates Sum of (Credits Assigned x Grade Points Secured).
                       </p>
                    </div>
                    <div className="flex flex-col items-center">
                       <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 border border-slate-200 relative overflow-hidden">
                          <CheckCircle2 size={48} className="text-emerald-500/20" />
                          <div className="absolute inset-0 flex items-center justify-center italic font-black text-[8px] text-slate-300  tracking-widest -rotate-45">Digital Sign</div>
                       </div>
                       <p className="text-[12px] text-slate-900 font-black  tracking-widest">Controller of Exams</p>
                    </div>
                 </div>
               </div>
              </>
              )}
            </div>
          );
        })}
        </div>
      )}
      {/* Premium Discrepancy Reporting Modal */}
      {discrepancyModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white relative">
              <button 
                onClick={() => setDiscrepancyModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200"
              >
                <XCircle size={20} />
              </button>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <AlertCircle size={22} className="text-violet-200 animate-pulse" />
                Report Marks Discrepancy
              </h3>
              <p className="text-[12px] font-bold text-violet-100 mt-2 uppercase tracking-widest">
                {selectedSubject.subject_name} ({selectedSubject.subject_code})
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitDiscrepancy} className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <HelpCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Please specify which assessment component has incorrect marks. Provide clear details (e.g. your actual marks vs. entered marks) to help the faculty verify.
                </p>
              </div>

              {/* Component Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Assessment Round / Component</label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                >
                  {selectedSubject.assessment_components && selectedSubject.assessment_components.length > 0 ? (
                    selectedSubject.assessment_components.map(c => (
                      <option key={c.name} value={c.name}>{c.name} (Current Marks: {c.marks})</option>
                    ))
                  ) : (
                    <option value="General">General / Total Internal Marks ({selectedSubject.internal_marks || 0})</option>
                  )}
                </select>
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Correction Details</label>
                <textarea
                  required
                  rows={4}
                  value={discrepancyMessage}
                  onChange={(e) => setDiscrepancyMessage(e.target.value)}
                  placeholder="E.g., I received 18 marks in IA1, but it is entered as 12 in the portal. Please verify my answer sheet."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDiscrepancyModalOpen(false)}
                  className="px-5 py-3 text-sm font-black text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscrepancy}
                  className="px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submittingDiscrepancy ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
