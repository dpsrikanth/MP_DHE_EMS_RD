import React from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Columns
} from 'lucide-react';

/**
 * Column Visibility Selector Component
 */
export const ColumnVisibilitySelector = ({ columns, visibleColumns, onToggle }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm font-bold text-sm"
      >
        <Columns size={18} />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toggle Column Visibility</h3>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {columns.map(col => (
                <label 
                  key={col.key}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <span className="text-sm font-bold text-slate-700">{col.label}</span>
                  <div className="relative">
                    <input 
                      type="checkbox"
                      checked={!!visibleColumns[col.key]}
                      onChange={() => onToggle(col.key)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:border-white"></div>
                  </div>
                </label>
              ))}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest"
              >
                Close Selector
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Search Input Component
 */
export const TableSearch = ({ value, onChange, placeholder = "Search records..." }) => {
  return (
    <div className="relative group w-full max-w-sm">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-10 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

/**
 * Pagination Component with Page Size Selector
 */
export const TablePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  pageSize,
  onPageSizeChange
}) => {
  if (totalItems === 0) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-8 py-6 bg-slate-50/50 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
          <span>Displaying</span>
          <span className="text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200">
            {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalItems)}
          </span>
          <span>of</span>
          <span className="text-slate-900">{totalItems}</span>
          <span>Records</span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Show</span>
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
            >
              {[5, 10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="First Page"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1 px-1">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                currentPage === page 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-110 z-10' 
                  : 'text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="Last Page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

/**
 * Sortable Header Component with Optional Filtering
 */
export const SortHeader = ({ 
  label, 
  field, 
  currentSort, 
  onSort, 
  className = "",
  visible = true
}) => {
  if (!visible) return null;
  
  const isActive = currentSort.field === field;
  
  return (
    <th className={`px-4 py-4 border-b border-slate-100 ${className}`}>
      <div 
        className="flex items-center gap-2 cursor-pointer group w-fit"
        onClick={() => onSort(field)}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-indigo-500 transition-colors">
          {label}
        </span>
        <span className={`${isActive ? 'text-indigo-600' : 'text-slate-300'} group-hover:text-indigo-400 transition-colors`}>
          {!isActive ? <ArrowUpDown size={12} /> : (currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </span>
      </div>
    </th>
  );
};
