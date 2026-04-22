import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, CheckCircle, XCircle, BookOpen, Clock, Download, 
  LayoutDashboard, Search, GraduationCap, CheckCircle2 
} from 'lucide-react';
import { useGradingPolicy } from '../../hooks/useGradingPolicy';
import { getGradeAndPoints, isPass, calculateSGPA } from '../../utils/gradingUtils';
import { toast } from 'react-toastify';
import { TableSearch } from '../../components/TableControls';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { config: gradingConfig, loading: configLoading } = useGradingPolicy();
  const [error, setError] = useState(null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [searchQuery, setSearchQuery] = useState('');
  const [resultTypeFilter, setResultTypeFilter] = useState('external');
  const [selectedSemester, setSelectedSemester] = useState('All');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/student/results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
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

      return {
        ...group,
        subjects: filteredSubjects,
        hasMatches: filteredSubjects.length > 0,
        sgpa: group.totalCreditsAssigned > 0 ? (group.totalCiGi / group.totalCreditsAssigned).toFixed(2) : '0.00'
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
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-1">
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
             <a href="/student/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 whitespace-nowrap">
                <LayoutDashboard size={16} /> Return to Home
             </a>
        </div>
      </div>

      {/* Tab Switcher & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setResultTypeFilter('external')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              resultTypeFilter === 'external'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            🌐 Final Results
          </button>
          <button
            onClick={() => setResultTypeFilter('internal')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer transition-all hover:bg-white min-w-[140px]"
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
           <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tighter">
             {searchQuery ? "No matching records" : "No Published Statements"}
           </h3>
           <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
             {searchQuery ? "Try refining your search terms to find specific courses." : "Your examination results will be visible here once they are officially released."}
           </p>
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="mt-6 text-xs font-black text-emerald-600 hover:text-emerald-700 underline uppercase tracking-widest"
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
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Associated Institution</p>
                       <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">{series.college_name}</h2>
                    </div>
                 </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      {series.exam_type === 1 ? (
                        <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-[10px] font-black uppercase tracking-widest">Internal Assessment</span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">OFFICIALLY FINALIZED</span>
                      )}
                    </div>
                    {series.exam_type !== 1 && (
                      <button 
                        onClick={() => window.open(`/student/result-sheet/${encodeURIComponent(series.exam_name)}`, '_blank')}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 group"
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
                      <tr className="text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-violet-100">
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
                      {series.subjects.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-violet-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-400 text-xs">{sIdx + 1}</td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-black text-slate-900">{sub.subject_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub.subject_code}</p>
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
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-violet-50/30 border-t border-violet-100">
                    <p className="text-[10px] text-slate-400 font-medium italic">
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
                    <tr className="text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">
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
                        <td className="px-6 py-4 font-bold text-slate-400 text-xs">{sIdx + 1}</td>
                        <td className="px-4 py-4 font-black text-slate-900 text-xs uppercase tracking-wider">{sub.subject_code}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">{sub.subject_name}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-600 text-xs">{sub.creditsAssigned}</td>
                        <td className="px-4 py-4 text-center font-black text-emerald-600 text-xs">{sub.creditsEarned}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-900 text-sm italic">{sub.total_marks}</td>
                        <td className="px-4 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black ${sub.isPass ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'} uppercase tracking-tight`}>
                             {sub.grade}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-700 text-xs">{sub.gradePoint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Physical Marksheet Summary Footer */}
              <div className="p-8 bg-slate-50/30 border-t border-slate-200">
                 <div className="grid grid-cols-2 md:grid-cols-6 border border-slate-300 rounded-xl overflow-hidden shadow-lg shadow-slate-200/20">
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Credits Reg.</p>
                       <p className="text-xl font-black text-slate-900 tracking-tight">{series.totalCreditsAssigned}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Credits Earned</p>
                       <p className="text-xl font-black text-emerald-600 tracking-tight">{series.totalCreditsEarned}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-white text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2 italic">Cumulative Credits</p>
                       <p className="text-xl font-black text-slate-400 tracking-tight">N/A</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-emerald-500 text-white text-center">
                       <p className="text-[9px] font-black opacity-80 uppercase mb-2">Σ(Ci x Gi)</p>
                       <p className="text-xl font-black tracking-tighter">{series.totalCiGi}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-200 bg-slate-900 text-white text-center">
                       <p className="text-[9px] font-black opacity-60 uppercase mb-2 italic">Semester SGPA</p>
                       <p className="text-2xl font-black text-emerald-400 tracking-tight">{series.sgpa}</p>
                    </div>
                    <div className="p-4 border-b border-slate-200 bg-slate-900 text-white text-center">
                       <p className="text-[9px] font-black opacity-60 uppercase mb-2 italic tracking-widest">CGPA</p>
                       <p className="text-2xl font-black text-slate-500 tracking-tight">N/A</p>
                    </div>
                 </div>

                 <div className="mt-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-slate-100 border-dashed">
                    <div className="max-w-md">
                       <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                          Note: This Performance Statement is for informational purposes only. Official Degree Certificates are issued upon successful completion of the academic program. 
                          Σ(Ci x Gi) indicates Sum of (Credits Assigned x Grade Points Secured).
                       </p>
                    </div>
                    <div className="flex flex-col items-center">
                       <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 border border-slate-200 relative overflow-hidden">
                          <CheckCircle2 size={48} className="text-emerald-500/20" />
                          <div className="absolute inset-0 flex items-center justify-center italic font-black text-[8px] text-slate-300 uppercase tracking-widest -rotate-45">Digital Sign</div>
                       </div>
                       <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Controller of Exams</p>
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
    </div>
  );
};

export default StudentResults;
