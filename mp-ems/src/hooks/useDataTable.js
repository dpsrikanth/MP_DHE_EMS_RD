import { useState, useMemo } from 'react';

/**
 * A reusable hook for handling data table logic: search, sort, and pagination.
 * 
 * @param {Array} data - The raw data array
 * @param {Object} options - Configuration options
 * @param {Array} options.searchFields - Fields to search through
 * @param {Object} options.initialSort - { field: 'id', direction: 'asc' }
 * @param {number} options.initialPageSize - Number of items per page (default 10)
 * @param {Array} options.availableColumns - List of { key: 'id', label: 'ID' }
 */
export const useDataTable = (data = [], { 
  searchFields = [], 
  initialSort = { field: 'id', direction: 'asc' }, 
  initialPageSize = 10,
  availableColumns = [] 
} = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState(
    availableColumns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  // 1. Filter Logic (Global Search Only)
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply Global Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    return result;
  }, [data, searchQuery, searchFields]);

  // 2. Sort Logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortConfig.field) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.field];
        let bVal = b[sortConfig.field];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (aVal === bVal) return 0;
        
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier;
        }

        return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' }) * modifier;
      });
    }
    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Pagination Logic
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const activePage = Math.min(currentPage, totalPages || 1);

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, activePage, pageSize]);

  // Actions
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    paginatedData,
    searchQuery,
    setSearchQuery: handleSearch,
    sortConfig,
    handleSort,
    currentPage: activePage,
    setCurrentPage,
    pageSize,
    setPageSize: (size) => { setPageSize(size); setCurrentPage(1); },
    totalPages,
    totalItems,
    clearFilters,
    allFilteredData: sortedData,
    visibleColumns,
    toggleColumn,
    availableColumns
  };
};
