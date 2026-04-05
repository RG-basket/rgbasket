import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const AdminTableDark = ({
    columns,
    data,
    isLoading,
    onRowClick,
    pagination = true,
    itemsPerPage = 10,
    serverSidePagination = false,
    totalServerPages = 0,
    currentServerPage = 1,
    onPageChange
}) => {
    const [localPage, setLocalPage] = useState(1);
    const currentPage = serverSidePagination ? currentServerPage : localPage;
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Sorting
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // Pagination
    const totalPages = serverSidePagination ? totalServerPages : Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = (pagination && !serverSidePagination)
        ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : sortedData;

    const handlePageChange = (newPage) => {
        if (serverSidePagination) {
            onPageChange && onPageChange(newPage);
        } else {
            setLocalPage(newPage);
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (isLoading) {
        return (
            <div className={`w-full h-64 flex items-center justify-center ${tw.bgSecondary} rounded-xl border ${tw.borderPrimary}`}>
                <div className="w-10 h-10 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden shadow-lg`}>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#414868] scrollbar-track-transparent">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${tw.borderPrimary} ${tw.bgInput}`}>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold ${tw.textSecondary} uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-[#7aa2f7]' : ''
                                        }`}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                                        {column.label}
                                        {column.sortable && sortConfig.key === column.key && (
                                            sortConfig.direction === 'asc'
                                                ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                                : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${tw.borderSecondary}`}>
                        {paginatedData.map((item, rowIndex) => (
                            <tr
                                key={item._id || rowIndex}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`transition-all duration-200 ${onRowClick ? 'cursor-pointer hover:bg-[#414868]/50 active:bg-[#414868]' : 'hover:bg-[#414868]/30'
                                    }`}
                            >
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${tw.textPrimary}`}>
                                        {column.render ? column.render(item[column.key], item) : <span className="truncate max-w-[150px] block">{item[column.key]}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className={`px-3 sm:px-6 py-3 sm:py-4 border-t ${tw.borderPrimary} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                    <div className={`text-[11px] sm:text-sm ${tw.textSecondary} order-2 sm:order-1`}>
                        {serverSidePagination
                            ? `Showing page ${currentPage} of ${totalPages}`
                            : `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, data.length)} of ${data.length}`
                        }
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-1.5 sm:p-2 rounded-lg ${tw.borderPrimary} border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#414868] ${tw.textPrimary} transition-colors`}
                        >
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            <span className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg ${tw.bgInput} ${tw.accentBlue} text-xs sm:text-sm font-bold border ${tw.borderPrimary}`}>
                                {currentPage}
                            </span>
                            <span className={`text-xs ${tw.textSecondary}`}>/ {totalPages}</span>
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 sm:p-2 rounded-lg ${tw.borderPrimary} border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#414868] ${tw.textPrimary} transition-colors`}
                        >
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTableDark;
