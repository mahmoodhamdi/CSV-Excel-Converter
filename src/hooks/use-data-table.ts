import { useState, useMemo } from 'react';

interface UseDataTableOptions {
  pageSize?: number;
}

export function useDataTable(
  rows: Record<string, unknown>[],
  headers: string[],
  options: UseDataTableOptions = {}
) {
  const { pageSize = 10 } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      headers.some((header) => {
        const value = row[header];
        return value !== null && value !== undefined && String(value).toLowerCase().includes(term);
      })
    );
  }, [rows, headers, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredRows,
    sortedRows,
    paginatedRows,
    pageSize,
  };
}
