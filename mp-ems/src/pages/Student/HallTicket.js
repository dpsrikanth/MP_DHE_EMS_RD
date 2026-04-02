import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ChevronLeft, GraduationCap, Calendar, Clock, MapPin, User, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import authUtils from '../../utils/authUtils';

const HallTicket = () => {
  const { examName, semesterId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHallTicketData();
  }, [examName, semesterId]);

  const fetchHallTicketData = async () => {
    try {
      const apiBase = window.config?.api_base_url || window.config?.login_url?.replace('/login', '') || 'http://localhost:8080/api';
      const response = await fetch(`${apiBase}/student/hall-ticket/${examName}/${semesterId}`, {
        headers: {
          ...authUtils.getAuthHeader()
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to fetch Hall Ticket');
      }
    } catch (error) {
      console.error('Error fetching hall ticket:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Hall Ticket Not Available</h2>
        <p className="text-slate-500 mb-8">We couldn't find your hall ticket for this exam series.</p>
        <button onClick={() => navigate('/student/exams')} className="bg-sky-500 text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const { student, exams, university, center } = data;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6">
      {/* Action Bar - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate('/student/exams')}
          className="flex items-center gap-2 text-slate-600 font-bold hover:text-sky-600 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Exams
        </button>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer size={16} />
            Print Hall Ticket
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-sky-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Hall Ticket Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-none sm:rounded-[2rem] overflow-hidden print:shadow-none print:m-0 print:rounded-none">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <GraduationCap size={40} className="text-sky-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1 uppercase">
                    {university}
                  </h1>
                  <p className="text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Official Examination Admit Card</p>
                </div>
              </div>
              <div className="inline-block px-4 py-1.5 bg-sky-500/20 rounded-full border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest">
                Academic Year 2025-26
              </div>
            </div>
            
            <div className="w-32 h-40 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/40 p-2 text-center overflow-hidden">
                <User size={48} className="mb-2" />
                <span className="text-[8px] font-black uppercase tracking-widest">Student Photograph</span>
            </div>
          </div>
        </div>

        {/* Student Info Grid */}
        <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 border-b border-slate-100">
          <div className="space-y-6">
            <InfoItem label="Candidate Name" value={student.name} icon={<User size={16}/>} />
            <InfoItem label="Roll Number" value={student.rollnumber} icon={<GraduationCap size={16}/>} bold />
            <InfoItem label="Program & Semester" value={`${student.programName} - ${student.semister}`} icon={<Building size={16}/>} />
            <InfoItem label="Home College / Institute" value={student.collageName} icon={<Building size={16}/>} />
          </div>
          <div className="space-y-6">
            <InfoItem label="Father's Name" value={student.fatherName || 'N/A'} icon={<User size={16}/>} />
            <InfoItem label="Examination" value={examName} icon={<Calendar size={16}/>} />
            <InfoItem label="Admission No" value={student.admission_no || 'N/A'} />
            <InfoItem label="Gender" value={student.gender || 'N/A'} />
          </div>
        </div>

        {/* Examination Center Card */}
        <div className="p-8 sm:p-12 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <MapPin size={18} />
            </div>
            Examination Center
          </h3>
          <div className={`relative rounded-[1.5rem] p-6 overflow-hidden border ${center?.is_external ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-30 -mr-16 -mt-16 ${center?.is_external ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${center?.is_external ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <MapPin size={26} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${center?.is_external ? 'text-indigo-500' : 'text-emerald-600'}`}>
                    {center?.is_external ? 'External Examination Center' : 'Home Examination Center'}
                  </p>
                  <p className="text-xl font-black text-slate-900 leading-tight">{center?.name || student.collageName}</p>
                  {center?.address && (
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {center.address}
                    </p>
                  )}
                </div>
              </div>
              <div className={`flex-shrink-0 self-start sm:self-center px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${center?.is_external ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}>
                {center?.is_external ? 'External' : 'Home Center'}
              </div>
            </div>
          </div>
        </div>

        {/* Exam Schedule */}
        <div className="p-8 sm:p-12">
          <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
             <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">
               <Calendar size={18} />
             </div>
             Examination Schedule
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Code</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {exams.map((exam, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 leading-none mb-1">
                        {new Date(exam.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                        {new Date(exam.exam_date).toLocaleDateString('en-GB', { weekday: 'long' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-black group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                        {exam.subject_code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900 leading-tight line-clamp-2 max-w-xs">{exam.subject_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{exam.start_time} - {exam.end_time}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-8 sm:p-12 bg-slate-50/50 border-t border-slate-100">
          <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Important Instructions</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <InstructionItem text="Candidates must reach the exam center 30 minutes before the scheduled time." />
            <InstructionItem text="Carrying a physical copy of this Hall Ticket is mandatory." />
            <InstructionItem text="A valid Government ID proof (Aadhar/Voter ID) is required along with this ticket." />
            <InstructionItem text="Electronic gadgets including smartwatches and mobile phones are strictly prohibited." />
            <InstructionItem text="Possession of any incriminating material will lead to immediate disqualification." />
            <InstructionItem text="Candidates must follow all instructions provided by the invigilators." />
          </ul>
        </div>

        {/* Signatures */}
        <div className="p-8 sm:p-12 flex justify-between items-end mt-12 bg-white">
           <div className="text-center">
             <div className="w-48 h-12 border-b-2 border-slate-200 mb-2 italic text-slate-400">Digital Signature</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controller of Examinations</p>
           </div>
           
           <div className="text-center">
             <div className="w-48 h-12 border-b-2 border-slate-200 mb-2 italic text-slate-400">Seal & Signature</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal / Head of Institution</p>
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
      
      {/* Footer Branding */}
      <div className="max-w-4xl mx-auto mt-8 text-center opacity-40 print:block">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Generated via MP-EMS Digital Portal • {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon, bold = false }) => (
  <div className="flex items-start gap-4">
    {icon && <div className="mt-1 text-slate-300">{icon}</div>}
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className={`text-slate-900 leading-tight ${bold ? 'text-lg font-black' : 'font-bold'}`}>{value}</p>
    </div>
  </div>
);

const InstructionItem = ({ text }) => (
  <li className="flex gap-3 items-start text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed italic">
    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
    {text}
  </li>
);

export default HallTicket;
