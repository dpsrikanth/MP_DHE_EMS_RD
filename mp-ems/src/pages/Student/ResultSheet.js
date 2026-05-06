import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ChevronLeft, GraduationCap, Calendar, Award, BookOpen, CheckCircle2, User, Building, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import authUtils from '../../utils/authUtils';
import { useGradingPolicy } from '../../hooks/useGradingPolicy';
import { getGradeAndPoints, isPass, calculateSGPA } from '../../utils/gradingUtils';
import { studentApi } from '../../api/studentApi';

const ResultSheet = () => {
  const { examName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const { config: gradingConfig, loading: configLoading } = useGradingPolicy();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultData();
  }, [examName]);

  const fetchResultData = async () => {
    try {
      const result = await studentApi.getResultSheet(examName);
      if (result) {
        setData(result);
      } else {
        toast.error('Failed to fetch Result Data');
      }
    } catch (error) {
      console.error('Error fetching result data:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const processedResults = useMemo(() => {
    if (!data || !data.results || !gradingConfig) return null;

    let totalCiGi = 0;
    let totalCreditsAssigned = 0;
    let totalCreditsEarned = 0;

    const subjects = data.results.map(record => {
      const marks = parseFloat(record.total_marks || 0);
      const { grade, gradePoint } = getGradeAndPoints(marks, gradingConfig.grade_scale);
      const subjectIsPass = isPass(marks, gradingConfig.pass_threshold);
      
      const creditsAssigned = parseFloat(record.credits || 0);
      const creditsEarned = subjectIsPass ? creditsAssigned : 0;
      const ciGi = gradePoint * creditsAssigned;

      totalCiGi += ciGi;
      totalCreditsAssigned += creditsAssigned;
      totalCreditsEarned += creditsEarned;

      return {
        ...record,
        grade,
        gradePoint,
        creditsAssigned,
        creditsEarned,
        ciGi,
        isPass: subjectIsPass
      };
    });

    const sgpa = calculateSGPA(data.results, gradingConfig);

    const hasGrace = subjects.some(s => parseFloat(s.grace_marks || 0) > 0);
    const hasFail = subjects.some(s => !s.isPass);
    let overallStatus = 'PASS';
    if (hasFail) overallStatus = 'FAIL';
    else if (hasGrace) overallStatus = 'PASS (GRACE)';

    return {
      subjects,
      totalCiGi,
      totalCreditsAssigned,
      totalCreditsEarned,
      sgpa,
      overallStatus
    };
  }, [data, gradingConfig]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data || !processedResults) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Results Not Available</h2>
        <p className="text-slate-500 mb-8">We couldn't find your results for this exam series.</p>
        <button onClick={() => navigate('/student/results')} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const { student, university } = data;
  const { subjects, totalCiGi, totalCreditsAssigned, totalCreditsEarned, sgpa, overallStatus } = processedResults;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6">
      {/* Action Bar - Hidden during print */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate('/student/results')}
          className="flex items-center gap-2 text-slate-600 font-bold hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Results
        </button>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-[13px]  tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer size={16} />
            Print Result
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black text-[13px]  tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Result Sheet Card */}
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-none sm:rounded-[2.5rem] overflow-hidden print:shadow-none print:m-0 print:rounded-none">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Award size={40} className="text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1 ">
                    {university}
                  </h1>
                  <p className="text-emerald-400 font-black text-[13px]  tracking-[0.3em]">Official Performance Statement</p>
                </div>
              </div>
              <div className="inline-block px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-400 text-[12px] font-black  tracking-widest">
                Semester Examination - {subjects[0]?.semester_name}
              </div>
            </div>
            
            <div className="text-center sm:text-right">
                <div className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                    <p className="text-[12px] font-black text-white/40  tracking-widest mb-1">Statement No.</p>
                    <p className="text-xl font-black text-white leading-none  tracking-tighter">EMS-RES-{student.rollnumber.slice(-6)}-{new Date().getFullYear()}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Student Info Grid */}
        <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 border-b border-slate-50 bg-slate-50/30">
          <div className="space-y-6">
            <InfoItem label="Student Name" value={student.name} icon={<User size={16}/>} bold />
            <InfoItem label="Roll Number" value={student.rollnumber} icon={<GraduationCap size={16}/>} />
            <InfoItem label="Father's Name" value={student.fatherName || 'N/A'} icon={<User size={16}/>} />
            <InfoItem label="Associated Institution" value={student.collageName} icon={<Building size={16}/>} />
          </div>
          <div className="space-y-6">
            <InfoItem label="Program of Study" value={student.programName} icon={<BookOpen size={16}/>} />
            <InfoItem label="Semester" value={student.semister} icon={<Calendar size={16}/>} />
            <InfoItem label="Examination Series" value={examName} icon={<Calendar size={16}/>} />
            <InfoItem label="Center Name" value={student.collageName} icon={<MapPin size={16}/>} />
          </div>
        </div>

        {/* Marks Table */}
        <div className="p-0">
          <table className="w-full border-collapse border-spacing-0">
            <thead>
              <tr className="bg-indigo-600/5 text-left text-[12px] font-black text-slate-500  tracking-widest border-y border-slate-100">
                <th className="px-8 py-5">Sl. No.</th>
                <th className="px-4 py-5 font-black">Course Code</th>
                <th className="px-4 py-5">Title of the Course</th>
                <th className="px-4 py-5 text-center">Marks Obtained</th>
                <th className="px-4 py-5 text-center">Credits (C)</th>
                <th className="px-4 py-5 text-center">Grade Point (G)</th>
                <th className="px-4 py-5 text-center">Letter Grade</th>
                <th className="px-8 py-5 text-right font-black italic">Ci x Gi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-400 text-[13px]">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-4">
                    <span className="font-black text-slate-900 text-[13px]  tracking-wider bg-slate-100 px-2 py-1 rounded">
                      {sub.subject_code}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[13px] font-black text-slate-700 leading-tight">{sub.subject_name}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {sub.total_marks !== undefined && sub.total_marks !== null ? (
                      <span className="font-black text-slate-900 text-sm">
                        {sub.total_marks}{parseFloat(sub.grace_marks || 0) > 0 ? '*' : ''}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {sub.assessment_components?.map((comp, cIdx) => (
                           <div key={cIdx} className="flex items-center gap-2 text-[9px] whitespace-nowrap">
                              <span className="font-bold text-slate-400  tracking-tighter">{comp.name}:</span>
                              <span className="font-black text-slate-700">{comp.marks}</span>
                           </div>
                        ))}
                        {(!sub.assessment_components || sub.assessment_components.length === 0) && (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-600 text-[13px]">
                    {sub.creditsAssigned}
                  </td>
                  <td className="px-4 py-4 text-center font-black text-slate-700 text-[13px]">
                    {sub.gradePoint}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded text-[12px] font-black ${sub.isPass ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'}  tracking-tight`}>
                      {sub.grade}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right font-black text-slate-900 text-[13px] italic">
                    {sub.ciGi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Block */}
        <div className="p-8 sm:p-12 bg-indigo-600 text-white">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                <SummaryItem label="Total Credits Assigned" value={totalCreditsAssigned} />
                <SummaryItem label="Total Credits Earned" value={totalCreditsEarned} />
                <SummaryItem label="Σ(Credits x Grade Points)" value={totalCiGi} />
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-[1.5rem] border border-white/10">
                    <p className="text-[12px] font-black text-white/60  tracking-widest mb-1">Semester SGPA</p>
                    <p className="text-4xl font-black tracking-tight text-emerald-400">{sgpa}</p>
                </div>
                <div className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] shadow-xl ${
                  overallStatus === 'FAIL' ? 'bg-red-600 shadow-red-600/20' : 
                  overallStatus === 'PASS (GRACE)' ? 'bg-indigo- shadow-indigo-500/20' : 
                  'bg-emerald-500 shadow-indigo-500/20'
                }`}>
                    <p className="text-[12px] font-black text-white/60  tracking-widest mb-1">Final Result</p>
                    <p className="text-2xl font-black tracking-tight  whitespace-nowrap">{overallStatus}</p>
                </div>
            </div>
        </div>

        {/* Signatures & Footer */}
        <div className="p-8 sm:p-12 border-t border-slate-100 bg-white">
            <div className="flex flex-col md:flex-row justify-between items-end gap-12 mt-8">
                <div className="text-center w-full md:w-auto">
                    <div className="w-64 h-24 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden bg-slate-50/50">
                        <CheckCircle2 size={64} className="text-emerald-500/10" />
                        <div className="absolute inset-0 flex items-center justify-center italic font-black text-[12px] text-slate-300  tracking-widest -rotate-12">Digital Verified Record</div>
                    </div>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest">Office of the Controller of Examinations</p>
                </div>
                
                <div className="text-center w-full md:w-auto">
                    <div className="w-64 h-24 border-b-2 border-slate-200 mb-4 flex items-end justify-center pb-2 italic text-slate-300 text-lg">
                        University Seal
                    </div>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest">Madhya Pradesh University of Excellence</p>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 italic text-[9px] text-slate-400 leading-relaxed text-center  tracking-widest font-black">
                Classification of Grades: {gradingConfig?.grade_scale?.map(g => `${g.grade} ≥ ${g.min}%`).join(', ')}.
                <br/>
                An asterisk (*) indicates that the subject marks include grace marks to reach the passing threshold.
            </div>
        </div>

        {/* Print specific CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:m-0 { margin: 0 !important; }
            .print\\:rounded-none { border-radius: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { margin: 1cm; size: portrait; }
          }
        `}} />
      </div>

      <div className="max-w-5xl mx-auto mt-8 text-center opacity-40">
        <p className="text-[12px] font-black  tracking-[0.2em] text-slate-500">
          Generated via MP-EMS Portal • {formatDate(data.generatedAt, true)} • Secure Verification ID: EMS-{Math.random().toString(36).substring(2, 10).toUpperCase()}
        </p>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon, bold = false }) => (
  <div className="flex items-start gap-4">
    {icon && <div className="mt-1 text-slate-200">{icon}</div>}
    <div>
      <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1.5">{label}</p>
      <p className={`text-slate-900 leading-tight ${bold ? 'text-lg font-black' : 'font-bold'}`}>{value}</p>
    </div>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <p className="text-[9px] font-black text-white/40  tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-black italic tracking-tighter">{value}</p>
  </div>
);

export default ResultSheet;
