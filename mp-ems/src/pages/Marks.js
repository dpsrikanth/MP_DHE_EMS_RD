import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpRight,
  GraduationCap,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

/**
 * Modern Marks Management component with Tailwind CSS styling.
 * Designed for high-performance academic record tracking.
 */
const Marks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'student', label: 'Student Info' },
    { key: 'exam', label: 'Exam Details' },
    { key: 'performance', label: 'Performance' }
  ];

  const {
    paginatedData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    visibleColumns,
    toggleColumn
  } = useDataTable(data, { 
    searchFields: ['id', 'student_id', 'exam_id'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/marks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const data = await response.json();
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.student_id?.toString().includes(searchQuery) || 
    item.exam_id?.toString().includes(searchQuery)
  );

  const getPerformanceColor = (obtained, max) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (percentage >= 60) return "text-sky-500 bg-sky-50 border-sky-100";
    if (percentage >= 40) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-red-500 bg-red-50 border-red-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic <span className="text-indigo-600">Records</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Marks & Performance Metrics
            </p>
          </div>
        </div>
        <button className="group relative overflow-hidden bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2">
            <Plus size={18} />
            <span>Record New Marks</span>
          </div>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-center gap-6">
          <TableSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search by Student ID, Exam ID, or Ref..."
            className="w-full lg:w-96"
          />
          <div className="flex items-center gap-3">
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button className="p-3.5 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
              <Filter size={20} />
            </button>
            <div className="h-10 w-px bg-slate-200 mx-2"></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Total {totalItems} Records</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Secure Records...</p>
            </div>
          ) : error ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Sync Connection Failed</h3>
              <p className="text-slate-500 font-medium max-w-md mb-8">{error}</p>
              <button onClick={fetchData} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">Retry Synchronization</button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <SortHeader 
                    label="ID" 
                    field="id" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100" 
                    visible={visibleColumns.id}
                  />
                  <SortHeader 
                    label="Student Info" 
                    field="student_id" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100" 
                    visible={visibleColumns.student}
                  />
                  <SortHeader 
                    label="Exam Details" 
                    field="exam_id" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100" 
                    visible={visibleColumns.exam}
                  />
                  <SortHeader 
                    label="Performance" 
                    field="marks_obtained" 
                    currentSort={sortConfig} 
                    onSort={handleSort} 
                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100" 
                    visible={visibleColumns.performance}
                  />
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    {visibleColumns.id && (
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-400 tabular-nums">#{item.id}</span>
                      </td>
                    )}
                    {visibleColumns.student && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase">Student Ref</p>
                            <p className="text-xs font-bold text-slate-500">ID: {item.student_id}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.exam && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase">Exam Ref</p>
                            <p className="text-xs font-bold text-slate-500">Code: {item.exam_id}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.performance && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`px-4 py-2 rounded-xl border text-sm font-black tabular-nums transition-all ${getPerformanceColor(item.marks_obtained, item.max_marks)} shadow-sm`}>
                            {item.marks_obtained} / {item.max_marks}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Score</p>
                            <p className="text-xs font-bold text-slate-800 tabular-nums">{Math.round((item.marks_obtained / item.max_marks) * 100)}%</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" aria-label="Edit Record">
                          <Pencil size={18} />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" aria-label="Delete Record">
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" aria-label="Deep Analysis">
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />

        {!loading && paginatedData.length === 0 && !error && (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6 border-t border-slate-50">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border-4 border-white shadow-sm">
              <BarChart3 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight italic">Ecosystem Void</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">No marks records found in the system for the current criteria. Start by recording a new evaluation.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all transform hover:-translate-y-1"
            >
              <Plus size={20} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Footer Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white opacity-10 group-hover:scale-150 transition-transform duration-700">
            <CheckCircle2 size={120} />
          </div>
          <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Record Verification</h4>
          <p className="text-indigo-100 font-medium mb-8 leading-relaxed max-w-sm">All academic records are signed and synchronized across the institutional blockchain for integrity.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-widest">Secure Ledger Active</span>
          </div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group border border-slate-800">
           <div className="absolute top-0 right-0 p-8 text-sky-500 opacity-20 group-hover:scale-150 transition-transform duration-700">
            <TrendingUp size={120} />
          </div>
          <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Trend Insights</h4>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed max-w-sm">Use our advanced AI engines to predict student outcomes based on historical performance data.</p>
          <button className="text-sm font-black text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-widest flex items-center gap-2">
            Explore Analytics
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marks;

