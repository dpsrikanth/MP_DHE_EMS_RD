import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import { 
  School, 
  Plus, 
  Pencil, 
  X, 
  Check 
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import { masterDataApi } from '../api/masterDataApi';

const CheckboxOption = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.isSelected}
            onChange={() => null}
            className="w-4 h-4 text-indigo- border-slate-300 rounded focus:-indigo- pointer-events-none"
          />
          <span className="text-sm font-medium">{props.label}</span>
        </div>
      </components.Option>
    </div>
  );
};

const Universities = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState(null);
  const [detailsList, setDetailsList] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'University Name', mandatory: true },
    { key: 'colleges', label: 'Linked Colleges' }
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
    searchFields: ['id', 'name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // Config State
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [policyOptions, setPolicyOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      // Fetch Masters
      const masterData = await masterDataApi.getMasters();
      
      const pOptions = masterData.policies.map(p => ({ value: p.id, label: p.name }));
      const prgOptions = masterData.programs.map(p => ({ value: p.id, label: p.name }));
      const ayOptions = masterData.academicYears.map(ay => ({ value: ay.id, label: ay.year_name }));
      const semOptions = masterData.semesters.map(s => ({ value: s.id, label: s.semester_name }));
      
      setPolicyOptions(pOptions);
      setProgramOptions(prgOptions);
      setAcademicYearOptions(ayOptions);
      setSemesterOptions(semOptions);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const fetchData = async () => {
    try {
      const data = await masterDataApi.getUniversities();
      const activeData = (data || []).filter(item => item.status === true || item.status === 1 || item.status === '1' || item.status === 'true');
      setData(activeData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteUniversity(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.message || err));
    }
  };

  const showDetails = async (university, type) => {
    try {
      let allData = [];
      if (type === 'colleges') allData = await masterDataApi.getColleges();
      else if (type === 'programs') allData = await masterDataApi.getPrograms();
      else if (type === 'academic_years') allData = await masterDataApi.getAcademicYears();
      
      const filtered = allData.filter(item => item.university_id === university.id);
      
      setDetailsList(filtered);
      setDetailsType(type);
      setDetailsModal(true);
    } catch (err) {
      console.error('Error in showDetails:', err);
      toast.error('Error: ' + (err.message || err));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <School size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Universities</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Manage and configure institution profiles</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search universities by name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => navigate('/universities/add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add University</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <SortHeader 
                  label="ID" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-6" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="University Name" 
                  field="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.name}
                />
                <th className={`${visibleColumns.colleges ? '' : 'hidden'} px-4 py-3.5 text-[12px] font-black  tracking-widest text-slate-400`}>Linked Colleges</th>
                <th className="px-6 py-3.5 text-[12px] font-black  tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.name && (
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </td>
                    )}
                    {visibleColumns.colleges && (
                      <td className="px-4 py-4 font-medium">
                        {item.colleges_count > 0 ? (
                          <button 
                            onClick={() => showDetails(item, 'colleges')}
                            className="inline-flex items-center px-4 py-1.5 bg-indigo- text-indigo- rounded-full text-[13px] font-bold hover:bg-indigo- transition-colors"
                          >
                            {item.colleges_count} Colleges
                          </button>
                        ) : (
                          <span className="text-[13px] text-slate-400">No colleges</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/universities/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit University"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete University"
                        >
                          <MdDelete size={20} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => navigate('/colleges', { state: { universityId: item.id, addMode: true } })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[13px] font-bold transition-all"
                          title="Manage Colleges"
                        >
                          <Plus size={14} />
                          <span>Colleges</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No universities match your search</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-[13px] font-black text-indigo-500 hover:text-indigo-600 underline  tracking-tighter"
                      >
                        Clear Search
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

      {/* Main Modal was removed in favor of route-based Form page */}

      {/* Details View Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md animate-in fade-in" onClick={() => setDetailsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {detailsType === 'colleges' ? 'Colleges List' : detailsType === 'programs' ? 'Programs Overview' : 'Academic Calendar'}
              </h3>
              <button onClick={() => setDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-2 divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {detailsList.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-400  tracking-widest">No entries found</p>
                </div>
              ) : (
                detailsList.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-"></div>
                    <span className="text-sm font-semibold text-slate-700">
                      {item.college_name || item.name || item.year_name || 'Anonymous Entry'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <MdDelete size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.name}"</span>? This action cannot be reversed.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                  onClick={handleDeleteConfirm}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universities;
