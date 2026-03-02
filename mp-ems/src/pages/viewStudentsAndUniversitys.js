import React, { useState, useEffect } from "react";
import { 
  Users, 
  School, 
  Search, 
  Filter, 
  ArrowRight, 
  BookOpen,
  Activity,
  UserCheck,
  Building2,
  TrendingUp
} from "lucide-react";

/**
 * Modern Data Overview component with Tailwind CSS styling.
 * Displays insights into students and universities within the institution ecosystem.
 */
const ViewStudentsAndUniversities = () => {
  const [students, setStudents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all", "students", "universities"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch("http://localhost:8080/api/students");
        const universityRes = await fetch("http://localhost:8080/api/universities");
        const studentData = await studentRes.json();
        const universityData = await universityRes.json();
        setStudents(studentData);
        setUniversities(universityData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUniversities = universities.filter(u => 
    u.university_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Active</span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Students</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 leading-none">{students.length}</h3>
            <p className="text-xs font-bold text-slate-400 mb-1">Enrolled</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <School size={24} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">Affiliated</span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Universities</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 leading-none">{universities.length}</h3>
            <p className="text-xs font-bold text-slate-400 mb-1">Partners</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Live</span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">System Health</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 leading-none">Optimal</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 mb-2 animate-pulse"></span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">Growth</span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Ecosystem Pulse</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 leading-none">+12.4%</h3>
            <p className="text-xs font-bold text-slate-400 mb-1">Monthly</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setViewMode("all")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "all" ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                Global View
              </button>
              <button 
                onClick={() => setViewMode("students")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "students" ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'}`}
              >
                Students Only
              </button>
              <button 
                onClick={() => setViewMode("universities")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === "universities" ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                Universities Only
              </button>
            </div>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-slate-700 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5 outline-none transition-all font-semibold"
            />
          </div>
        </div>

        {/* Content Explorer */}
        <div className="p-8 pb-12">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Ecosystem Data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {/* Render Students if mode allows */}
              {(viewMode === "all" || viewMode === "students") && filteredStudents.map((student) => (
                <div key={`student-${student.id}`} className="group relative bg-white border-2 border-slate-50 rounded-[2rem] p-6 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300">
                  <div className="absolute top-4 right-4 text-sky-500 opacity-20 group-hover:opacity-100 transition-opacity">
                    <UserCheck size={20} />
                  </div>
                  <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 mb-6 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                    <Users size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-sky-600 transition-colors uppercase tracking-tight">{student.student_name}</h4>
                  <p className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    Student ID: <span className="text-slate-600">{student.student_id || student.id}</span>
                  </p>
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-sky-500 group-hover:text-white transition-all">
                    View Portfolio
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ))}

              {/* Render Universities if mode allows */}
              {(viewMode === "all" || viewMode === "universities") && filteredUniversities.map((uni) => (
                <div key={`uni-${uni.id}`} className="group relative bg-white border-2 border-slate-50 rounded-[2rem] p-6 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                  <div className="absolute top-4 right-4 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Building2 size={20} />
                  </div>
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <School size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{uni.university_name}</h4>
                  <p className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    University Code: <span className="text-slate-600">{uni.university_code || uni.id}</span>
                  </p>
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    Affiliation Details
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ))}

              {filteredStudents.length === 0 && filteredUniversities.length === 0 && !loading && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Search size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Ecosystem Search Exhausted</h3>
                  <p className="text-slate-500 font-medium max-w-sm">No records match your current refined search criteria. Try a different query.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewStudentsAndUniversities;
