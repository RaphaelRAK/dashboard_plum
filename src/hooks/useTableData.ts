import { useState, useMemo } from 'react';

export const useTableData = <T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  pageSize: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return searchTerm
      ? data.filter(item =>
          searchFields.some(field =>
            String(item[field]).toLowerCase().includes(searchLower)
          )
        )
      : data;
  }, [data, searchTerm, searchFields]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return {
    paginatedData,
    total: filteredData.length,
    currentPage,
    setCurrentPage
  };
}; 