import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import { 
  GraduationCap, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Search,
  ChevronDown
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import { masterDataApi } from '../api/masterDataApi';
import authUtils from '../utils/authUtils';

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

const Colleges = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'college_code', label: 'Code', mandatory: true },
    { key: 'college_name', label: 'College Name', mandatory: true },
    { key: 'university_name', label: 'University' }
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
    searchFields: ['id', 'college_code', 'college_name', 'university_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // Config Mapping State
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({
    policies: [],
    programs: [],
    academicYears: [],
    semesters: []
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUniversities();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const data = await masterDataApi.getMasters();
      setMasterData(data);
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchUniversityConfig = async (uId) => {
    if (!uId) {
      setUniversityConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      return;
    }
    try {
      setIsConfigLoading(true);
      const data = await masterDataApi.getUniversityConfig(uId);
      setUniversityConfig(data);
    } catch (err) {
      console.error('Error fetching university config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const data = await masterDataApi.getCollegeConfig(cId);
      setSelectedConfig({
        policies: data.policies || [],
        programs: data.programs || [],
        academicYears: data.academicYears || [],
        semesters: data.semesters || []
      });
    } catch (err) {
      console.error('Error fetching college config:', err);
    }
  };


  useEffect(() => {
    if (location.state && location.state.addMode && location.state.universityId) {
      navigate('/colleges/add', { state: { universityId: location.state.universityId } });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await masterDataApi.getColleges();
      const activeData = (data || []).filter(item => item.status === true || item.status === 1 || item.status === '1' || item.status === 'true');
      setData(activeData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const data = await masterDataApi.getUniversities();
      const activeUniversities = (data || []).filter(u => u.status === true || u.status === 1 || u.status === '1' || u.status === 'true');
      setUniversities(activeUniversities);
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteCollege(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Removed openEditModal and handleSave in favor of route-based Form page

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Colleges</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Manage and configure college department mappings</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by name, code or university..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => navigate('/colleges/add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add College</span>
            </button>
          </div>
        </div>

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
                  label="Code" 
                  field="college_code" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.college_code}
                />
                <SortHeader 
                  label="College Name" 
                  field="college_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.college_name}
                />
                <SortHeader 
                  label="University" 
                  field="university_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.university_name}
                />
                <th className="px-6 py-3.5 text-[12px] font-black  tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.college_code && (
                      <td className="px-4 py-4 text-sm font-bold text-indigo-600">
                        {item.college_code ? (
                          <span className="bg-indigo-50 px-2 py-1 rounded-md">{item.college_code}</span>
                        ) : (
                          <span className="text-slate-300 font-normal italic">N/A</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.college_name && (
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900 leading-tight">
                        {item.college_name || item.name}
                      </td>
                    )}
                    {visibleColumns.university_name && (
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full  tracking-tighter shadow-sm border border-slate-200">
                          {item.university_name || universities.find(u => u.id === item.university_id)?.name || 'Standalone'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/colleges/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit College"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete College"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No colleges match your search</p>
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

      {/* Add/Edit Modal was removed in favor of route-based Form page */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <MdDelete size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.college_name || deleteTarget?.name}"</span>? This action cannot be reversed.
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

export default Colleges;
