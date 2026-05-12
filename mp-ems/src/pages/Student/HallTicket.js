import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ChevronLeft, GraduationCap, Calendar, Clock, MapPin, User, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import authUtils from '../../utils/authUtils';
import { studentApi } from '../../api/studentApi';

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
      const result = await studentApi.getHallTicket(examName, semesterId);
      if (result) {
        setData(result);
      } else {
        toast.error('Failed to fetch Hall Ticket');
      }
    } catch (error) {
      console.error('Error fetching hall ticket:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Network error');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Hall Ticket Not Available</h2>
        <p className="text-slate-500 mb-8">We couldn't find your hall ticket for this exam series.</p>
        <button onClick={() => navigate('/student/exams')} className="bg-indigo- text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const { student, exams, university, center } = data;

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4 print:bg-white print:p-0">
      {/* Action Bar - Hidden during print */}
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate('/student/exams')}
          className="flex items-center gap-2 text-slate-600 font-bold hover:text-indigo- transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Exams
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#1e3a8a] text-white px-6 py-2 rounded font-bold text-sm shadow hover:bg-blue-800 transition-all"
        >
          <Printer size={16} />
          Print / Download Admit Card
        </button>
      </div>

      {/* Hall Ticket Document (A4 format style) */}
      <div className="max-w-[800px] mx-auto bg-white p-6 shadow-lg print:shadow-none print:m-0 print:max-w-none print:w-full text-[11px] font-sans text-slate-800 border border-transparent print:border-none">
        
        {/* Main Table Container */}
        <table className="w-full border-collapse border-2 border-[#1e3a8a]">
          <tbody>
            {/* Header Row */}
            <tr>
              <td colSpan="3" className="p-4 border-b-2 border-[#1e3a8a] text-center relative align-middle">
                {/* Simulated Logo */}
                <div className="absolute left-4 top-4 w-16 h-16 border-2 border-[#1e3a8a] rounded-full flex flex-col items-center justify-center bg-white text-[#1e3a8a]">
                  <GraduationCap size={24} />
                  <span className="text-[6px] font-bold  mt-1">MP-EMS</span>
                </div>
                
                <h1 className="text-lg font-bold text-[#1e3a8a]  tracking-wide leading-tight mt-1">{university || 'DHE EMS UNIVERSITY'}</h1>
                <h2 className="text-[13px] font-bold text-[#2563eb]  tracking-wider mt-1">ADMIT CARD FOR {examName}</h2>
              </td>
            </tr>

            {/* Layout Row */}
            <tr>
              {/* Left Column (Info) */}
              <td className="w-[55%] border-r border-[#1e3a8a] p-0 align-top">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-1/3 p-1.5 px-2 text-right border-b border-r border-[#1e3a8a] font-medium text-slate-600">Center Number :</td>
                      <td className="p-1.5 px-2 border-b border-[#1e3a8a] font-bold text-black">{center?.id || 'C-101'}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 px-2 text-right border-b border-r border-[#1e3a8a] font-medium text-slate-600 align-top">Center of <br/>Examination :</td>
                      <td className="p-1.5 px-2 border-b border-[#1e3a8a] font-bold text-black  align-top">
                        {center?.name || student.collageName}
                        {center?.address && <div className="text-[9px] font-normal mt-0.5 capitalize">{center.address}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 px-2 text-right border-b border-r border-[#1e3a8a] font-medium text-slate-600">Candidate's Name :</td>
                      <td className="p-1.5 px-2 border-b border-[#1e3a8a] font-bold text-black ">{student.name}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 px-2 text-right border-b border-r border-[#1e3a8a] font-medium text-slate-600">Father's Name :</td>
                      <td className="p-1.5 px-2 border-b border-[#1e3a8a] font-bold text-black ">{student.fatherName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="p-1 px-2 text-left font-bold text-[#af87b9] text-[12px] bg-slate-50 italic">Candidate Mailing Address</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-right border-r border-[#1e3a8a] font-medium text-slate-600">Address :</td>
                      <td className="p-1 px-2 font-bold text-black ">{student.address || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-right border-r border-[#1e3a8a] font-medium text-slate-600">City / District :</td>
                      <td className="p-1 px-2 font-bold text-black ">Indore</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-right border-r border-[#1e3a8a] font-medium text-slate-600">State :</td>
                      <td className="p-1 px-2 font-bold text-black ">Madhya Pradesh</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-right border-r border-[#1e3a8a] font-medium text-slate-600 border-t">Email Address :</td>
                      <td className="p-1 px-2 font-bold text-black border-t border-[#1e3a8a]">{student.email || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-right border-r border-[#1e3a8a] font-medium text-slate-600 border-t">Mobile Number :</td>
                      <td className="p-1 px-2 font-bold text-black border-t border-[#1e3a8a]">{student.contactNumber || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Middle Column (Course Info) */}
              <td className="w-[25%] border-r border-[#1e3a8a] p-0 align-top">
                <table className="w-full border-collapse text-center h-full">
                  <tbody>
                    <tr>
                      <td className="p-1.5 text-[#1e3a8a] font-medium border-b border-[#1e3a8a]">Course</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-black  border-b border-[#1e3a8a]">{student.programName}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-[#1e3a8a] font-medium border-b border-[#1e3a8a]">Semester</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-black border-b border-[#1e3a8a]">{exams[0]?.semester_name}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-[#1e3a8a] font-medium border-b border-[#1e3a8a]">Gender</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-black  border-b border-[#1e3a8a]">{student.gender || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 text-[#1e3a8a] font-medium border-b border-[#1e3a8a]">Category</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-black ">GENERAL</td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Right Column (Roll & Photo) */}
              <td className="w-[20%] p-0 align-top relative">
                <table className="w-full border-collapse text-center">
                  <tbody>
                    <tr>
                      <td className="p-1.5 text-[#1e3a8a] font-medium border-b border-[#1e3a8a]">Roll Number</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-black  border-b border-[#1e3a8a]">{student.rollnumber}</td>
                    </tr>
                    <tr>
                      <td className="p-2 pt-4">
                        <div className="w-24 h-[120px] mx-auto border border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center bg-[#f8f9fa]">
                          <User size={64} className="text-[#e2e8f0] translate-y-4" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Exam Schedule Table */}
        <div className="mt-4">
          <table className="w-full border-collapse border border-[#1e3a8a] text-center">
            <thead>
              <tr>
                <td colSpan="5" className="p-1.5 bg-slate-50 border border-[#1e3a8a] font-bold text-[#1e3a8a] ">
                  Examination Paper Details
                </td>
              </tr>
              <tr className="bg-slate-50 text-[12px] text-slate-700">
                <th className="p-1.5 border border-[#1e3a8a] font-medium w-[15%]">Date of Exam</th>
                <th className="p-1.5 border border-[#1e3a8a] font-medium w-[15%]">Paper Code</th>
                <th className="p-1.5 border border-[#1e3a8a] font-medium w-[40%] text-left">Subject Name</th>
                <th className="p-1.5 border border-[#1e3a8a] font-medium w-[15%]">Hall / Seat Number</th>
                <th className="p-1.5 border border-[#1e3a8a] font-medium w-[15%]">Timings</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? exams.map((exam, idx) => (
                <tr key={idx} className="font-bold text-black text-[12px]">
                  <td className="p-1.5 border border-[#1e3a8a] whitespace-nowrap">
                    {formatDate(exam.exam_date)}
                  </td>
                  <td className="p-1.5 border border-[#1e3a8a]">{exam.subject_code || '---'}</td>
                  <td className="p-1.5 border border-[#1e3a8a] text-left  truncate max-w-[200px]" title={exam.subject_name}>
                    {exam.subject_name}
                  </td>
                  <td className="p-1.5 border border-[#1e3a8a] whitespace-nowrap">
                    {exam.hall_code ? `${exam.hall_code} / S-${exam.seat_no}` : (student.hall_code ? `${student.hall_code} / S-${student.seat_no}` : 'PENDING')}
                  </td>
                  <td className="p-1.5 border border-[#1e3a8a] whitespace-nowrap">
                    {exam.start_time} - {exam.end_time}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-4 border border-[#1e3a8a] text-slate-500 font-medium">
                    No papers scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Signatures & Instructions */}
        <div className="mt-8 border-t border-[#1e3a8a] pt-4 flex flex-col justify-between" style={{ pageBreakInside: 'avoid' }}>
          
          {/* Instructions Block */}
          <div className="mb-12">
            <h4 className="font-bold text-[#1e3a8a] text-[12px] mb-2  underline">Important Instructions for Candidates</h4>
            <ul className="list-decimal pl-4 text-[9px] text-justify font-medium text-slate-700 space-y-1 pr-4">
              <li>Please verify all particulars including Name, Father's Name, Category, Date of Birth, Gender, State of Eligibility and Center of Examination.</li>
              <li>Candidate must carry the printed copy of Admit Card downloaded from MP-EMS portal along with valid photo identity proof.</li>
              <li>Candidates are advised to reach the venue at least 45 minutes before the commencement of the examination.</li>
              <li>No candidate shall be permitted to enter the Examination Centre after the gate closing time.</li>
              <li>Use of Electronic gadgets like Mobile Phone, Smart Watch, Calculator, etc., is strictly prohibited inside the Examination Hall.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end px-8 pb-4">
            <div className="text-center w-48 relative">
              <div className="absolute -top-10 left-0 right-0 h-12 flex justify-center items-center opacity-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Signature_of_R._K._Singh.svg" alt="signature" className="h-full" style={{filter: 'grayscale(100%) brightness(50%)'}} onError={(e) => e.target.style.display='none'} />
              </div>
              <div className="border-t border-black w-full border-dashed pt-1">
                <span className="font-bold text-black text-[12px] ">Controller of Examinations</span>
              </div>
            </div>
            
            <div className="text-center w-48">
              <div className="h-10 mb-1"></div>
              <div className="border-t border-black w-full border-dashed pt-1">
                <span className="font-bold text-black text-[12px] ">Signature of the Candidate</span>
                <div className="text-[8px] text-slate-500 font-normal leading-tight">(To be signed in presence of Invigilator)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Print specific CSS & overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { 
              background: white !important; 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            @page { 
              margin: 10mm; 
              size: A4 portrait; 
            }
          }
        `}} />
      </div>
    </div>
  );
};

export default HallTicket;

