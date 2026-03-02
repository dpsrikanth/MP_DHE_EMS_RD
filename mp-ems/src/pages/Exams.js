import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Calendar,
  Book,
  Layers,
  Hash,
  ArrowRight
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Exams = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'details', label: 'Assessment Details' },
    { key: 'context', label: 'Academic Context' },
    { key: 'date', label: 'Timeline' }
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
    searchFields: ['id', 'exam_name'],
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
      const response = await fetch('http://localhost:8080/api/exams', {
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Examination Management</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Schedule, track and configure institutional assessments</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by exam name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Schedule Exam</span>
            </button>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/20">
                <SortHeader 
                  label="ID Reference" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-8" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Assessment Details" 
                  field="exam_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.details}
                />
                <th className={`${visibleColumns.context ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Academic Context</th>
                <SortHeader 
                  label="Timeline" 
                  field="exam_date" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.date}
                />
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.details && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 border border-purple-100 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{item.exam_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                              Major Assessment <ArrowRight size={10} /> Tier 1
                            </p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.context && (
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <p className="text-xs font-bold text-slate-700">Subject-{item.subject_id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">Semester-{item.semester_id}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 text-slate-500 group-hover:text-purple-600 transition-colors">
                          <Calendar size={14} />
                          <span className="text-xs font-black tracking-tighter">
                            {item.exam_date ? new Date(item.exam_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button 
                          className="p-2 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                          title="Modify Specification"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Revoke Schedule"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No examinations found</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-purple-500 hover:text-purple-600 underline uppercase tracking-tighter"
                      >
                        Reset Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default Exams;
