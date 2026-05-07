import React, { useState, useMemo } from "react";
import {
  Search, User, BookOpen, CreditCard, MapPin, 
  ChevronRight, Calendar, GraduationCap, 
  CheckCircle2, AlertCircle, Loader2,
  Phone, Mail, Hash, UserCircle, ArrowRight,
  ShieldCheck, Award, History
} from "lucide-react";
import { universityAdminApi } from "../../api/universityAdminApi";
import { toast } from "react-toastify";

const StudentGlobalSearch = () => {
  const [admissionNo, setAdmissionNo] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!admissionNo.trim()) {
      toast.error("Please enter an admission number");
      return;
    }

    setLoading(true);
    setStudentData(null);
    try {
      const data = await universityAdminApi.getStudentSearchDetails(admissionNo);
      setStudentData(data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Student not found or error fetching details");
    } finally {
      setLoading(false);
    }
  };

  const [selectedSemester, setSelectedSemester] = useState("All");

  // Group data by semester
  const consolidatedRecords = useMemo(() => {
    if (!studentData) return [];

    const semesters = {};

    // Process marks
    studentData.marksHistory.forEach(mark => {
      const semKey = mark.semester_name;
      if (!semesters[semKey]) {
        semesters[semKey] = {
          semesterName: semKey,
          academicYear: mark.academic_year,
          marks: [],
          centers: [],
          payments: []
        };
      }
      semesters[semKey].marks.push(mark);
    });

    // Process payments
    studentData.paymentHistory.forEach(payment => {
      const semKey = payment.semester_name;
      if (semesters[semKey]) {
        semesters[semKey].payments.push(payment);
      }
    });

    // Process centers
    studentData.centerHistory.forEach(center => {
      const matchingSem = Object.values(semesters).find(s => 
        s.marks.some(m => m.exam_id === center.exam_id)
      );
      
      if (matchingSem) {
        if (!matchingSem.centers.some(c => c.exam_id === center.exam_id)) {
           matchingSem.centers.push(center);
        }
      }
    });

    let result = Object.values(semesters).sort((a, b) => b.semesterName.localeCompare(a.semesterName));
    
    // Auto-reset filter when searching new student
    return result;
  }, [studentData]);

  // Filtered records for display
  const filteredRecords = useMemo(() => {
    if (selectedSemester === "All") return consolidatedRecords;
    return consolidatedRecords.filter(r => r.semesterName === selectedSemester);
  }, [consolidatedRecords, selectedSemester]);

  // Reset filter when student changes
  useMemo(() => {
    setSelectedSemester("All");
  }, [studentData]);

  const [expandedSemesters, setExpandedSemesters] = useState(new Set());

  // Set default expanded semester once data loads
  useMemo(() => {
    if (consolidatedRecords.length > 0 && expandedSemesters.size === 0) {
      setExpandedSemesters(new Set([consolidatedRecords[0].semesterName]));
    }
  }, [consolidatedRecords]);

  const toggleSemester = (semName) => {
    const newSet = new Set(expandedSemesters);
    if (newSet.has(semName)) newSet.delete(semName);
    else newSet.add(semName);
    setExpandedSemesters(newSet);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Student <span className="text-indigo-600">360° Profile</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-6 h-[1.5px] bg-indigo-600"></span>
            Unified Institutional Intelligence
          </p>
        </div>

        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex items-stretch shadow-sm">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Admission Number..."
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-l-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl font-black text-xs tracking-widest transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "LOOKUP"}
            </button>
          </form>
        </div>
      </div>

      {studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Core Profile */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* Student Identity Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
              <div className="h-24 bg-gradient-to-br from-indigo-600 to-violet-800 relative"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-10 mb-4">
                  <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-lg">
                    <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 border border-slate-100">
                      <User size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                    {studentData.personalDetails.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] tracking-widest uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full w-fit border border-indigo-100">
                    <Hash size={12} />
                    {studentData.personalDetails.admission_no}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Semester</p>
                    <p className="text-sm font-black text-slate-800">{studentData.personalDetails.semister || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Roll No</p>
                    <p className="text-sm font-black text-slate-800">{studentData.personalDetails.rollnumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <ContactItem icon={Phone} label="Contact" value={studentData.personalDetails.contactNumber} />
                  <ContactItem icon={Mail} label="Email" value={studentData.personalDetails.email} />
                  <ContactItem icon={MapPin} label="College" value={studentData.personalDetails.college_name || studentData.personalDetails.collageName} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Consolidated Records */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-indigo-600 border border-slate-100">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Academic Timeline</h3>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Consolidated semester records</p>
                </div>
              </div>

              {consolidatedRecords.length > 0 && (
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase pl-3">Filter:</span>
                  <select 
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all min-w-[140px]"
                  >
                    <option value="All">All Semesters</option>
                    {consolidatedRecords.map(r => (
                      <option key={r.semesterName} value={r.semesterName}>{r.semesterName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-6">
                {filteredRecords.map((record, idx) => {
                  const isExpanded = expandedSemesters.has(record.semesterName) || selectedSemester !== "All";
                  return (
                    <div key={idx} className="relative">
                      {idx !== consolidatedRecords.length - 1 && (
                        <div className="absolute left-6 top-16 bottom-[-24px] w-0.5 bg-slate-100" />
                      )}
                      
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 shrink-0 bg-white border-2 border-indigo-600 rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg z-10 relative cursor-pointer"
                             onClick={() => toggleSemester(record.semesterName)}>
                          <span className="font-black text-lg">{record.semesterName.match(/\d+/) || 'S'}</span>
                        </div>

                        <div className="flex-1 space-y-4">
                          {/* Semester Header Accordion Trigger */}
                          <div 
                            onClick={() => toggleSemester(record.semesterName)}
                            className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-indigo-200 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{record.semesterName}</h4>
                                <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">{record.academicYear}</p>
                              </div>
                              <ChevronRight className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {record.payments.length > 0 ? (
                                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                                  <CreditCard size={14} className="text-emerald-500" />
                                  <p className="text-[10px] font-black text-emerald-600 uppercase">PAID</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100">
                                  <AlertCircle size={14} className="text-rose-500" />
                                  <p className="text-[10px] font-black text-rose-600 uppercase">UNPAID</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Award size={14} className="text-slate-400" />
                                <p className="text-[10px] font-black text-slate-600 uppercase">
                                  {record.marks.length} Subjects
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {isExpanded && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                              {/* Center Info */}
                              {record.centers.length > 0 && (
                                <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                                  <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-indigo-400 mt-1" />
                                    <div>
                                      <p className="text-sm font-black tracking-tight">{record.centers[0].center_name}</p>
                                      <p className="text-slate-400 text-[10px]">{record.centers[0].center_address}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-center">
                                    <div className="px-4 border-l border-white/10">
                                      <p className="text-[8px] font-black text-indigo-300 uppercase mb-0.5">Hall</p>
                                      <p className="text-sm font-black">{record.centers[0].hall_code}</p>
                                    </div>
                                    <div className="px-4 border-l border-white/10">
                                      <p className="text-[8px] font-black text-indigo-300 uppercase mb-0.5">Seat</p>
                                      <p className="text-sm font-black">{record.centers[0].row_no}-{record.centers[0].seat_no}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Marks Table */}
                              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Int</th>
                                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Ext</th>
                                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Total</th>
                                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {record.marks.map((mark, mIdx) => (
                                      <tr key={mIdx} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{mark.subject_name}</p>
                                          <p className="text-[9px] font-black text-indigo-500 tracking-widest uppercase">{mark.subject_code}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center text-[11px] font-bold text-slate-500">{mark.internal_marks}</td>
                                        <td className="px-4 py-4 text-center text-[11px] font-bold text-slate-500">{mark.external_marks}</td>
                                        <td className="px-4 py-4 text-center font-black text-sm text-slate-900">{mark.total_marks}</td>
                                        <td className="px-6 py-4 text-center">
                                          <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${
                                            mark.total_marks >= 40 
                                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                              : 'bg-rose-50 text-rose-600 border-rose-100'
                                          }`}>
                                            {mark.total_marks >= 40 ? 'PASS' : 'FAIL'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
                 <p className="text-slate-400 text-sm font-bold tracking-tight uppercase">No semester records found for this student.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ContactItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-5 group">
    <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-slate-100 group-hover:border-indigo-100">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

export default StudentGlobalSearch;
